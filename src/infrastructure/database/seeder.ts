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

  await db.contacts.bulkPut(contacts);
  await db.prospectProfiles.bulkPut(profiles);
  await db.notes.bulkPut(notes);

  return { success: true, count: sampleContacts.length };
}
