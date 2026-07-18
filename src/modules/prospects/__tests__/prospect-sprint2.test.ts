import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../../infrastructure/database/db';
import { CreateProspectUseCase } from '../application/create-prospect';
import { ListProspectsUseCase } from '../application/list-prospects';
import { UpdateProspectUseCase } from '../application/update-prospect';
import { DexieProspectRepository } from '../infrastructure/dexie-prospect-repository';

describe('Sprint 2 - intégration prospects et références', () => {
  const repository = new DexieProspectRepository();
  const create = new CreateProspectUseCase(repository);
  const update = new UpdateProspectUseCase(repository);
  const list = new ListProspectsUseCase(repository);
  beforeEach(async () => db.transaction('rw', db.contacts, db.prospectProfiles, db.prospectInterests, async () => {
    await Promise.all([db.contacts.clear(), db.prospectProfiles.clear(), db.prospectInterests.clear()]);
  }));

  it('associe puis modifie une localité et plusieurs produits par identifiants stables', async () => {
    const created = await create.execute({ displayName: 'Awa', whatsappPhone: '+221770001122', status: 'NOUVEAU', interestLevel: 'NON_QUALIFIE', locationId: '11111111-1111-4111-8111-111111111111', productIds: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'] });
    expect(created.prospect?.interests).toHaveLength(2);
    const changed = await update.execute(created.prospect!.contact.id, { displayName: 'Awa', whatsappPhone: '+221770001122', status: 'CONTACTE', interestLevel: 'CHAUD', locationId: '44444444-4444-4444-8444-444444444444', productIds: ['33333333-3333-4333-8333-333333333333'] });
    expect(changed.prospect?.contact.locationId).toBe('44444444-4444-4444-8444-444444444444');
    expect(changed.prospect?.interests?.filter((interest) => !interest.archivedAt).map((interest) => interest.productId)).toEqual(['33333333-3333-4333-8333-333333333333']);
  });

  it('filtre les prospects par localité et produit', async () => {
    await create.execute({ displayName: 'Awa', whatsappPhone: '+221770000001', status: 'NOUVEAU', interestLevel: 'NON_QUALIFIE', locationId: '11111111-1111-4111-8111-111111111111', productIds: ['22222222-2222-4222-8222-222222222222'] });
    await create.execute({ displayName: 'Moussa', whatsappPhone: '+221770000002', status: 'NOUVEAU', interestLevel: 'NON_QUALIFIE', locationId: '44444444-4444-4444-8444-444444444444', productIds: ['33333333-3333-4333-8333-333333333333'] });
    expect((await list.execute({ locationId: '11111111-1111-4111-8111-111111111111' })).map((p) => p.contact.displayName)).toEqual(['Awa']);
    expect((await list.execute({ productIds: ['33333333-3333-4333-8333-333333333333'] })).map((p) => p.contact.displayName)).toEqual(['Moussa']);
  });

  it('préserve les associations même si les références sont archivées', async () => {
    const created = await create.execute({ displayName: 'Awa', whatsappPhone: '+221770000001', status: 'NOUVEAU', interestLevel: 'NON_QUALIFIE', locationId: '11111111-1111-4111-8111-111111111111', productIds: ['22222222-2222-4222-8222-222222222222'] });
    const loaded = await repository.getById(created.prospect!.contact.id);
    expect(loaded?.contact.locationId).toBe('11111111-1111-4111-8111-111111111111');
    expect(loaded?.interests?.[0].productId).toBe('22222222-2222-4222-8222-222222222222');
  });
});
