import { Clock, SystemClock } from '@/modules/follow-ups/domain/follow-up';
import { CampaignDraftInput, CampaignDraftInputSchema, CampaignErrorCode } from '../domain/campaign';
import { CampaignListCriteria, DexieCampaignRepository } from '../infrastructure/dexie-campaign-repository';

export class ManageCampaignsUseCase {
  constructor(private readonly repository = new DexieCampaignRepository(), private readonly clock: Clock = new SystemClock()) {}
  formOptions() { return this.repository.formOptions(); }
  preview(input: CampaignDraftInput) { return this.repository.preview(CampaignDraftInputSchema.parse(input)); }
  create(input: CampaignDraftInput) { return this.repository.create(CampaignDraftInputSchema.parse(input), this.clock.now().toISOString()); }
  update(id: string, input: CampaignDraftInput) { return this.repository.update(id, CampaignDraftInputSchema.parse(input), this.clock.now().toISOString()); }
  list(criteria: CampaignListCriteria = {}) { return this.repository.list(criteria); }
  get(id: string) { return this.repository.get(id); }
  async resume(id: string) { const aggregate = await this.repository.get(id); return aggregate?.recipients.find((item) => item.status === 'A_TRAITER' || item.status === 'OUVERT_DANS_WHATSAPP') ?? null; }
  markReady(id: string) { return this.repository.markReady(id, this.clock.now().toISOString()); }
  backToDraft(id: string) { return this.repository.backToDraft(id, this.clock.now().toISOString()); }
  launch(id: string) { return this.repository.launch(id, this.clock.now().toISOString()); }
  openWhatsApp(campaignId: string, recipientId: string) { return this.repository.openWhatsApp(campaignId, recipientId, this.clock.now().toISOString()); }
  confirm(campaignId: string, recipientId: string, note?: string) { return this.repository.confirm(campaignId, recipientId, this.clock.now().toISOString(), note); }
  ignore(campaignId: string, recipientId: string, note?: string) { return this.repository.ignore(campaignId, recipientId, this.clock.now().toISOString(), note); }
  error(campaignId: string, recipientId: string, code: CampaignErrorCode, note?: string) { return this.repository.error(campaignId, recipientId, code, this.clock.now().toISOString(), note); }
  cancel(id: string, strongConfirmation = false) { return this.repository.cancel(id, strongConfirmation, this.clock.now().toISOString()); }
}
