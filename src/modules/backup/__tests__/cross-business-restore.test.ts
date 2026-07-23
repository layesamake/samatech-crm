import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/infrastructure/database/db';
import { ManageBackupsUseCase } from '../application/manage-backups';
import { DexieBackupRepository } from '../infrastructure/dexie-backup-repository';

const fixedNow = () => new Date('2026-07-18T10:30:00.000Z');
const useCase = new ManageBackupsUseCase(new DexieBackupRepository(), undefined, undefined, fixedNow);

async function resetDatabase() {
  db.close();
  await db.delete();
  await db.open();
}

describe('Restore Cross-Business', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('restaure les données métier tout en préservant l\'identité et la configuration du business cible', async () => {
    const now = fixedNow().toISOString();

    // 1. Simuler l'état du "Business A" avant l'export
    await db.settings.put({ key: 'company.profile', value: { name: 'BUSINESS A', currencyCode: 'XOF', currencySymbol: 'CFA' }, schemaVersion: 1, updatedAt: now });
    await db.settings.put({ key: 'invoice.defaults', value: { prefix: 'FAC-A-' }, schemaVersion: 1, updatedAt: now });
    await db.sequences.put({ key: 'invoice:2026', prefix: 'FAC-A-', nextValue: 15, padding: 4, updatedAt: now });
    await db.contacts.put({ id: 'contact-a', displayName: 'Prospect A', whatsappPhone: '221770000000', normalizedWhatsappPhone: '+221770000000', source: 'REFERRAL', createdAt: now, updatedAt: now });
    await db.clientProfiles.put({ id: 'client1', contactId: 'contact-a', convertedAt: now, clientNumber: 'CLI-01', createdAt: now, updatedAt: now });
    await db.invoices.put({ 
      id: 'invoice-a', 
      number: 'FAC-A-0010', 
      status: 'BROUILLON', 
      issueDate: now, 
      currency: 'XOF',
      currencyScale: 0,
      subtotalMinor: 0,
      discountTotalMinor: 0,
      taxTotalMinor: 0,
      grandTotalMinor: 0,
      paidTotalMinor: 0,
      balanceMinor: 0,
      createdAt: now, 
      updatedAt: now,
      clientProfileId: 'client1',
      clientSnapshot: { displayName: 'Prospect A', phone: '+221770000000', address: '' },
      companySnapshot: { displayName: 'BUSINESS A', address: '', phone: '' }
    });
    // 2. Créer le backup de A
    const preparedBackup = await useCase.prepareExport('business_A', 'BUSINESS A');
    
    // 3. Simuler le passage à "Business B" (Effacement et initialisation)
    await resetDatabase();
    
    await db.settings.put({ key: 'company.profile', value: { name: 'BUSINESS B', logoDataUri: 'LOGO_B', currencyCode: 'EUR', currencySymbol: '€' }, schemaVersion: 1, updatedAt: now });
    await db.settings.put({ key: 'invoice.defaults', value: { prefix: 'FAC-B-' }, schemaVersion: 1, updatedAt: now });
    await db.sequences.put({ key: 'invoice:2026', prefix: 'FAC-B-', nextValue: 5, padding: 4, updatedAt: now });
    // B n'a pas de contacts ou factures encore

    // 4. Restaurer le backup de A dans B
    // L'enveloppe de A est passée à restore. Le code de restore doit remplacer les collections
    // TOUT EN conservant la configuration (settings, sequences, securitySettings) de B.
    await useCase.restore(preparedBackup.envelope);

    // 5. Vérifications
    const profile = await db.settings.get('company.profile');
    expect(profile?.value).toMatchObject({
      name: 'BUSINESS B',
      logoDataUri: 'LOGO_B',
      currencyCode: 'EUR',
      currencySymbol: '€'
    });

    const invoiceDefaults = await db.settings.get('invoice.defaults');
    expect(invoiceDefaults?.value).toMatchObject({
      prefix: 'FAC-B-'
    });

    const sequence = await db.sequences.get('invoice:2026');
    expect(sequence).toMatchObject({
      prefix: 'FAC-B-',
      nextValue: 5
    });

    // Les données métier de A doivent être là
    const contactA = await db.contacts.get('contact-a');
    expect(contactA?.displayName).toBe('Prospect A');

    const invoiceA = await db.invoices.get('invoice-a');
    expect(invoiceA?.number).toBe('FAC-A-0010');
  });
});
