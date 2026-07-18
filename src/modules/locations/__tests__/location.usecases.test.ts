import { describe, it, expect, beforeEach } from 'vitest';
import { ManageLocationsUseCase } from '../application/manage-locations';
import { DexieLocationRepository } from '../infrastructure/dexie-location-repository';
import "fake-indexeddb/auto";
import { db } from '../../../infrastructure/database/db';

describe('Locations UseCases', () => {
  let repository: DexieLocationRepository;
  let useCase: ManageLocationsUseCase;

  beforeEach(async () => {
    await db.locations.clear();
    repository = new DexieLocationRepository();
    useCase = new ManageLocationsUseCase(repository);
  });

  it('crée une localité et la récupère', async () => {
    const country = await useCase.createLocation({ name: 'Sénégal', level: 'COUNTRY' });
    const region = await useCase.createLocation({ name: 'Dakar', level: 'REGION', parentId: country.id });
    const created = await useCase.createLocation({ name: 'Dakar', level: 'CITY', parentId: region.id });
    const loc = await repository.getById(created.id);
    expect(loc).toBeDefined();
    expect(loc?.name).toBe('Dakar');
    expect(loc?.normalizedName).toBe('dakar');
    expect(loc?.level).toBe('CITY');
    expect(loc?.parentId).toBe(region.id);
  });

  it('empêche la création d\'un doublon (même nom normalisé, même niveau, même parent)', async () => {
    const country = await useCase.createLocation({ name: 'Sénégal', level: 'COUNTRY' });
    const region = await useCase.createLocation({ name: 'Dakar', level: 'REGION', parentId: country.id });
    await useCase.createLocation({ name: 'Dakar', level: 'CITY', parentId: region.id });
    await expect(
      useCase.createLocation({ name: 'dakar', level: 'CITY', parentId: region.id })
    ).rejects.toThrow(/existe déjà/);
  });

  it('autorise des localités de même nom si le niveau est différent', async () => {
    const country = await useCase.createLocation({ name: 'Sénégal', level: 'COUNTRY' });
    const region = await useCase.createLocation({ name: 'Dakar', level: 'REGION', parentId: country.id });
    const created = await useCase.createLocation({ name: 'Dakar', level: 'CITY', parentId: region.id });
    const loc = await repository.getById(created.id);
    expect(loc).toBeDefined();
  });

  it('archive une localité et elle n\'apparaît plus dans getAllActive', async () => {
    const id1 = (await useCase.createLocation({ name: 'Sénégal', level: 'COUNTRY' })).id;
    const id2 = (await useCase.createLocation({ name: 'Mali', level: 'COUNTRY' })).id;

    await useCase.archiveLocation(id1);

    const active = await repository.getAllActive();
    expect(active.length).toBe(1);
    expect(active[0].id).toBe(id2);
  });

  it('ne supprime pas la localité de la base de données', async () => {
    const id = (await useCase.createLocation({ name: 'Sénégal', level: 'COUNTRY' })).id;
    await useCase.archiveLocation(id);

    const loc = await repository.getById(id);
    expect(loc).toBeDefined();
    expect(loc?.archivedAt).toBeDefined();
  });

  it('modifie et recherche une localité, archives incluses', async () => {
    const created = await useCase.createLocation({ name: '  Sénégal  ', level: 'COUNTRY' });
    await useCase.updateLocation(created.id, { name: 'République du Sénégal', level: 'COUNTRY' });
    expect((await repository.getAll()).filter((l) => l.normalizedName.includes('senegal'))).toHaveLength(1);
    await useCase.archiveLocation(created.id);
    expect(await repository.getAllActive()).toHaveLength(0);
    expect(await repository.getAll()).toHaveLength(1);
  });

  it('refuse les parents absents, de mauvais niveau et les auto-références', async () => {
    await expect(useCase.createLocation({ name: 'Dakar', level: 'CITY' })).rejects.toThrow(/parent/);
    const country = await useCase.createLocation({ name: 'Sénégal', level: 'COUNTRY' });
    await expect(useCase.createLocation({ name: 'Plateau', level: 'DISTRICT', parentId: country.id })).rejects.toThrow(/Parent invalide/);
    await expect(useCase.updateLocation(country.id, { name: 'Sénégal', level: 'REGION', parentId: country.id })).rejects.toThrow(/propre parent/);
  });
});
