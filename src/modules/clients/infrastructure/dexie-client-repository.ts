import { db } from '@/infrastructure/database/db';
import { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';
import { ClientAggregate, ClientProfileRecord, ClientSearchCriteria } from '../domain/client';
import { ProspectProfileRecord } from '@/modules/prospects/domain/prospect';

export class DexieClientRepository {
  private async hydrate(profile: ClientProfileRecord): Promise<ClientAggregate | null> {
    const contact = await db.contacts.get(profile.contactId);
    const prospectProfile = await db.prospectProfiles.where('contactId').equals(profile.contactId).first();
    if (!contact || !prospectProfile) return null;
    const [interests, location, products, events, followUps, notes, contactTags] = await Promise.all([
      db.prospectInterests.where('prospectProfileId').equals(prospectProfile.id).toArray(),
      contact.locationId ? db.locations.get(contact.locationId) : undefined,
      db.products.toArray(),
      db.timelineEvents.where('contactId').equals(contact.id).toArray(),
      db.followUps.where('contactId').equals(contact.id).toArray(),
      db.notes.where('contactId').equals(contact.id).toArray(),
      db.contactTags.where('contactId').equals(contact.id).toArray(),
    ]);
    const activeInterests = interests.filter((item) => !item.archivedAt);
    const tagIds = contactTags.map((item) => item.tagId);
    const tags = tagIds.length ? (await db.tags.where('id').anyOf(tagIds).toArray()).filter((tag) => !tag.archivedAt) : [];
    events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    followUps.sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id));
    return { contact, profile, prospectProfile, interests: activeInterests, locationName: location?.name, productNames: activeInterests.map((interest) => products.find((product) => product.id === interest.productId)?.name).filter((name): name is string => Boolean(name)).sort((a, b) => a.localeCompare(b, 'fr')), events, followUps, notes: notes.filter((note) => !note.archivedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)), tags: tags.sort((a, b) => a.name.localeCompare(b.name, 'fr')) };
  }

  async getById(id: string) { const profile = await db.clientProfiles.get(id); return profile ? this.hydrate(profile) : null; }
  async getByContactId(contactId: string) { const profile = await db.clientProfiles.where('contactId').equals(contactId).first(); return profile ? this.hydrate(profile) : null; }
  async search(criteria: ClientSearchCriteria = {}): Promise<ClientAggregate[]> {
    const profiles = criteria.showArchived ? await db.clientProfiles.toArray() : await db.clientProfiles.filter((profile) => !profile.archivedAt).toArray();
    const clients = (await Promise.all(profiles.map((profile) => this.hydrate(profile)))).filter((client): client is ClientAggregate => Boolean(client));
    const query = criteria.query?.trim().toLocaleLowerCase('fr');
    return clients.filter((client) => (criteria.showArchived || (!client.contact.archivedAt && !client.profile.archivedAt)) && (!query || client.contact.displayName.toLocaleLowerCase('fr').includes(query) || client.contact.normalizedWhatsappPhone.includes(query) || client.contact.companyName?.toLocaleLowerCase('fr').includes(query)) && (!criteria.locationId || client.contact.locationId === criteria.locationId) && (!criteria.convertedFrom || client.profile.convertedAt >= criteria.convertedFrom) && (!criteria.convertedTo || client.profile.convertedAt <= criteria.convertedTo)).sort((a, b) => b.profile.convertedAt.localeCompare(a.profile.convertedAt) || a.contact.displayName.localeCompare(b.contact.displayName, 'fr'));
  }

  async convert(prospect: ProspectProfileRecord, client: ClientProfileRecord, event: TimelineEventRecord): Promise<void> {
    await db.transaction('rw', db.prospectProfiles, db.clientProfiles, db.timelineEvents, async () => {
      const current = await db.prospectProfiles.get(prospect.id);
      if (!current) throw new Error('Prospect introuvable');
      if (current.status === 'CONVERTI' || await db.clientProfiles.where('contactId').equals(client.contactId).first()) throw new Error('Ce prospect est déjà converti');
      await db.prospectProfiles.put(prospect);
      await db.clientProfiles.add(client);
      await db.timelineEvents.add(event);
    });
  }
}
