import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { DexieProspectRepository } from '../infrastructure/dexie-prospect-repository';
import { CreateProspectUseCase } from '../application/create-prospect';
import { ListProspectsUseCase } from '../application/list-prospects';
import { ArchiveProspectUseCase } from '../application/archive-prospect';
import { UpdateProspectUseCase } from '../application/update-prospect';
import { db } from '../../../infrastructure/database/db';

describe('Prospect UseCases', () => {
  let repository: DexieProspectRepository;
  let createUseCase: CreateProspectUseCase;
  let listUseCase: ListProspectsUseCase;
  let archiveUseCase: ArchiveProspectUseCase;
  let updateUseCase: UpdateProspectUseCase;

  beforeEach(async () => {
    // Clear DB
    await db.contacts.clear();
    await db.prospectProfiles.clear();
    await db.notes.clear();
    await db.timelineEvents.clear();

    repository = new DexieProspectRepository();
    createUseCase = new CreateProspectUseCase(repository);
    listUseCase = new ListProspectsUseCase(repository);
    archiveUseCase = new ArchiveProspectUseCase(repository);
    updateUseCase = new UpdateProspectUseCase(repository);
  });

  describe('CreateProspectUseCase', () => {
    it('should create a prospect successfully', async () => {
      const result = await createUseCase.execute({
        displayName: 'John Doe',
        whatsappPhone: '+221770001122',
        status: 'NOUVEAU',
        interestLevel: 'NON_QUALIFIE',
        source: 'WHATSAPP'
      });

      expect(result.error).toBeUndefined();
      expect(result.warning).toBeUndefined();
      expect(result.prospect).toBeDefined();

      const saved = await repository.getById(result.prospect!.contact.id);
      expect(saved).not.toBeNull();
      expect(saved?.contact.displayName).toBe('John Doe');
      expect(saved?.contact.normalizedWhatsappPhone).toBe('+221770001122');
    });

    it('persiste la note et crée les événements prospect sans exécuter son contenu', async () => {
      const result = await createUseCase.execute({ displayName: 'Texte sûr', whatsappPhone: '+221770009999', status: 'NOUVEAU', interestLevel: 'NON_QUALIFIE', notes: '<script>alert(1)</script>' });
      expect(result.prospect?.notes?.[0].content).toBe('<script>alert(1)</script>');
      expect((await db.timelineEvents.where('contactId').equals(result.prospect!.contact.id).toArray()).map((event) => event.type).sort()).toEqual(['NOTE_ADDED', 'PROSPECT_CREATED']);
    });

    it('should detect duplicate whatsapp and return warning', async () => {
      await createUseCase.execute({
        displayName: 'John Doe',
        whatsappPhone: '+221770001122',
        status: 'NOUVEAU',
        interestLevel: 'NON_QUALIFIE'
      });

      const result = await createUseCase.execute({
        displayName: 'Jane Doe',
        whatsappPhone: ' +221 77 000 11 22 ', // Same number
        status: 'NOUVEAU',
        interestLevel: 'NON_QUALIFIE'
      });

      expect(result.prospect).toBeUndefined();
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('existe déjà');
    });

    it('should allow forcing duplicate creation', async () => {
      await createUseCase.execute({
        displayName: 'John Doe',
        whatsappPhone: '+221770001122',
        status: 'NOUVEAU',
        interestLevel: 'NON_QUALIFIE'
      });

      const result = await createUseCase.execute({
        displayName: 'Jane Doe',
        whatsappPhone: '+221770001122',
        status: 'NOUVEAU',
        interestLevel: 'NON_QUALIFIE'
      }, true); // forceDuplicate = true

      expect(result.warning).toBeUndefined();
      expect(result.prospect).toBeDefined();
    });
  });

  describe('ListProspectsUseCase', () => {
    beforeEach(async () => {
      await createUseCase.execute({ displayName: 'Apple', whatsappPhone: '+1', status: 'NOUVEAU', interestLevel: 'FROID' });
      await createUseCase.execute({ displayName: 'Banana', whatsappPhone: '+2', status: 'CONTACTE', interestLevel: 'CHAUD' });
      const p3 = await createUseCase.execute({ displayName: 'Cherry', whatsappPhone: '+3', status: 'INTERESSE', interestLevel: 'TIEDE' });
      await archiveUseCase.execute(p3.prospect!.contact.id);
    });

    it('should search by name', async () => {
      const results = await listUseCase.execute({ query: 'apple' });
      expect(results.length).toBe(1);
      expect(results[0].contact.displayName).toBe('Apple');
    });

    it('should filter by status', async () => {
      const results = await listUseCase.execute({ status: ['CONTACTE'] });
      expect(results.length).toBe(1);
      expect(results[0].contact.displayName).toBe('Banana');
    });

    it('should exclude archived by default', async () => {
      const results = await listUseCase.execute({});
      expect(results.length).toBe(2);
      expect(results.find(p => p.contact.displayName === 'Cherry')).toBeUndefined();
    });

    it('should include archived if showArchived is true', async () => {
      const results = await listUseCase.execute({ showArchived: true });
      expect(results.length).toBe(3);
    });
  });

  describe('ArchiveProspectUseCase', () => {
    it('should archive a prospect', async () => {
      const { prospect } = await createUseCase.execute({ displayName: 'Zebra', whatsappPhone: '+99', status: 'NOUVEAU', interestLevel: 'FROID' });
      const id = prospect!.contact.id;
      
      const res = await archiveUseCase.execute(id);
      expect(res.success).toBe(true);

      const archived = await repository.getById(id);
      expect(archived?.contact.archivedAt).toBeDefined();
      expect(archived?.profile.archivedAt).toBeDefined();
    });
  });

  describe('UpdateProspectUseCase', () => {
    it('should update and allow same number', async () => {
      const { prospect } = await createUseCase.execute({ displayName: 'Zebra', whatsappPhone: '+99', status: 'NOUVEAU', interestLevel: 'FROID' });
      const res = await updateUseCase.execute(prospect!.contact.id, {
        displayName: 'Zebra 2',
        whatsappPhone: '+99',
        status: 'NOUVEAU',
        interestLevel: 'FROID'
      });
      expect(res.warning).toBeUndefined();
      expect(res.prospect?.contact.displayName).toBe('Zebra 2');
    });

    it('historise un changement de statut avec le même contactId', async () => {
      const { prospect } = await createUseCase.execute({ displayName: 'Statut', whatsappPhone: '+98', status: 'NOUVEAU', interestLevel: 'FROID' });
      await updateUseCase.execute(prospect!.contact.id, { displayName: 'Statut', whatsappPhone: '+98', status: 'CONTACTE', interestLevel: 'FROID' });
      const event = (await db.timelineEvents.where('contactId').equals(prospect!.contact.id).toArray()).find((item) => item.type === 'PROSPECT_STATUS_CHANGED');
      expect(event).toMatchObject({ contactId: prospect!.contact.id, summary: 'NOUVEAU → CONTACTE' });
    });

    it('should warn on duplicate number during update', async () => {
      await createUseCase.execute({ displayName: 'A', whatsappPhone: '+11', status: 'NOUVEAU', interestLevel: 'FROID' });
      const { prospect } = await createUseCase.execute({ displayName: 'B', whatsappPhone: '+22', status: 'NOUVEAU', interestLevel: 'FROID' });
      
      const res = await updateUseCase.execute(prospect!.contact.id, {
        displayName: 'B',
        whatsappPhone: '+11', // same as A
        status: 'NOUVEAU',
        interestLevel: 'FROID'
      });
      expect(res.warning).toBeDefined();
    });
  });
});
