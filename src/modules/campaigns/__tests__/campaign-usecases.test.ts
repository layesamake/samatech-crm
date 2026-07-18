import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { FixedClock } from '@/modules/follow-ups/domain/follow-up';
import { ManageCampaignsUseCase } from '../application/manage-campaigns';

const now = '2026-07-18T12:00:00.000Z';
const contactIds = ['31000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000003'];

describe('Cycle transactionnel des campagnes assistées', () => {
  const clock = new FixedClock(new Date(now)); let manage: ManageCampaignsUseCase;
  const templateId = '33000000-0000-4000-8000-000000000001';
  const draft = (messageSnapshot = 'Bonjour {{prenom}} — {{nom_entreprise}}') => ({ name: 'Prospection Dakar', objective: 'Reprendre contact', audienceType: 'PROSPECTS' as const, criteria: {}, messageTemplateId: templateId, messageSnapshot });

  beforeEach(async () => {
    await db.transaction('rw', db.tables, async () => Promise.all(db.tables.map((table) => table.clear())));
    await db.settings.add({ key: 'company.profile', value: { name: 'SAMTECH', phone: '+221330000000' }, schemaVersion: 1, updatedAt: now });
    await db.messageTemplates.add({ id: templateId, name: 'Modèle campagne', category: 'PROMOTION', content: 'Bonjour {{prenom}} — {{nom_entreprise}}', variables: ['prenom', 'nom_entreprise'], isActive: true, createdAt: now, updatedAt: now });
    for (let index = 0; index < contactIds.length; index += 1) {
      await db.contacts.add({ id: contactIds[index], displayName: `Contact ${index + 1}`, firstName: `Prénom${index + 1}`, whatsappPhone: `+22177000000${index + 1}`, normalizedWhatsappPhone: `+22177000000${index + 1}`, source: 'MANUAL', createdAt: `2026-01-0${index + 1}T00:00:00.000Z`, updatedAt: now });
      await db.prospectProfiles.add({ id: `32000000-0000-4000-8000-00000000000${index + 1}`, contactId: contactIds[index], status: 'INTERESSE', interestLevel: 'CHAUD', firstContactDate: '2026-01-01', lastStatusChangedAt: now, createdAt: now, updatedAt: now });
    }
    manage = new ManageCampaignsUseCase(undefined, clock);
  });

  it('crée, modifie, valide, lance et fige audience, ordre, téléphone, nom et messages', async () => {
    const created = await manage.create(draft()); expect(created.status).toBe('BROUILLON');
    await manage.update(created.id, { ...draft(), objective: 'Objectif corrigé' });
    expect((await manage.preview(draft())).eligibleCount).toBe(3);
    await manage.markReady(created.id); expect((await manage.get(created.id))?.campaign.status).toBe('PRETE');
    const launched = await manage.launch(created.id); expect(launched.campaign.status).toBe('EN_COURS'); expect(launched.recipients).toHaveLength(3); expect(launched.recipients.map((item) => item.position)).toEqual([0, 1, 2]);
    const snapshot = launched.recipients[0];
    await db.messageTemplates.update(templateId, { isActive: false, archivedAt: now, content: 'Message modifié', updatedAt: now });
    await db.contacts.update(snapshot.contactId, { displayName: 'Nom modifié', normalizedWhatsappPhone: '+221780000000', updatedAt: now });
    await db.contacts.add({ id: '31000000-0000-4000-8000-000000000004', displayName: 'Nouveau', firstName: 'Nouveau', whatsappPhone: '+221770000004', normalizedWhatsappPhone: '+221770000004', createdAt: now, updatedAt: now });
    const unchanged = await manage.get(created.id); expect(unchanged?.recipients).toHaveLength(3); expect(unchanged?.recipients[0]).toMatchObject({ displayNameSnapshot: snapshot.displayNameSnapshot, normalizedPhoneSnapshot: snapshot.normalizedPhoneSnapshot, resolvedMessageSnapshot: snapshot.resolvedMessageSnapshot }); expect(unchanged?.template).toEqual({ name: 'Modèle campagne', archived: true });
  });

  it('ouvre WhatsApp sans confirmer puis exige une confirmation manuelle', async () => {
    const campaign = await manage.create(draft()); await manage.markReady(campaign.id); const launched = await manage.launch(campaign.id); const first = launched.recipients[0];
    await expect(manage.confirm(campaign.id, first.id)).rejects.toThrow(/Transition/);
    const opened = await manage.openWhatsApp(campaign.id, first.id); expect(opened.url).toContain('https://wa.me/221770000001?text='); expect(opened.recipient.status).toBe('OUVERT_DANS_WHATSAPP');
    expect((await manage.get(campaign.id))?.progress.confirmed).toBe(0); expect(await db.timelineEvents.where('type').equals('CAMPAIGN_PROCESSED').count()).toBe(0);
    await manage.confirm(campaign.id, first.id, 'Échange confirmé par l’utilisateur'); expect((await db.campaignRecipients.get(first.id))?.status).toBe('CONFIRME_CONTACTE'); expect(await db.timelineEvents.where('type').equals('CAMPAIGN_PROCESSED').count()).toBe(1);
  });

  it('ignore, abandonne une erreur, reprend le premier non finalisé et termine automatiquement', async () => {
    const campaign = await manage.create(draft()); await manage.markReady(campaign.id); const launched = await manage.launch(campaign.id); const [first, second, third] = launched.recipients;
    await manage.openWhatsApp(campaign.id, first.id); await manage.confirm(campaign.id, first.id);
    await manage.ignore(campaign.id, second.id, 'Pas disponible'); expect((await manage.resume(campaign.id))?.id).toBe(third.id);
    await expect(manage.error(campaign.id, third.id, undefined as never)).rejects.toThrow(/code/);
    const completed = await manage.error(campaign.id, third.id, 'CONTACT_INDISPONIBLE', 'Erreur abandonnée explicitement');
    expect(completed.progress).toMatchObject({ total: 3, confirmed: 1, ignored: 1, errors: 1, processedPercent: 100 }); expect(completed.campaign).toMatchObject({ status: 'TERMINEE', completedAt: now });
    await expect(manage.cancel(campaign.id)).rejects.toThrow(/immuable/); await expect(manage.ignore(campaign.id, third.id)).rejects.toThrow(/pas en cours/);
  });

  it('refuse campagne vide, variable inconnue et garantit le rollback du lancement', async () => {
    const empty = await manage.create({ ...draft(), criteria: { sources: ['EVENT'] } }); await expect(manage.markReady(empty.id)).rejects.toThrow(/aucun destinataire/);
    const unknown = await manage.create(draft('Bonjour {{inconnue}}')); await expect(manage.markReady(unknown.id)).rejects.toThrow(/Variables inconnues/);
    const campaign = await manage.create(draft()); await manage.markReady(campaign.id);
    const fail = () => { throw new Error('Destinataire impossible'); }; db.campaignRecipients.hook('creating').subscribe(fail);
    try { await expect(manage.launch(campaign.id)).rejects.toThrow(/impossible/); } finally { db.campaignRecipients.hook('creating').unsubscribe(fail); }
    expect(await db.campaignRecipients.where('campaignId').equals(campaign.id).count()).toBe(0); expect((await db.campaigns.get(campaign.id))?.status).toBe('PRETE');
  });

  it('gère retour en brouillon et annulation renforcée sans suppression', async () => {
    const ready = await manage.create(draft()); await manage.markReady(ready.id); await manage.backToDraft(ready.id); expect((await manage.get(ready.id))?.campaign.status).toBe('BROUILLON');
    const running = await manage.create(draft()); await manage.markReady(running.id); await manage.launch(running.id); await expect(manage.cancel(running.id)).rejects.toThrow(/explicitement/); await manage.cancel(running.id, true);
    expect((await manage.get(running.id))?.campaign.status).toBe('ANNULEE'); expect(await db.campaignRecipients.where('campaignId').equals(running.id).count()).toBe(3);
  });

  it('persiste campagne, destinataires et progression après fermeture/réouverture', async () => {
    const campaign = await manage.create(draft()); await manage.markReady(campaign.id); const launched = await manage.launch(campaign.id); await manage.ignore(campaign.id, launched.recipients[0].id);
    db.close(); await db.open(); const restored = await manage.get(campaign.id); expect(restored?.progress).toMatchObject({ total: 3, ignored: 1, pending: 2 }); expect((await manage.resume(campaign.id))?.position).toBe(1);
  });
});
