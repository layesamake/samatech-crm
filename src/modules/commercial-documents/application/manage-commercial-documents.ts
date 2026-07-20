import { Clock, SystemClock } from '@/modules/follow-ups/domain/follow-up';
import { calculateInvoiceLine, calculateInvoiceTotals } from '@/modules/invoices/domain/invoice';
import { CommercialDocumentLineRecord, CommercialDocumentRecord, DraftCommercialDocumentInput, DraftCommercialDocumentSchema, ValidatedDraftCommercialDocumentInput } from '../domain/commercial-document';
import { DexieCommercialDocumentRepository, CommercialDocumentSearchCriteria } from '../infrastructure/dexie-commercial-document-repository';

export class ManageCommercialDocumentsUseCase {
  constructor(private readonly repository = new DexieCommercialDocumentRepository(), private readonly clock: Clock = new SystemClock()) {}

  list(criteria: CommercialDocumentSearchCriteria = {}) { return this.repository.list(criteria); }
  get(id: string) { return this.repository.get(id); }
  formOptions() { return this.repository.formOptions(); }

  private buildLines(documentId: string, input: ValidatedDraftCommercialDocumentInput, now: string): CommercialDocumentLineRecord[] {
    return input.lines.map((value, index) => ({ 
      id: value.id || crypto.randomUUID(), 
      documentId, 
      ...calculateInvoiceLine({ ...value, position: index }, input.taxesEnabled), 
      createdAt: now, 
      updatedAt: now 
    })); 
  }

  async createDraft(input: DraftCommercialDocumentInput) { 
    const value = DraftCommercialDocumentSchema.parse(input); 
    const now = this.clock.now().toISOString(); 
    const id = crypto.randomUUID(); 
    const lines = this.buildLines(id, value, now); 
    const totals = calculateInvoiceTotals(lines); 
    
    const document: CommercialDocumentRecord = { 
      id, 
      type: value.type, 
      status: 'DRAFT', 
      clientProfileId: value.clientProfileId, 
      issueDate: value.issueDate || undefined, 
      validUntil: value.validUntil || undefined, 
      deliveryDate: value.deliveryDate || undefined,
      deliveryAddress: value.deliveryAddress || undefined,
      recipientName: value.recipientName || undefined,
      customerReference: value.customerReference || undefined,
      currency: value.currency, 
      currencyScale: value.currencyScale, 
      companySnapshot: { displayName: '' }, 
      clientSnapshot: { displayName: '' }, 
      ...totals, 
      notes: value.notes || undefined, 
      terms: value.terms || undefined, 
      createdAt: now, 
      updatedAt: now 
    }; 
    await this.repository.saveDraft(document, lines); 
    return this.repository.get(id); 
  }

  async updateDraft(id: string, input: DraftCommercialDocumentInput) { 
    const current = await this.repository.get(id); 
    if (!current) throw new Error('Document introuvable'); 
    if (current.document.status !== 'DRAFT') throw new Error('Un document émis ou annulé est immuable'); 
    const value = DraftCommercialDocumentSchema.parse(input); 
    const now = this.clock.now().toISOString(); 
    const lines = this.buildLines(id, value, now).map((line) => ({ 
      ...line, 
      createdAt: current.lines.find((item) => item.id === line.id)?.createdAt ?? now 
    })); 
    const totals = calculateInvoiceTotals(lines); 
    
    const document: CommercialDocumentRecord = { 
      ...current.document, 
      type: value.type, 
      clientProfileId: value.clientProfileId, 
      issueDate: value.issueDate || undefined, 
      validUntil: value.validUntil || undefined, 
      deliveryDate: value.deliveryDate || undefined,
      deliveryAddress: value.deliveryAddress || undefined,
      recipientName: value.recipientName || undefined,
      customerReference: value.customerReference || undefined,
      currency: value.currency, 
      currencyScale: value.currencyScale, 
      ...totals, 
      notes: value.notes || undefined, 
      terms: value.terms || undefined, 
      updatedAt: now 
    }; 
    await this.repository.saveDraft(document, lines); 
    return this.repository.get(id); 
  }

  issue(id: string) { return this.repository.issue(id, this.clock.now().toISOString()); }
  cancel(id: string, reason: string) { return this.repository.cancel(id, reason, this.clock.now().toISOString()); }
  changeStatus(id: string, status: 'ACCEPTED' | 'REJECTED' | 'DELIVERED') { return this.repository.changeStatus(id, status, this.clock.now().toISOString()); }

  async duplicateAsDraft(id: string, newType?: DraftCommercialDocumentInput['type']) { 
    const current = await this.repository.get(id); 
    if (!current) throw new Error('Document introuvable'); 
    const now = this.clock.now().toISOString(); 
    const newId = crypto.randomUUID(); 
    const lines = current.lines.map(line => ({ 
      ...line, 
      id: crypto.randomUUID(), 
      documentId: newId, 
      sourceEntityType: 'COMMERCIAL_DOCUMENT_LINE' as const,
      sourceLineId: line.id, 
      createdAt: now, 
      updatedAt: now 
    })); 
    
    const document: CommercialDocumentRecord = { 
      ...current.document, 
      id: newId, 
      type: newType ?? current.document.type, 
      status: 'DRAFT', 
      number: undefined, 
      issueDate: undefined, 
      issuedAt: undefined, 
      createdAt: now, 
      updatedAt: now 
    }; 
    await this.repository.saveDraft(document, lines); 
    return newId; 
  }
}
