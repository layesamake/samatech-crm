import { describe, expect, it } from 'vitest';
import type { CampaignDraftInput, CampaignSegmentationData } from '../domain/campaign';
import { buildCampaignPreview, calculateCampaignProgress, segmentationSummary } from '../domain/campaign';

const now = '2026-07-18T10:00:00.000Z';
const ids = {
  region: '10000000-0000-4000-8000-000000000001', city: '10000000-0000-4000-8000-000000000002', thies: '10000000-0000-4000-8000-000000000003',
  requested: '20000000-0000-4000-8000-000000000001', purchased: '20000000-0000-4000-8000-000000000002', draftOnly: '20000000-0000-4000-8000-000000000003', cancelledOnly: '20000000-0000-4000-8000-000000000004',
  p1: '30000000-0000-4000-8000-000000000001', p2: '30000000-0000-4000-8000-000000000002', client: '30000000-0000-4000-8000-000000000003', archived: '30000000-0000-4000-8000-000000000004', invalid: '30000000-0000-4000-8000-000000000005', duplicate: '30000000-0000-4000-8000-000000000006',
  tag: '40000000-0000-4000-8000-000000000001',
};

function data(): CampaignSegmentationData {
  const contacts = [
    { id: ids.p1, displayName: 'Awa', firstName: 'Awa', companyName: 'Awa SARL', whatsappPhone: '+221770000001', normalizedWhatsappPhone: '+221770000001', locationId: ids.city, source: 'REFERRAL' as const, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: now },
    { id: ids.p2, displayName: 'Binta', firstName: 'Binta', whatsappPhone: '+221770000002', normalizedWhatsappPhone: '+221770000002', locationId: ids.thies, source: 'MANUAL' as const, createdAt: '2026-03-01T00:00:00.000Z', updatedAt: now },
    { id: ids.client, displayName: 'Client C', firstName: 'Cheikh', whatsappPhone: '+221770000003', normalizedWhatsappPhone: '+221770000003', locationId: ids.city, source: 'EVENT' as const, createdAt: '2026-01-15T00:00:00.000Z', updatedAt: now },
    { id: ids.archived, displayName: 'Archivé', firstName: 'Archive', whatsappPhone: '+221770000004', normalizedWhatsappPhone: '+221770000004', locationId: ids.city, createdAt: '2026-01-20T00:00:00.000Z', updatedAt: now, archivedAt: now },
    { id: ids.invalid, displayName: 'Invalide', firstName: 'Invalide', whatsappPhone: '12', normalizedWhatsappPhone: '12', locationId: ids.city, createdAt: '2026-01-25T00:00:00.000Z', updatedAt: now },
    { id: ids.duplicate, displayName: 'Doublon', firstName: 'Doublon', whatsappPhone: '+221770000001', normalizedWhatsappPhone: '+221770000001', locationId: ids.city, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: now },
  ];
  const prospectProfiles = contacts.map((contact, index) => ({ id: `50000000-0000-4000-8000-00000000000${index + 1}`, contactId: contact.id, status: contact.id === ids.client ? 'CONVERTI' as const : contact.id === ids.p2 ? 'NOUVEAU' as const : 'INTERESSE' as const, interestLevel: contact.id === ids.p2 ? 'FROID' as const : 'CHAUD' as const, firstContactDate: '2026-01-01', lastStatusChangedAt: now, createdAt: contact.createdAt, updatedAt: now }));
  const clientProfileId = '60000000-0000-4000-8000-000000000001';
  const invoice = (id: string, status: 'EMISE' | 'BROUILLON' | 'ANNULEE') => ({ id, clientProfileId, number: status === 'BROUILLON' ? undefined : `FAC-${id.slice(-1)}`, status, issueDate: '2026-01-10', currency: 'XOF', currencyScale: 0, companySnapshot: { displayName: 'SAMTECH' }, clientSnapshot: { displayName: 'Client C' }, subtotalMinor: 1, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 1, paidTotalMinor: 0, balanceMinor: status === 'ANNULEE' ? 0 : 1, createdAt: now, updatedAt: now });
  const line = (id: string, invoiceId: string, productId: string) => ({ id, invoiceId, productId, position: 0, designationSnapshot: 'Produit', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 1, grossMinor: 1, discountType: 'NONE' as const, discountValue: 0, discountMinor: 0, taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 1, createdAt: now, updatedAt: now });
  return {
    contacts, prospectProfiles,
    clientProfiles: [{ id: clientProfileId, contactId: ids.client, convertedAt: now, createdAt: now, updatedAt: now }],
    locations: [{ id: ids.region, name: 'Dakar', normalizedName: 'dakar', level: 'REGION', createdAt: now, updatedAt: now }, { id: 'dept-dakar', name: 'Dakar Dept', normalizedName: 'dakar dept', level: 'DEPARTMENT', parentId: ids.region, createdAt: now, updatedAt: now }, { id: ids.city, name: 'Dakar Ville', normalizedName: 'dakar ville', level: 'CITY', parentId: 'dept-dakar', createdAt: now, updatedAt: now }, { id: ids.thies, name: 'Thiès', normalizedName: 'thies', level: 'CITY', createdAt: now, updatedAt: now }],
    products: [ids.requested, ids.purchased, ids.draftOnly, ids.cancelledOnly].map((id, index) => ({ id, name: ['Formation', 'Audit', 'Brouillon', 'Annulé'][index], normalizedName: `p${index}`, type: 'SERVICE', unitPriceMinor: 1, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now })),
    prospectInterests: [{ id: '70000000-0000-4000-8000-000000000001', prospectProfileId: prospectProfiles[0].id, productId: ids.requested, requestedAt: now, createdAt: now, updatedAt: now }, { id: '70000000-0000-4000-8000-000000000002', prospectProfileId: prospectProfiles[1].id, productId: ids.purchased, requestedAt: now, createdAt: now, updatedAt: now }],
    tags: [{ id: ids.tag, name: 'VIP', normalizedName: 'vip', createdAt: now, updatedAt: now }], contactTags: [{ id: '80000000-0000-4000-8000-000000000001', contactId: ids.p1, tagId: ids.tag, createdAt: now }],
    invoices: [invoice('90000000-0000-4000-8000-000000000001', 'EMISE'), invoice('90000000-0000-4000-8000-000000000002', 'BROUILLON'), invoice('90000000-0000-4000-8000-000000000003', 'ANNULEE')],
    invoiceLines: [line('91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', ids.purchased), line('91000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000002', ids.draftOnly), line('91000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000003', ids.cancelledOnly)],
    timelineEvents: [{ id: '92000000-0000-4000-8000-000000000001', contactId: ids.p1, type: 'NOTE_ADDED', occurredAt: '2026-05-01T00:00:00.000Z', createdAt: now, title: 'Note', payloadVersion: 1 }, { id: '92000000-0000-4000-8000-000000000002', contactId: ids.p2, type: 'FOLLOW_UP_COMPLETED', occurredAt: '2026-07-10T00:00:00.000Z', createdAt: now, title: 'Relance', payloadVersion: 1 }],
  };
}

function input(criteria: CampaignDraftInput['criteria'] = {}, audienceType: CampaignDraftInput['audienceType'] = 'PROSPECTS', messageSnapshot = 'Bonjour {{prenom}} — {{produit}} — {{nom_entreprise}}'): CampaignDraftInput {
  return { name: 'Campagne test', audienceType, criteria, messageSnapshot };
}

describe('Segmentation pure des campagnes', () => {
  it('sépare prospects, clients et tous les contacts sans dupliquer le converti', () => {
    expect(buildCampaignPreview(input(), data(), 'SAMTECH').entries.some((item) => item.contactId === ids.client)).toBe(false);
    expect(buildCampaignPreview(input({}, 'CLIENTS'), data(), 'SAMTECH').entries.map((item) => item.contactId)).toEqual([ids.client]);
    const all = buildCampaignPreview(input({}, 'ALL_CONTACTS'), data(), 'SAMTECH');
    expect(all.entries.filter((item) => item.contactId === ids.client)).toHaveLength(1);
  });

  it('combine les familles par ET, les valeurs par OU et inclut les descendants de région', () => {
    const preview = buildCampaignPreview(input({ locationIds: [ids.region], productInterestIds: [ids.requested], prospectStatuses: ['INTERESSE'], interestLevels: ['CHAUD'], tagIds: [ids.tag], sources: ['REFERRAL'], createdFrom: '2026-01-01', createdTo: '2026-01-31', inactiveSince: '2026-06-01' }), data(), 'SAMTECH');
    expect(preview.entries.find((item) => item.contactId === ids.p1)?.eligible).toBe(true);
    expect(preview.entries.find((item) => item.contactId === ids.p2)?.eligible).toBe(false);
    expect(segmentationSummary({ locationIds: [ids.region], sources: ['REFERRAL', 'EVENT'] })).toContain('ET');
  });

  it('utilise les achats réels et exclut brouillons et factures annulées', () => {
    expect(buildCampaignPreview(input({ purchasedProductIds: [ids.purchased] }, 'CLIENTS'), data(), 'SAMTECH').eligibleCount).toBe(1);
    expect(buildCampaignPreview(input({ purchasedProductIds: [ids.draftOnly] }, 'CLIENTS'), data(), 'SAMTECH').eligibleCount).toBe(0);
    expect(buildCampaignPreview(input({ purchasedProductIds: [ids.cancelledOnly] }, 'CLIENTS'), data(), 'SAMTECH').eligibleCount).toBe(0);
  });

  it('explique archivage, numéro invalide, exclusion manuelle et doublon de numéro', () => {
    const preview = buildCampaignPreview(input({ excludedContactIds: [ids.p2] }, 'PROSPECTS', 'Bonjour {{prenom}}'), data(), 'SAMTECH');
    expect(preview.archivedCount).toBe(1); expect(preview.invalidPhoneCount).toBe(1); expect(preview.manualExclusionCount).toBe(1); expect(preview.duplicateCount).toBe(1);
    expect(preview.entries.find((item) => item.contactId === ids.p1)?.eligible).toBe(true);
    expect(preview.entries.find((item) => item.contactId === ids.duplicate)?.eligible).toBe(false);
  });

  it('bloque une variable absente jusqu’à confirmation explicite de substitution vide', () => {
    const blocked = buildCampaignPreview(input({}, 'PROSPECTS', 'Société {{entreprise}}'), data(), 'SAMTECH');
    expect(blocked.entries.find((item) => item.contactId === ids.p2)?.unresolvedVariables).toEqual(['entreprise']);
    const allowed = buildCampaignPreview(input({ allowEmptyVariableContactIds: [ids.p2] }, 'PROSPECTS', 'Société {{entreprise}}'), data(), 'SAMTECH');
    expect(allowed.entries.find((item) => item.contactId === ids.p2)?.resolvedMessage).toBe('Société ');
  });

  it('signale une variable inconnue et garde un ordre stable', () => {
    const preview = buildCampaignPreview(input({}, 'PROSPECTS', 'Bonjour {{inconnue}}'), data(), 'SAMTECH');
    expect(preview.unknownVariables).toEqual(['inconnue']); expect(preview.eligibleCount).toBe(0);
    expect(preview.entries.map((item) => item.contactId)).toEqual([ids.p1, ids.archived, ids.invalid, ids.duplicate, ids.p2]);
  });

  it('calcule la progression uniquement depuis les destinataires', () => {
    const base = { campaignId: 'c', contactId: 'x', normalizedPhoneSnapshot: '+221770000000', displayNameSnapshot: 'X', resolvedMessageSnapshot: 'Bonjour', createdAt: now, updatedAt: now };
    const recipients = ['A_TRAITER', 'OUVERT_DANS_WHATSAPP', 'CONFIRME_CONTACTE', 'IGNORE', 'ERREUR'].map((status, position) => ({ ...base, id: String(position), position, status: status as 'A_TRAITER' | 'OUVERT_DANS_WHATSAPP' | 'CONFIRME_CONTACTE' | 'IGNORE' | 'ERREUR' }));
    expect(calculateCampaignProgress(recipients)).toMatchObject({ total: 5, pending: 1, opened: 1, confirmed: 1, ignored: 1, errors: 1, finalized: 3, processedPercent: 60, confirmationPercent: 20 });
  });
});
