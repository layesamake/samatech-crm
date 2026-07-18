import { DexieCatalogRepository } from '@/modules/catalog/infrastructure/dexie-catalog-repository';
import { DexieLocationRepository } from '@/modules/locations/infrastructure/dexie-location-repository';
import { DexieProspectRepository } from '@/modules/prospects/infrastructure/dexie-prospect-repository';
import { GetSettingsUseCase } from '@/modules/settings/application/get-settings';
import { DexieSettingsRepository } from '@/modules/settings/infrastructure/dexie-settings-repository';
import { MessageResolution, resolveMessage } from '../domain/message-template';

export class ResolveProspectMessageUseCase {
  async execute(contactId: string, content: string, allowEmpty = false): Promise<MessageResolution> {
    const prospect = await new DexieProspectRepository().getById(contactId); if (!prospect) throw new Error('Contact introuvable');
    const [locations, products, company] = await Promise.all([new DexieLocationRepository().getAll(), new DexieCatalogRepository().getAllProducts(), new GetSettingsUseCase(new DexieSettingsRepository()).getCompanyProfile()]);
    const names = prospect.contact.displayName.trim().split(/\s+/);
    return resolveMessage(content, {
      prenom: prospect.contact.firstName || names[0], nom: prospect.contact.lastName || names.slice(1).join(' ') || undefined,
      contact: prospect.contact.displayName, entreprise: prospect.contact.companyName,
      produits: prospect.interests?.filter((interest) => !interest.archivedAt).map((interest) => products.find((product) => product.id === interest.productId)?.name).filter((name): name is string => Boolean(name)).sort((a, b) => a.localeCompare(b, 'fr')),
      localite: locations.find((location) => location.id === prospect.contact.locationId)?.name, nomEntreprise: company?.name,
    }, allowEmpty);
  }
}
