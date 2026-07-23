import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { SamtechCRMDatabase } from './db';

const V11_STORES = {
  contacts: 'id, normalizedWhatsappPhone', prospectProfiles: 'id, &contactId', settings: '&key', sequences: '&key',
  locations: 'id', categories: 'id', products: 'id', prospectInterests: 'id', followUps: 'id', messageTemplates: 'id',
  timelineEvents: 'id', clientProfiles: 'id, &contactId', tags: 'id', contactTags: 'id', notes: 'id', invoices: 'id, &number',
  invoiceLines: 'id', payments: 'id', campaigns: 'id', campaignRecipients: 'id, &[campaignId+contactId]',
  securitySettings: '&id', expenses: 'id'
};

describe('Migration Dexie V11 vers V12', () => {
  const name = 'samtech-v11-v12-migration';
  afterEach(async () => Dexie.delete(name));

  it('préserve les données existantes et ajoute les 5 collections treasury', async () => {
    // Étape 1 : Créer la base V11 et insérer une donnée par table existante
    const v11 = new Dexie(name);
    v11.version(11).stores(V11_STORES);
    await v11.open();
    
    for (const table of Object.keys(V11_STORES)) {
      const record: Record<string, unknown> = table === 'settings' || table === 'sequences' ? { key: `${table}-1` } : { id: `${table}-1` };
      if (table === 'contacts') Object.assign(record, { normalizedWhatsappPhone: '+221770000001' });
      if (table === 'prospectProfiles' || table === 'clientProfiles') Object.assign(record, { contactId: 'contacts-1' });
      if (table === 'invoices') Object.assign(record, { number: 'FAC-1' });
      if (table === 'campaignRecipients') Object.assign(record, { campaignId: 'campaigns-1', contactId: 'contacts-1' });
      await v11.table(table).add(record);
    }
    v11.close();

    // Étape 2 : Ouvrir avec la classe V12 (SamtechCRMDatabase)
    const v12 = new SamtechCRMDatabase(name);
    await v12.open();
    expect(v12.verno).toBeGreaterThanOrEqual(13);
    
    for (const table of Object.keys(V11_STORES)) {
      expect(await v12.table(table).count(), `Donnée perdue dans ${table}`).toBe(1);
    }

    // Tester l'ajout dans les nouvelles tables
    await v12.treasuryAccounts.add({
      id: 'acc-1', name: 'Caisse Principale', normalizedName: 'caisseprincipale', type: 'CASH', currency: 'XOF', currencyScale: 0,
      openingBalanceMinor: 0, openingDate: '2023-01-01', createdAt: '2023-01-01', updatedAt: '2023-01-01'
    });
    expect(await v12.treasuryAccounts.count()).toBe(1);
    
    v12.close();

    // Étape 3 : Réouverture pour certifier la persistance
    const reopened = new SamtechCRMDatabase(name);
    await reopened.open();
    expect(await reopened.treasuryAccounts.count()).toBe(1);
    reopened.close();
  });
});
