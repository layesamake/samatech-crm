import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { ManageBackupsUseCase } from '../application/manage-backups';
import { BACKUP_FORMAT_VERSION, BACKUP_PRODUCT, BUSINESS_COLLECTIONS, calculateIntegrity, validateBackupText } from '../domain/backup';
import { DexieBackupRepository } from '../infrastructure/dexie-backup-repository';

const fixedNow = () => new Date('2026-07-18T10:30:00.000Z');
const useCase = new ManageBackupsUseCase(new DexieBackupRepository(), undefined, fixedNow);

async function resetDatabase() {
  db.close(); await db.delete(); await db.open();
}

async function seedRepresentativeData() {
  const now = fixedNow().toISOString();
  const records: Record<string, Record<string, unknown>> = {
    settings: { key: 'company.profile', value: { name: 'SENCAIILLE', address: 'Quartier Mbambara Thiès' }, schemaVersion: 1, updatedAt: now },
    sequences: { key: 'invoice:2026', prefix: 'FAC-', nextValue: 2, padding: 4, updatedAt: now },
    locations: { id: 'loc1', name: 'Thiès', normalizedName: 'thies', level: 'CITY', createdAt: now, updatedAt: now },
    categories: { id: 'cat1', name: 'Services', normalizedName: 'services', createdAt: now, updatedAt: now },
    products: { id: 'prod1', name: 'Conseil', normalizedName: 'conseil', type: 'SERVICE', categoryId: 'cat1', unitPriceMinor: 100000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now },
    contacts: { id: 'contact1', displayName: 'Client Thiès', whatsappPhone: '+221 77 648 17 82', normalizedWhatsappPhone: '+221776481782', source: 'REFERRAL', createdAt: now, updatedAt: now },
    prospectProfiles: { id: 'prospect1', contactId: 'contact1', status: 'CONVERTI', interestLevel: 'CHAUD', firstContactDate: '2026-07-01', createdAt: now, updatedAt: now },
    prospectInterests: { id: 'interest1', prospectProfileId: 'prospect1', productId: 'prod1', requestedAt: now, createdAt: now, updatedAt: now },
    clientProfiles: { id: 'client1', contactId: 'contact1', convertedAt: now, clientNumber: 'CLI-0001', createdAt: now, updatedAt: now },
    tags: { id: 'tag1', name: 'Fidèle', normalizedName: 'fidele', createdAt: now, updatedAt: now },
    contactTags: { id: 'ct1', contactId: 'contact1', tagId: 'tag1', createdAt: now },
    notes: { id: 'note1', contactId: 'contact1', content: 'Accents préservés : Thiès', pinned: false, createdAt: now, updatedAt: now },
    timelineEvents: { id: 'event1', contactId: 'contact1', type: 'INVOICE_ISSUED', occurredAt: now, title: 'Facture émise', payloadVersion: 1, createdAt: now },
    followUps: { id: 'follow1', contactId: 'contact1', channel: 'PHONE', dueAt: now, priority: 'NORMAL', status: 'PLANIFIEE', createdAt: now, updatedAt: now },
    messageTemplates: { id: 'template1', name: 'Rappel', category: 'FOLLOW_UP', content: 'Bonjour', variables: [], isActive: true, createdAt: now, updatedAt: now },
    invoices: { id: 'invoice1', number: 'FAC-2026-0001', clientProfileId: 'client1', status: 'PARTIELLEMENT_PAYEE', issueDate: '2026-07-18', currency: 'XOF', currencyScale: 0, subtotalMinor: 100000, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 100000, paidTotalMinor: 30000, balanceMinor: 70000, createdAt: now, updatedAt: now },
    invoiceLines: { id: 'line1', invoiceId: 'invoice1', productId: 'prod1', position: 0, quantityScaled: 1, quantityScale: 0, unitPriceMinor: 100000, grossMinor: 100000, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 100000, createdAt: now, updatedAt: now },
    payments: { id: 'payment1', invoiceId: 'invoice1', clientProfileId: 'client1', paymentDate: '2026-07-18', amountMinor: 30000, currency: 'XOF', currencyScale: 0, method: 'WAVE', status: 'ACTIVE', createdAt: now, updatedAt: now },
    campaigns: { id: 'campaign1', name: 'Relance', status: 'EN_COURS', audienceType: 'CLIENTS', createdAt: now, updatedAt: now },
    campaignRecipients: { id: 'recipient1', campaignId: 'campaign1', contactId: 'contact1', status: 'A_TRAITER', position: 0, normalizedPhoneSnapshot: '+221776481782', createdAt: now, updatedAt: now },
  };
  for (const [table, record] of Object.entries(records)) await db.table(table).add(record);
}

describe('Sauvegarde et restauration', () => {
  beforeEach(resetDatabase);

  it('exporte une base vide avec toutes les collections, métadonnées et checksum reproductible', async () => {
    const prepared = await useCase.prepareExport();
    expect(prepared.envelope.product).toBe(BACKUP_PRODUCT);
    expect(prepared.envelope.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(prepared.envelope.collections.map((item) => item.name)).toEqual(BUSINESS_COLLECTIONS);
    expect(prepared.envelope.metadata.recordCount).toBe(0);
    expect(await calculateIntegrity(prepared.envelope)).toBe(prepared.envelope.integrity.digest);
    await expect(validateBackupText(prepared.text)).resolves.toBeDefined();
  });

  it('exporte toutes les tables, conserve UTF-8 et exclut le PIN', async () => {
    await seedRepresentativeData();
    await db.securitySettings.put({ id: 'local-security', pinEnabled: true, pinHash: 'secret-hash', pinSalt: 'salt', pinAlgorithmVersion: 1, failedAttempts: 3, autoLockMinutes: 5, updatedAt: fixedNow().toISOString() });
    const prepared = await useCase.prepareExport();
    expect(prepared.envelope.collections.every((item) => item.count === 1)).toBe(true);
    expect(prepared.text).toContain('Thiès');
    expect(prepared.text).not.toContain('securitySettings');
    expect(prepared.text).not.toContain('secret-hash');
  });

  it('met à jour la dernière date uniquement après confirmation du téléchargement', async () => {
    const prepared = await useCase.prepareExport();
    expect(await useCase.getLastExportedAt()).toBeNull();
    await useCase.confirmExported(prepared);
    expect(await useCase.getLastExportedAt()).toBe(prepared.envelope.exportedAt);
  });

  it('remplace atomiquement les données métier et conserve la sécurité locale', async () => {
    await seedRepresentativeData();
    const prepared = await useCase.prepareExport();
    await db.contacts.clear();
    await db.contacts.add({ id: 'other', displayName: 'Autre', whatsappPhone: '+221700000000', normalizedWhatsappPhone: '+221700000000', source: 'OTHER', createdAt: fixedNow().toISOString(), updatedAt: fixedNow().toISOString() });
    await db.securitySettings.put({ id: 'local-security', pinEnabled: true, pinHash: 'local', pinSalt: 'salt', pinAlgorithmVersion: 1, failedAttempts: 0, autoLockMinutes: 5, updatedAt: fixedNow().toISOString() });
    await useCase.restore(prepared.envelope);
    expect(await db.contacts.get('contact1')).toBeDefined();
    expect(await db.contacts.get('other')).toBeUndefined();
    expect(await db.invoiceLines.get('line1')).toMatchObject({ invoiceId: 'invoice1' });
    expect((await db.securitySettings.get('local-security'))?.pinHash).toBe('local');
  });

  it('refuse formats invalides, corruption, collection manquante, doublon, orphelin et montant négatif', async () => {
    await expect(validateBackupText('')).rejects.toThrow('vide');
    await expect(validateBackupText('{')).rejects.toThrow('JSON');
    await seedRepresentativeData();
    const prepared = await useCase.prepareExport();
    const future = structuredClone(prepared.envelope); future.formatVersion = 99 as 1;
    await expect(validateBackupText(JSON.stringify(future))).rejects.toThrow('incompatible');
    const corrupt = structuredClone(prepared.envelope); corrupt.appVersion = 'altérée';
    await expect(validateBackupText(JSON.stringify(corrupt))).rejects.toThrow('intégrité');
    const missing = structuredClone(prepared.envelope); missing.collections.pop();
    await expect(validateBackupText(JSON.stringify(missing))).rejects.toThrow('obligatoire');
    const duplicate = structuredClone(prepared.envelope); const contacts = duplicate.collections.find((item) => item.name === 'contacts')!;
    contacts.records.push(structuredClone(contacts.records[0])); contacts.count += 1; duplicate.metadata.recordCount += 1; duplicate.integrity.digest = await calculateIntegrity(duplicate);
    await expect(validateBackupText(JSON.stringify(duplicate))).rejects.toThrow('dupliqué');
    const orphan = structuredClone(prepared.envelope); orphan.collections.find((item) => item.name === 'payments')!.records[0].invoiceId = 'absente'; orphan.integrity.digest = await calculateIntegrity(orphan);
    await expect(validateBackupText(JSON.stringify(orphan))).rejects.toThrow('Référence');
    const money = structuredClone(prepared.envelope); money.collections.find((item) => item.name === 'payments')!.records[0].amountMinor = -1; money.integrity.digest = await calculateIntegrity(money);
    await expect(validateBackupText(JSON.stringify(money))).rejects.toThrow('numérique');
  });

  it('refuse les clés susceptibles de polluer les prototypes', async () => {
    for (const key of ['__proto__', 'constructor', 'prototype']) {
      await expect(validateBackupText(`{"${key}":{"polluted":true}}`)).rejects.toThrow('clé interdite');
    }
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it('annule toute la transaction lors d’une erreur injectée', async () => {
    await seedRepresentativeData(); const prepared = await useCase.prepareExport();
    await db.contacts.clear(); await db.contacts.add({ id: 'before', displayName: 'Avant', whatsappPhone: '+221700000000', normalizedWhatsappPhone: '+221700000000', source: 'OTHER', createdAt: fixedNow().toISOString(), updatedAt: fixedNow().toISOString() });
    await expect(useCase.restore(prepared.envelope, undefined, async () => { throw new Error('injected'); })).rejects.toThrow('injected');
    expect(await db.contacts.get('before')).toBeDefined();
    expect(await db.contacts.get('contact1')).toBeUndefined();
  });
});
