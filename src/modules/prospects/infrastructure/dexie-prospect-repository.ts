import { db } from '../../../infrastructure/database/db';
import { Prospect, ContactRecord } from '../domain/prospect';
import { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';

export interface ProspectSearchCriteria {
  query?: string;
  status?: string[];
  interestLevel?: string[];
  locationId?: string;
  source?: string;
  productIds?: string[];
  showArchived?: boolean;
}

export class DexieProspectRepository {
  /**
   * Sauvegarde un prospect (Contact + Profil).
   * Utilise une transaction pour garantir l'atomicité.
   */
  async save(prospect: Prospect, events: TimelineEventRecord[] = []): Promise<void> {
    await db.transaction('rw', db.contacts, db.prospectProfiles, db.prospectInterests, db.notes, db.timelineEvents, async () => {
      await db.contacts.put(prospect.contact);
      await db.prospectProfiles.put(prospect.profile);
      
      if (prospect.interests) {
        // Obtenir les intérêts existants
        const existingInterests = await db.prospectInterests.where({ prospectProfileId: prospect.profile.id }).toArray();
        const existingMap = new Map(existingInterests.map(i => [i.productId, i]));
        
        // Mettre à jour ou ajouter
        for (const interest of prospect.interests) {
          if (existingMap.has(interest.productId)) {
            // Already there
            existingMap.delete(interest.productId);
            await db.prospectInterests.put(interest);
          } else {
            await db.prospectInterests.put(interest);
          }
        }
        
        // Archiver ceux qui ont été supprimés
        for (const removed of existingMap.values()) {
          removed.archivedAt = new Date().toISOString();
          removed.updatedAt = new Date().toISOString();
          await db.prospectInterests.put(removed);
        }
      }

      if (prospect.notes) {
        const existingNotes = await db.notes.where('contactId').equals(prospect.contact.id).toArray();
        const retainedIds = new Set(prospect.notes.map((note) => note.id));
        for (const note of prospect.notes) await db.notes.put(note);
        const archivedAt = new Date().toISOString();
        for (const note of existingNotes.filter((item) => !item.archivedAt && !retainedIds.has(item.id))) {
          await db.notes.put({ ...note, archivedAt, updatedAt: archivedAt });
        }
      }
      if (events.length) await db.timelineEvents.bulkAdd(events);
    });
  }

  /**
   * Récupère un prospect par son ID.
   */
  async getById(id: string): Promise<Prospect | null> {
    const contact = await db.contacts.get(id);
    if (!contact) return null;

    const profile = await db.prospectProfiles.get({ contactId: id });
    if (!profile) return null;

    const [interests, notes, events] = await Promise.all([
      db.prospectInterests.where({ prospectProfileId: profile.id }).toArray(),
      db.notes.where('contactId').equals(id).filter((note) => !note.archivedAt).toArray(),
      db.timelineEvents.where('contactId').equals(id).toArray(),
    ]);

    events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    return { contact, profile, interests, notes, events };
  }

  /**
   * Vérifie si un numéro WhatsApp (normalisé) existe déjà parmi les contacts actifs.
   */
  async findByNormalizedWhatsapp(normalizedPhone: string): Promise<ContactRecord | null> {
    return await db.contacts
      .where('normalizedWhatsappPhone')
      .equals(normalizedPhone)
      .first() || null;
  }

  /**
   * Marque un prospect comme archivé.
   */
  async archive(id: string): Promise<void> {
    const prospect = await this.getById(id);
    if (!prospect) throw new Error('Prospect introuvable');

    const now = new Date().toISOString();
    prospect.contact.archivedAt = now;
    prospect.contact.updatedAt = now;
    prospect.profile.archivedAt = now;
    prospect.profile.updatedAt = now;

    await this.save(prospect);
  }

  /**
   * Recherche et filtre les prospects.
   */
  async search(criteria: ProspectSearchCriteria): Promise<Prospect[]> {
    // Dans Dexie, on peut faire un filtre basique sur les tables. 
    // Étant donné que Prospect implique une jointure, on peut itérer sur prospectProfiles et joindre les contacts,
    // ou récupérer les profils et ensuite charger les contacts.
    
    // On commence par filtrer les profils
    let profilesCollection = db.prospectProfiles.toCollection();

    // Filtre Archivé
    if (!criteria.showArchived) {
      profilesCollection = profilesCollection.filter(p => !p.archivedAt && (!criteria.status?.length ? p.status !== 'CONVERTI' : true));
    }

    // Filtre Statut
    if (criteria.status && criteria.status.length > 0) {
      profilesCollection = profilesCollection.filter(p => criteria.status!.includes(p.status));
    }

    // Filtre Niveau d'intérêt
    if (criteria.interestLevel && criteria.interestLevel.length > 0) {
      profilesCollection = profilesCollection.filter(p => criteria.interestLevel!.includes(p.interestLevel));
    }

    const profiles = await profilesCollection.toArray();
    
    if (profiles.length === 0) return [];

    // Récupérer les contacts associés
    const contactIds = profiles.map(p => p.contactId);
    let contacts = await db.contacts.where('id').anyOf(contactIds).toArray();

    // Filtres sur Contacts (Query, Location, Source)
    if (criteria.query) {
      const q = criteria.query.toLowerCase();
      contacts = contacts.filter(c => 
        c.displayName.toLowerCase().includes(q) || 
        c.normalizedWhatsappPhone.includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q))
      );
    }

    if (criteria.locationId) {
      contacts = contacts.filter(c => c.locationId === criteria.locationId);
    }

    if (criteria.source) {
      contacts = contacts.filter(c => c.source === criteria.source);
    }

    // Récupérer les intérêts pour les contacts filtrés
    const validProfileIds = profiles.filter(p => contacts.some(c => c.id === p.contactId)).map(p => p.id);
    const interests = await db.prospectInterests.where('prospectProfileId').anyOf(validProfileIds).toArray();

    // Reconstruction du tableau résultat final
    let result: Prospect[] = [];
    for (const c of contacts) {
      const p = profiles.find(prof => prof.contactId === c.id);
      if (p) {
        const prospectInterests = interests.filter(i => i.prospectProfileId === p.id && !i.archivedAt);
        result.push({ contact: c, profile: p, interests: prospectInterests });
      }
    }

    if (criteria.productIds && criteria.productIds.length > 0) {
      result = result.filter(r => 
        r.interests && r.interests.some(i => criteria.productIds!.includes(i.productId))
      );
    }

    // Tri par date de mise à jour (plus récent en premier)
    return result.sort((a, b) => 
      new Date(b.profile.updatedAt).getTime() - new Date(a.profile.updatedAt).getTime()
    );
  }
}
