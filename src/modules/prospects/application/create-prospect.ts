import { v4 as uuidv4 } from 'uuid';
import { CreateProspectInput, Prospect, normalizePhoneNumber, CreateProspectSchema } from '../domain/prospect';
import { DexieProspectRepository } from '../infrastructure/dexie-prospect-repository';
import { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';

export class CreateProspectUseCase {
  constructor(private repository: DexieProspectRepository) {}

  /**
   * Crée un nouveau prospect en validant les données métier.
   * Retourne une erreur métier si le prospect existe déjà ou si les données sont invalides.
   */
  async execute(input: CreateProspectInput, forceDuplicate: boolean = false): Promise<{ prospect?: Prospect, warning?: string, error?: string }> {
    // 1. Validation de l'entrée selon le schéma BR-006, BR-020
    const validationResult = CreateProspectSchema.safeParse(input);
    if (!validationResult.success) {
      return { error: 'Données invalides : ' + validationResult.error.issues.map((e) => e.message).join(', ') };
    }

    const data = validationResult.data;
    if (data.status === 'CONVERTI') return { error: 'Utilisez l’action Convertir en client pour appliquer ce statut.' };
    const normalizedWhatsapp = normalizePhoneNumber(data.whatsappPhone);

    // 2. Vérification des doublons (BR-013)
    if (!forceDuplicate) {
      const existing = await this.repository.findByNormalizedWhatsapp(normalizedWhatsapp);
      if (existing) {
        return { warning: 'Un prospect avec ce numéro WhatsApp existe déjà. Confirmez-vous la création ?' };
      }
    }

    // 3. Préparation des entités
    const now = new Date().toISOString();
    const contactId = uuidv4();
    const profileId = uuidv4();

    const prospect: Prospect = {
      contact: {
        id: contactId,
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        whatsappPhone: data.whatsappPhone,
        normalizedWhatsappPhone: normalizedWhatsapp,
        secondaryPhone: data.secondaryPhone,
        normalizedSecondaryPhone: data.secondaryPhone ? normalizePhoneNumber(data.secondaryPhone) : undefined,
        email: data.email,
        locationId: data.locationId,
        address: data.address,
        source: data.source || undefined,
        customSource: data.customSource,
        createdAt: now,
        updatedAt: now,
      },
      profile: {
        id: profileId,
        contactId: contactId,
        status: data.status,
        interestLevel: data.interestLevel,
        firstContactDate: data.firstContactDate || now.split('T')[0],
        lastStatusChangedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      interests: data.productIds ? data.productIds.map(productId => ({
        id: uuidv4(),
        prospectProfileId: profileId,
        productId,
        interestLevel: data.interestLevel,
        requestedAt: now,
        createdAt: now,
        updatedAt: now,
      })) : [],
      notes: data.notes ? [{
        id: uuidv4(),
        contactId,
        content: data.notes,
        pinned: false,
        createdAt: now,
        updatedAt: now,
      }] : [],
    };

    // 4. Sauvegarde atomique
    const events: TimelineEventRecord[] = [{ id: uuidv4(), contactId, type: 'PROSPECT_CREATED', occurredAt: now, createdAt: now, sourceEntityType: 'PROSPECT_PROFILE', sourceEntityId: profileId, title: 'Prospect créé', payloadVersion: 1 }];
    if (data.notes) events.push({ id: uuidv4(), contactId, type: 'NOTE_ADDED' as const, occurredAt: now, createdAt: now, sourceEntityType: 'NOTE', sourceEntityId: prospect.notes![0].id, title: 'Note ajoutée', payloadVersion: 1 });
    await this.repository.save(prospect, events);

    return { prospect };
  }
}
