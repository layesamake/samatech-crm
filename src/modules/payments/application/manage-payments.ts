import { Clock, SystemClock } from '@/modules/follow-ups/domain/follow-up';
import { RecordPaymentInput, RecordPaymentInputSchema } from '../domain/payment';
import { DexiePaymentRepository, PaymentSearchCriteria, ReceivableSearchCriteria } from '../infrastructure/dexie-payment-repository';

export class ManagePaymentsUseCase {
  constructor(private readonly repository = new DexiePaymentRepository(), private readonly clock: Clock = new SystemClock()) {}

  list(criteria: PaymentSearchCriteria = {}) { return this.repository.list(criteria); }
  forInvoice(invoiceId: string) { return this.repository.forInvoice(invoiceId); }
  receivables(criteria: Omit<ReceivableSearchCriteria, 'today'> & { today?: string } = {}) {
    return this.repository.receivables({ ...criteria, today: criteria.today ?? this.clock.now().toISOString().slice(0, 10) });
  }
  indicators() { return this.repository.indicators(this.clock.now().toISOString().slice(0, 10)); }
  async record(input: RecordPaymentInput) { return this.repository.record(RecordPaymentInputSchema.parse(input), this.clock.now().toISOString()); }
  reverse(id: string, reason: string) { return this.repository.reverse(id, reason, this.clock.now().toISOString()); }
}
