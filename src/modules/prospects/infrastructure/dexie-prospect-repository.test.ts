import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../../infrastructure/database/db';
import { DexieProspectRepository } from './dexie-prospect-repository';
import { Prospect, ProspectStatus } from '../domain/prospect';

describe('DexieProspectRepository', () => {
  let repository: DexieProspectRepository;

  beforeEach(async () => {
    repository = new DexieProspectRepository();
    await db.open();
    await db.contacts.clear();
    await db.prospectProfiles.clear();
  });

  afterEach(async () => {
    await db.close();
  });

  const createTestProspect = (id: string, name: string, phone: string, status: ProspectStatus = 'NOUVEAU', archived: boolean = false): Prospect => {
    const now = new Date().toISOString();
    return {
      contact: {
        id: `contact-${id}`,
        displayName: name,
        whatsappPhone: phone,
        normalizedWhatsappPhone: phone,
        createdAt: now,
        updatedAt: now,
        archivedAt: archived ? now : undefined,
      },
      profile: {
        id: `profile-${id}`,
        contactId: `contact-${id}`,
        status: status,
        interestLevel: 'NON_QUALIFIE',
        firstContactDate: '2026-07-17',
        lastStatusChangedAt: now,
        createdAt: now,
        updatedAt: now,
        archivedAt: archived ? now : undefined,
      }
    };
  };

  it('devrait sauvegarder et récupérer un prospect', async () => {
    const prospect = createTestProspect('1', 'Jean Dupont', '771234567');
    
    await repository.save(prospect);
    
    const retrieved = await repository.getById('contact-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.contact.displayName).toBe('Jean Dupont');
    expect(retrieved?.profile.status).toBe('NOUVEAU');
  });

  it('devrait trouver par numéro normalisé', async () => {
    const prospect = createTestProspect('1', 'Jean Dupont', '771234567');
    await repository.save(prospect);
    
    const found = await repository.findByNormalizedWhatsapp('771234567');
    expect(found).not.toBeNull();
    expect(found?.displayName).toBe('Jean Dupont');

    const notFound = await repository.findByNormalizedWhatsapp('779999999');
    expect(notFound).toBeNull();
  });

  it('devrait archiver un prospect', async () => {
    const prospect = createTestProspect('1', 'Jean Dupont', '771234567');
    await repository.save(prospect);
    
    await repository.archive('contact-1');
    
    const retrieved = await repository.getById('contact-1');
    expect(retrieved?.contact.archivedAt).toBeDefined();
    expect(retrieved?.profile.archivedAt).toBeDefined();
  });

  it('devrait rechercher et filtrer les prospects', async () => {
    await repository.save(createTestProspect('1', 'Alice', '111', 'NOUVEAU'));
    await repository.save(createTestProspect('2', 'Bob', '222', 'CONTACTE'));
    await repository.save(createTestProspect('3', 'Charlie', '333', 'CONTACTE', true)); // Archivé

    // Sans filtres (exclut les archivés par défaut)
    const allActive = await repository.search({});
    expect(allActive.length).toBe(2);

    // Filtre par nom
    const searchAlice = await repository.search({ query: 'ali' });
    expect(searchAlice.length).toBe(1);
    expect(searchAlice[0].contact.displayName).toBe('Alice');

    // Filtre par statut
    const searchContacte = await repository.search({ status: ['CONTACTE'] });
    expect(searchContacte.length).toBe(1);
    expect(searchContacte[0].contact.displayName).toBe('Bob');

    // Inclure les archivés
    const allIncludingArchived = await repository.search({ showArchived: true });
    expect(allIncludingArchived.length).toBe(3);
  });
});
