import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import type { InvoiceRecord } from '@/modules/invoices/domain/invoice';
import type { PaymentRecord } from '../domain/payment';
import { generatePaymentReceiptPdf, paymentReceiptFilename } from '../pdf/payment-receipt-pdf';
import { paymentReceiptImageFilename } from '../pdf/payment-receipt-image';

const payment: PaymentRecord = {
  id: '11111111-1111-4111-8111-111111111111', invoiceId: '22222222-2222-4222-8222-222222222222', clientProfileId: '33333333-3333-4333-8333-333333333333',
  paymentDate: '2026-07-25', amountMinor: 25_000, currency: 'XOF', currencyScale: 0, method: 'WAVE', reference: 'WAVE-123', status: 'ACTIVE', createdAt: '2026-07-25T10:00:00.000Z', updatedAt: '2026-07-25T10:00:00.000Z',
};

const invoice: InvoiceRecord = {
  id: payment.invoiceId, clientProfileId: payment.clientProfileId, number: 'FAC-2026-0001', status: 'PARTIELLEMENT_PAYEE', issueDate: '2026-07-20', currency: 'XOF', currencyScale: 0,
  companySnapshot: { displayName: 'SAMTECH', phone: '+221 33 000 00 00' }, clientSnapshot: { displayName: 'Awa Diop' }, subtotalMinor: 50_000, discountTotalMinor: 0, taxTotalMinor: 0, grandTotalMinor: 50_000, paidTotalMinor: 25_000, balanceMinor: 25_000, createdAt: '2026-07-20T10:00:00.000Z', updatedAt: '2026-07-25T10:00:00.000Z',
};

describe('Reçu de paiement PDF', () => {
  it('génère un reçu PDF valide et un nom de fichier portable', async () => {
    const bytes = await generatePaymentReceiptPdf({ payment, invoice, clientName: 'Awa Diop' });
    expect(new TextDecoder('latin1').decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    expect(paymentReceiptFilename(payment)).toBe('recu-paiement-rcp-20260725-11111111.pdf');
    expect(paymentReceiptImageFilename(payment)).toBe('recu-paiement-rcp-20260725-11111111.png');
  });
});
