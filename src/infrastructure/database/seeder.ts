import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { ContactRecord, ProspectProfileRecord, NoteRecord, ProspectStatus, InterestLevel } from '../../modules/prospects/domain/prospect';
import { LocationRecord } from '../../modules/locations/domain/location';
import { CategoryRecord, ProductRecord } from '../../modules/catalog/domain/catalog';

export async function seedDatabase() {
  const now = new Date().toISOString();

  // Locations
  const location1: LocationRecord = { id: uuidv4(), name: 'Dakar', normalizedName: 'dakar', level: 'REGION', createdAt: now, updatedAt: now };
  const location2: LocationRecord = { id: uuidv4(), name: 'Thiès', normalizedName: 'thies', level: 'REGION', createdAt: now, updatedAt: now };
  
  await db.locations.bulkPut([location1, location2]);

  // Categories
  const cat1: CategoryRecord = { id: uuidv4(), name: 'Services Informatiques', normalizedName: 'services informatiques', createdAt: now, updatedAt: now };
  const cat2: CategoryRecord = { id: uuidv4(), name: 'Matériel', normalizedName: 'materiel', createdAt: now, updatedAt: now };
  
  await db.categories.bulkPut([cat1, cat2]);

  // Products
  const prod1: ProductRecord = { id: uuidv4(), name: 'Consultation SI', normalizedName: 'consultation si', type: 'SERVICE', categoryId: cat1.id, unitPriceMinor: 50000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now };
  const prod2: ProductRecord = { id: uuidv4(), name: 'Développement Web', normalizedName: 'developpement web', type: 'SERVICE', categoryId: cat1.id, unitPriceMinor: 250000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now };
  const prod3: ProductRecord = { id: uuidv4(), name: 'Licence Windows', normalizedName: 'licence windows', type: 'PRODUCT', categoryId: cat2.id, unitPriceMinor: 100000, currency: 'XOF', currencyScale: 0, isActive: true, createdAt: now, updatedAt: now };
  
  await db.products.bulkPut([prod1, prod2, prod3]);

  // Contacts & Prospects
  const contacts: ContactRecord[] = [];
  const profiles: ProspectProfileRecord[] = [];
  const notes: NoteRecord[] = [];

  const sampleContacts: { name: string, phone: string, status: ProspectStatus, interest: InterestLevel, email?: string, company?: string }[] = [
    { name: 'Ahmadou Bamba', phone: '+221770000001', status: 'NOUVEAU', interest: 'CHAUD', company: 'SenTech' },
    { name: 'Fatou Diop', phone: '+221770000002', status: 'INTERESSE', interest: 'TIEDE', email: 'fatou@example.com' },
    { name: 'Cheikh Fall', phone: '+221770000003', status: 'CONTACTE', interest: 'FROID' },
    { name: 'Mariama Sy', phone: '+221770000004', status: 'NEGOCIATION', interest: 'CHAUD' },
    { name: 'Ousmane Sow', phone: '+221770000005', status: 'CONVERTI', interest: 'CHAUD' },
    { name: 'Aissatou Ndiaye', phone: '+221770000006', status: 'NOUVEAU', interest: 'NON_QUALIFIE' },
    { name: 'Moussa Diagne', phone: '+221770000007', status: 'PERDU', interest: 'FROID', company: 'Dakar Auto' },
  ];

  for (const s of sampleContacts) {
    const contactId = uuidv4();
    const profileId = uuidv4();
    
    contacts.push({
      id: contactId,
      displayName: s.name,
      firstName: s.name.split(' ')[0],
      lastName: s.name.split(' ')[1] || '',
      companyName: s.company,
      email: s.email,
      whatsappPhone: s.phone,
      normalizedWhatsappPhone: s.phone.replace('+', ''),
      locationId: Math.random() > 0.5 ? location1.id : location2.id,
      source: 'WHATSAPP',
      createdAt: now,
      updatedAt: now,
    });
    
    profiles.push({
      id: profileId,
      contactId: contactId,
      status: s.status,
      interestLevel: s.interest,
      firstContactDate: now.split('T')[0],
      convertedAt: s.status === 'CONVERTI' ? now : undefined,
      lastStatusChangedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    
    notes.push({
      id: uuidv4(),
      contactId: contactId,
      content: `Prospect ajouté via le générateur de données de test. Profil intéressant pour nos services.`,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ---------------------------------------------------------
  // Clients, Factures et Paiements
  // ---------------------------------------------------------
  const clientProfiles: unknown[] = [];
  const invoices: unknown[] = [];
  const invoiceLines: unknown[] = [];
  const payments: unknown[] = [];

  // Also force some extra ones just to have data
  const clientContacts = [contacts[4], contacts[1]]; // Ousmane Sow, Fatou Diop
  
  for (const contact of clientContacts) {
    const clientProfileId = uuidv4();
    clientProfiles.push({
      id: clientProfileId,
      contactId: contact.id,
      convertedAt: now,
      clientNumber: `CLI-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      createdAt: now,
      updatedAt: now,
    });

    // Create Invoices for this client
    
    // 1. Facture payée (Encaissement)
    const inv1Id = uuidv4();
    const inv1Total = 50000;
    invoices.push({
      id: inv1Id,
      number: `FAC-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      clientProfileId: clientProfileId,
      status: 'PAYEE',
      issueDate: '2026-07-01',
      dueDate: '2026-07-15',
      currency: 'XOF',
      currencyScale: 0,
      subtotalMinor: inv1Total,
      taxesMinor: 0,
      grandTotalMinor: inv1Total,
      paidTotalMinor: inv1Total,
      balanceMinor: 0,
      clientSnapshot: { displayName: contact.displayName },
      companySnapshot: { displayName: 'SAMTECH' },
      createdAt: now,
      updatedAt: now,
      issuedAt: '2026-07-01T10:00:00Z',
    });
    invoiceLines.push({
      id: uuidv4(),
      invoiceId: inv1Id,
      productId: prod1.id,
      position: 0,
      quantityScaled: 1,
      quantityScale: 0,
      unitPriceMinor: inv1Total,
      totalMinor: inv1Total,
      description: 'Consultation SI',
      createdAt: now,
      updatedAt: now,
    });
    payments.push({
      id: uuidv4(),
      invoiceId: inv1Id,
      clientProfileId: clientProfileId,
      paymentDate: '2026-07-10',
      method: 'VIREMENT',
      status: 'VALIDE',
      amountMinor: inv1Total,
      currency: 'XOF',
      currencyScale: 0,
      createdAt: now,
    });

    // 2. Facture en retard (Créance en retard)
    const inv2Id = uuidv4();
    const inv2Total = 250000;
    invoices.push({
      id: inv2Id,
      number: `FAC-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      clientProfileId: clientProfileId,
      status: 'EMISE',
      issueDate: '2026-06-01',
      dueDate: '2026-06-30', // Overdue
      currency: 'XOF',
      currencyScale: 0,
      subtotalMinor: inv2Total,
      taxesMinor: 0,
      grandTotalMinor: inv2Total,
      paidTotalMinor: 0,
      balanceMinor: inv2Total,
      clientSnapshot: { displayName: contact.displayName },
      companySnapshot: { displayName: 'SAMTECH' },
      createdAt: now,
      updatedAt: now,
      issuedAt: '2026-06-01T10:00:00Z',
    });
    invoiceLines.push({
      id: uuidv4(),
      invoiceId: inv2Id,
      productId: prod2.id,
      position: 0,
      quantityScaled: 1,
      quantityScale: 0,
      unitPriceMinor: inv2Total,
      totalMinor: inv2Total,
      description: 'Développement Web',
      createdAt: now,
      updatedAt: now,
    });

    // 3. Facture actuelle (Créance non échue)
    const inv3Id = uuidv4();
    const inv3Total = 100000;
    invoices.push({
      id: inv3Id,
      number: `FAC-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      clientProfileId: clientProfileId,
      status: 'EMISE',
      issueDate: '2026-07-15',
      dueDate: '2026-07-30', // Not yet due
      currency: 'XOF',
      currencyScale: 0,
      subtotalMinor: inv3Total,
      taxesMinor: 0,
      grandTotalMinor: inv3Total,
      paidTotalMinor: 0,
      balanceMinor: inv3Total,
      clientSnapshot: { displayName: contact.displayName },
      companySnapshot: { displayName: 'SAMTECH' },
      createdAt: now,
      updatedAt: now,
      issuedAt: '2026-07-15T10:00:00Z',
    });
    invoiceLines.push({
      id: uuidv4(),
      invoiceId: inv3Id,
      productId: prod3.id,
      position: 0,
      quantityScaled: 1,
      quantityScale: 0,
      unitPriceMinor: inv3Total,
      totalMinor: inv3Total,
      description: 'Licence Windows',
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.contacts.bulkPut(contacts);
  await db.prospectProfiles.bulkPut(profiles);
  await db.notes.bulkPut(notes);
  await db.clientProfiles.bulkPut(clientProfiles);
  await db.invoices.bulkPut(invoices);
  await db.invoiceLines.bulkPut(invoiceLines);
  await db.payments.bulkPut(payments);

  return { success: true, count: sampleContacts.length + invoices.length };
}
