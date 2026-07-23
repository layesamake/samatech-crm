import { UpdateProspectInput, Prospect, normalizePhoneNumber, UpdateProspectSchema } from '../domain/prospect';
import { DexieProspectRepository } from '../infrastructure/dexie-prospect-repository';

export class UpdateProspectUseCase {
  constructor(private repository: DexieProspectRepository) {}

  async execute(id: string, input: UpdateProspectInput, forceDuplicate: boolean = false): Promise<{ prospect?: Prospect, warning?: string, error?: string }> {
    const existingProspect = await this.repository.getById(id);
    if (!existingProspect) {
      return { error: 'Prospect introuvable.' };
    }

    const validationResult = UpdateProspectSchema.safeParse(input);
    if (!validationResult.success) {
      return { error: 'Données invalides : ' + validationResult.error.issues.map((e) => e.message).join(', ') };
    }

    const data = validationResult.data;
    if (data.status === 'CONVERTI' && existingProspect.profile.status !== 'CONVERTI') return { error: 'Utilisez l’action Convertir en client pour appliquer ce statut.' };
    if (existingProspect.profile.status === 'CONVERTI' && data.status !== 'CONVERTI') return { error: 'Un client ne peut pas redevenir prospect depuis la modification standard.' };
    const normalizedWhatsapp = normalizePhoneNumber(data.whatsappPhone);

    // Vérification de doublon si le numéro a changé
    if (!forceDuplicate && normalizedWhatsapp !== existingProspect.contact.normalizedWhatsappPhone) {
      const duplicate = await this.repository.findByNormalizedWhatsapp(normalizedWhatsapp);
      if (duplicate && duplicate.id !== existingProspect.contact.id) {
        return { warning: 'Un autre prospect avec ce numéro WhatsApp existe déjà. Confirmez-vous la modification ?' };
      }
    }

    const now = new Date().toISOString();

    const previousStatus = existingProspect.profile.status;
    const statusChanged = data.status !== previousStatus;

    existingProspect.contact = {
      ...existingProspect.contact,
      displayName: data.displayName,
      title: data.title || undefined,
      firstName: data.firstName,
      source: data.source || undefined,
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
      updatedAt: now,
    };

    existingProspect.profile = {
      ...existingProspect.profile,
      status: data.status,
      interestLevel: data.interestLevel,
      lostReason: data.lostReason,
      updatedAt: now,
      lastStatusChangedAt: statusChanged ? now : existingProspect.profile.lastStatusChangedAt,
    };

    if (data.productIds) {
      existingProspect.interests = data.productIds.map(productId => {
        const existingInterest = existingProspect.interests?.find((interest) => interest.productId === productId);
        return existingInterest
          ? { ...existingInterest, interestLevel: data.interestLevel, archivedAt: undefined, updatedAt: now }
          : {
              id: crypto.randomUUID(),
              prospectProfileId: existingProspect.profile.id,
              productId,
              interestLevel: data.interestLevel,
              requestedAt: now,
              createdAt: now,
              updatedAt: now,
            };
      });
    } else {
      existingProspect.interests = [];
    }

    await this.repository.save(existingProspect, statusChanged ? [{ id: crypto.randomUUID(), contactId: existingProspect.contact.id, type: 'PROSPECT_STATUS_CHANGED', occurredAt: now, createdAt: now, sourceEntityType: 'PROSPECT_PROFILE', sourceEntityId: existingProspect.profile.id, title: 'Statut du prospect modifié', summary: `${previousStatus} → ${data.status}`, payloadVersion: 1 }] : []);

    return { prospect: existingProspect };
  }
}
