import { db } from '@/infrastructure/database/db';
import { CompanyProfile, InvoiceSettings, SequenceRecord } from '@/modules/settings/domain/settings';
import { TimelineEventRecord } from '@/modules/follow-ups/domain/follow-up';
import { DexieClientRepository } from '@/modules/clients/infrastructure/dexie-client-repository';
import { ClientAggregate } from '@/modules/clients/domain/client';
import { ProductRecord } from '@/modules/catalog/domain/catalog';
import { calculateInvoiceLine, calculateInvoiceTotals } from '@/modules/invoices/domain/invoice';
import { CommercialDocumentAggregate, CommercialDocumentLineRecord, CommercialDocumentLinkRecord, CommercialDocumentRecord, CommercialDocumentStatus } from '../domain/commercial-document';

export interface CommercialDocumentSearchCriteria {
  query?: string;
  type?: CommercialDocumentRecord['type'];
  status?: CommercialDocumentRecord['status'];
  from?: string;
  to?: string;
  clientProfileId?: string;
}

export interface CommercialDocumentFormOptions {
  clients: ClientAggregate[];
  products: ProductRecord[];
  company: CompanyProfile | null;
  settings: InvoiceSettings | null;
}

export class DexieCommercialDocumentRepository {
  async hydrate(document: CommercialDocumentRecord): Promise<CommercialDocumentAggregate> {
    const [lines, links] = await Promise.all([
      db.commercialDocumentLines.where('documentId').equals(document.id).sortBy('position'),
      db.commercialDocumentLinks.where('sourceId').equals(document.id).or('targetId').equals(document.id).toArray()
    ]);
    const client = await db.clientProfiles.get(document.clientProfileId);
    const contact = client ? await db.contacts.get(client.contactId) : undefined;
    const currentClientName = contact?.displayName ?? '';
    const clientName = document.status === 'DRAFT'
      ? currentClientName || document.clientSnapshot.displayName
      : document.clientSnapshot.displayName || currentClientName;
    return {
      document,
      lines: lines.filter((line) => !line.archivedAt),
      clientName,
      links
    };
  }

  async get(id: string) {
    const document = await db.commercialDocuments.get(id);
    return document ? this.hydrate(document) : null;
  }

  async list(criteria: CommercialDocumentSearchCriteria = {}): Promise<CommercialDocumentAggregate[]> {
    const documents = await db.commercialDocuments.filter((doc) => !doc.archivedAt).toArray();
    const values = await Promise.all(documents.map((doc) => this.hydrate(doc)));
    const query = criteria.query?.trim().toLocaleLowerCase('fr');
    
    return values.filter((value) => {
      return (!query || value.document.number?.toLocaleLowerCase('fr').includes(query) || value.clientName.toLocaleLowerCase('fr').includes(query)) &&
             (!criteria.type || value.document.type === criteria.type) &&
             (!criteria.status || value.document.status === criteria.status) &&
             (!criteria.from || (value.document.issueDate ?? value.document.createdAt.slice(0, 10)) >= criteria.from) &&
             (!criteria.to || (value.document.issueDate ?? value.document.createdAt.slice(0, 10)) <= criteria.to) &&
             (!criteria.clientProfileId || value.document.clientProfileId === criteria.clientProfileId);
    }).sort((a, b) => (b.document.issueDate ?? b.document.createdAt).localeCompare(a.document.issueDate ?? a.document.createdAt) || b.document.createdAt.localeCompare(a.document.createdAt) || b.document.id.localeCompare(a.document.id));
  }

  async formOptions(): Promise<CommercialDocumentFormOptions> {
    const [clients, products, companyRecord, settingsRecord] = await Promise.all([
      new DexieClientRepository().search(),
      db.products.filter((product) => product.isActive && !product.archivedAt).toArray(),
      db.settings.get('company.profile'),
      db.settings.get('invoice.defaults')
    ]);
    return {
      clients,
      products,
      company: (companyRecord?.value as CompanyProfile | undefined) ?? null,
      settings: (settingsRecord?.value as InvoiceSettings | undefined) ?? null
    };
  }

  async saveDraft(document: CommercialDocumentRecord, lines: CommercialDocumentLineRecord[], newLinks: CommercialDocumentLinkRecord[] = []): Promise<void> {
    await db.transaction('rw', db.commercialDocuments, db.commercialDocumentLines, db.commercialDocumentLinks, async () => {
      const current = await db.commercialDocuments.get(document.id);
      if (current && current.status !== 'DRAFT') throw new Error('Un document émis ou annulé est immuable');
      const positions = new Set(lines.map((line) => line.position));
      if (positions.size !== lines.length) throw new Error('Les positions de lignes doivent être uniques');
      await db.commercialDocuments.put(document);
      
      const existing = await db.commercialDocumentLines.where('documentId').equals(document.id).toArray();
      await db.commercialDocumentLines.bulkPut(lines);
      const removed = existing.filter((line) => !lines.some((next) => next.id === line.id));
      if (removed.length) await db.commercialDocumentLines.bulkDelete(removed.map((line) => line.id));
      
      if (newLinks.length > 0) {
        await db.commercialDocumentLinks.bulkAdd(newLinks);
      }
    });
  }

  async issue(documentId: string, now: string): Promise<CommercialDocumentAggregate> {
    await db.transaction('rw', [db.commercialDocuments, db.commercialDocumentLines, db.sequences, db.timelineEvents, db.clientProfiles, db.contacts, db.settings], async () => {
      const document = await db.commercialDocuments.get(documentId);
      if (!document) throw new Error('Document introuvable');
      if (document.status !== 'DRAFT') throw new Error('Seul un brouillon peut être émis');
      
      const lines = (await db.commercialDocumentLines.where('documentId').equals(documentId).sortBy('position')).filter((line) => !line.archivedAt);
      if (!lines.length) throw new Error('Un document émis doit contenir au moins une ligne');
      
      const profile = await db.clientProfiles.get(document.clientProfileId);
      if (!profile || profile.archivedAt) throw new Error('Client introuvable ou archivé');
      const contact = await db.contacts.get(profile.contactId);
      if (!contact || contact.archivedAt) throw new Error('Contact introuvable ou archivé');
      
      const company = (await db.settings.get('company.profile'))?.value as CompanyProfile | undefined;
      const settings = (await db.settings.get('invoice.defaults'))?.value as InvoiceSettings | undefined;
      if (!company?.name?.trim() || !company.phone?.trim()) throw new Error('Le profil entreprise est incomplet');
      if (!settings) throw new Error('Les paramètres de facturation sont incomplets');
      if (document.type !== 'DELIVERY_NOTE') {
        if (settings.currencyCode !== document.currency) throw new Error('La devise du brouillon ne correspond plus aux paramètres');
      }
      if (!document.issueDate) throw new Error('La date d’émission est obligatoire');
      if (document.validUntil && document.validUntil < document.issueDate) throw new Error('La date de validité ne peut pas précéder l’émission');
      
      const year = document.issueDate.slice(0, 4);
      let sequenceKey = `quote:${year}`;
      let prefix = 'DEV-';
      let title = 'Devis';
      if (document.type === 'PROFORMA') {
        sequenceKey = `proforma:${year}`;
        prefix = 'PRO-';
        title = 'Proforma';
      } else if (document.type === 'DELIVERY_NOTE') {
        sequenceKey = `delivery:${year}`;
        prefix = 'BL-';
        title = 'Bon de livraison';
      }
      
      const sequence = await db.sequences.get(sequenceKey);
      const nextValue = sequence?.nextValue ?? 1;
      const padding = sequence?.padding ?? 4;
      const number = `${prefix}${year}-${String(nextValue).padStart(padding, '0')}`;
      const sequenceRecord: SequenceRecord = { key: sequenceKey, prefix, period: year, nextValue: nextValue + 1, padding, updatedAt: now };
      
      const issued: CommercialDocumentRecord = {
        ...document,
        number,
        status: 'ISSUED',
        companySnapshot: {
          displayName: company.name,
          address: [company.address, company.city, company.country].filter(Boolean).join(', ') || undefined,
          phone: company.phone,
          email: company.email || undefined,
          logoDataUri: company.logoDataUri,
          managerName: company.managerName,
          managerSignatureDataUri: company.managerSignatureDataUri
        },
        clientSnapshot: {
          displayName: contact.displayName,
          address: contact.address,
          phone: contact.whatsappPhone,
          email: contact.email || undefined
        },
        issuedAt: now,
        updatedAt: now
      };
      
      const event: TimelineEventRecord = { id: crypto.randomUUID(), contactId: contact.id, type: 'COMMERCIAL_DOCUMENT_ISSUED' as any, occurredAt: now, createdAt: now, sourceEntityType: 'COMMERCIAL_DOCUMENT' as any, sourceEntityId: document.id, title: `${title} ${number} émis`, summary: `Émission enregistrée`, payloadVersion: 1 };
      await db.sequences.put(sequenceRecord);
      await db.commercialDocuments.put(issued);
      await db.timelineEvents.add(event);
    });
    
    const result = await this.get(documentId);
    if (!result) throw new Error('Document introuvable après émission');
    return result;
  }

  async cancel(documentId: string, reason: string, now: string): Promise<CommercialDocumentAggregate> {
    const trimmed = reason.trim();
    if (!trimmed) throw new Error('Le motif d’annulation est obligatoire');
    
    await db.transaction('rw', [db.commercialDocuments, db.timelineEvents, db.clientProfiles], async () => {
      const document = await db.commercialDocuments.get(documentId);
      if (!document) throw new Error('Document introuvable');
      if (document.status !== 'ISSUED' && document.status !== 'ACCEPTED') throw new Error('Seul un document émis ou accepté peut être annulé');
      
      const profile = await db.clientProfiles.get(document.clientProfileId);
      if (!profile) throw new Error('Client introuvable');
      
      const cancelled: CommercialDocumentRecord = { ...document, status: 'CANCELLED', cancelledAt: now, statusReason: trimmed, updatedAt: now };
      
      let title = 'Devis';
      if (document.type === 'PROFORMA') title = 'Proforma';
      else if (document.type === 'DELIVERY_NOTE') title = 'Bon de livraison';

      const event: TimelineEventRecord = { id: crypto.randomUUID(), contactId: profile.contactId, type: 'COMMERCIAL_DOCUMENT_CANCELLED' as any, occurredAt: now, createdAt: now, sourceEntityType: 'COMMERCIAL_DOCUMENT' as any, sourceEntityId: document.id, title: `${title} ${document.number} annulé`, summary: 'Annulation enregistrée', payloadVersion: 1 };
      await db.commercialDocuments.put(cancelled);
      await db.timelineEvents.add(event);
    });
    
    const result = await this.get(documentId);
    if (!result) throw new Error('Document introuvable après annulation');
    return result;
  }

  async changeStatus(documentId: string, status: CommercialDocumentStatus, now: string): Promise<CommercialDocumentAggregate> {
    await db.transaction('rw', [db.commercialDocuments, db.timelineEvents, db.clientProfiles], async () => {
      const document = await db.commercialDocuments.get(documentId);
      if (!document) throw new Error('Document introuvable');
      const profile = await db.clientProfiles.get(document.clientProfileId);
      
      let update: Partial<CommercialDocumentRecord> = { status, updatedAt: now };
      if (status === 'ACCEPTED') update.acceptedAt = now;
      if (status === 'REJECTED') update.rejectedAt = now;
      if (status === 'DELIVERED') update.deliveredAt = now;
      if (status === 'CONVERTED') update.convertedAt = now;
      
      await db.commercialDocuments.update(documentId, update);
      
      if (profile) {
        let title = 'Devis';
        if (document.type === 'PROFORMA') title = 'Proforma';
        else if (document.type === 'DELIVERY_NOTE') title = 'Bon de livraison';
        const event: TimelineEventRecord = { id: crypto.randomUUID(), contactId: profile.contactId, type: `COMMERCIAL_DOCUMENT_${status}` as any, occurredAt: now, createdAt: now, sourceEntityType: 'COMMERCIAL_DOCUMENT' as any, sourceEntityId: document.id, title: `${title} ${document.number} passé au statut ${status}`, summary: 'Mise à jour du statut', payloadVersion: 1 };
        await db.timelineEvents.add(event);
      }
    });
    const result = await this.get(documentId);
    if (!result) throw new Error('Document introuvable après modification');
    return result;
  }
}
