import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { ManageCommercialDocumentsUseCase } from '../application/manage-commercial-documents';
import { DexieCommercialDocumentRepository } from '../infrastructure/dexie-commercial-document-repository';
import { SystemClock } from '@/modules/follow-ups/domain/follow-up';

const now = new Date('2026-07-20T10:00:00.000Z');
class FakeClock extends SystemClock {
  override now() { return now; }
}

describe('ManageCommercialDocumentsUseCase', () => {
  const repository = new DexieCommercialDocumentRepository();
  const useCase = new ManageCommercialDocumentsUseCase(repository, new FakeClock());

  const validClientId = crypto.randomUUID();

  beforeEach(async () => {
    db.close();
    await db.delete();
    await db.open();

    await db.settings.put({ key: 'company.profile', value: { name: 'Test Co', phone: '+221 77 123 45 67' }, schemaVersion: 1, updatedAt: now.toISOString() });
    await db.settings.put({ key: 'invoice.defaults', value: { prefix: 'FAC-', nextValue: 1, currencyCode: 'XOF', defaultDueDays: 30 }, schemaVersion: 1, updatedAt: now.toISOString() });
    await db.contacts.add({ id: 'contact1', displayName: 'Client Test', whatsappPhone: '+221 77 000 00 00', normalizedWhatsappPhone: '+221770000000', source: 'OTHER', createdAt: now.toISOString(), updatedAt: now.toISOString() });
    await db.clientProfiles.add({ id: validClientId, contactId: 'contact1', convertedAt: now.toISOString(), clientNumber: 'CLI-01', createdAt: now.toISOString(), updatedAt: now.toISOString() });
  });

  it('crée un devis brouillon, l\'émet, et le convertit', async () => {
    const draft = await useCase.createDraft({
      type: 'QUOTE',
      clientProfileId: validClientId,
      currency: 'XOF',
      currencyScale: 0,
      issueDate: '2026-07-20',
      validUntil: '2026-08-20',
      lines: [
        { designation: 'Ligne 1', quantityScaled: 2, quantityScale: 0, unitPriceMinor: 5000 },
      ]
    });

    expect(draft).toBeDefined();
    expect(draft!.document.type).toBe('QUOTE');
    expect(draft!.document.status).toBe('DRAFT');
    expect(draft!.document.grandTotalMinor).toBe(10000);
    expect(draft!.lines).toHaveLength(1);

    const issued = await useCase.issue(draft!.document.id);
    expect(issued.document.status).toBe('ISSUED');
    expect(issued.document.number).toBe('DEV-2026-0001');

    const convertedId = await useCase.duplicateAsDraft(issued.document.id, 'PROFORMA');
    const proforma = await useCase.get(convertedId);
    expect(proforma!.document.type).toBe('PROFORMA');
    expect(proforma!.document.status).toBe('DRAFT');
  });

  it('gère le cycle de vie d\'un bon de livraison', async () => {
    const draft = await useCase.createDraft({
      type: 'DELIVERY_NOTE',
      clientProfileId: validClientId,
      currency: 'XOF',
      currencyScale: 0,
      issueDate: '2026-07-20',
      deliveryDate: '2026-07-25',
      lines: [
        { designation: 'Produit', quantityScaled: 10, quantityScale: 0, unitPriceMinor: 0 },
      ]
    });

    expect(draft!.document.type).toBe('DELIVERY_NOTE');
    expect(draft!.document.grandTotalMinor).toBe(0);

    const issued = await useCase.issue(draft!.document.id);
    expect(issued.document.status).toBe('ISSUED');
    expect(issued.document.number).toBe('BL-2026-0001');

    const delivered = await useCase.changeStatus(issued.document.id, 'DELIVERED');
    expect(delivered.document.status).toBe('DELIVERED');
    expect(delivered.document.deliveredAt).toBe(now.toISOString());
  });

  it('annule un document', async () => {
    const draft = await useCase.createDraft({
      type: 'PROFORMA',
      clientProfileId: validClientId,
      currency: 'XOF',
      currencyScale: 0,
      issueDate: '2026-07-20',
      lines: [
        { designation: 'Test', quantityScaled: 1, quantityScale: 0, unitPriceMinor: 1000 },
      ]
    });

    const issued = await useCase.issue(draft!.document.id);
    const cancelled = await useCase.cancel(issued.document.id, 'Erreur');
    expect(cancelled.document.status).toBe('CANCELLED');
    expect(cancelled.document.statusReason).toBe('Erreur');
  });
});
