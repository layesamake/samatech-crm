import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import type { InvoiceAggregate, InvoiceLineRecord, InvoiceStatus } from '../domain/invoice';
import { generateInvoicePdf, invoiceFinancialSummary, PDF_MIME_TYPE, safePdfFilename } from '../pdf/invoice-pdf';

const now = '2026-07-17T12:00:00.000Z';

function fixture(status: InvoiceStatus = 'EMISE', lineCount = 1): InvoiceAggregate {
  const lines: InvoiceLineRecord[] = Array.from({ length: lineCount }, (_, position) => ({
    id: crypto.randomUUID(), invoiceId: '22222222-2222-4222-8222-222222222222', position,
    designationSnapshot: `Prestation locale ${position + 1}`,
    descriptionSnapshot: `Description suffisamment longue pour vérifier la mise en page et le retour à la ligne ${position + 1}.`,
    unitLabelSnapshot: 'jour', quantityScaled: 15, quantityScale: 1, unitPriceMinor: 10_000,
    grossMinor: 15_000, discountType: 'PERCENT', discountValue: 1_000, discountMinor: 1_500,
    taxRateBasisPoints: 0, taxMinor: 0, lineTotalMinor: 13_500, createdAt: now, updatedAt: now,
  }));
  const grandTotalMinor = 13_500 * lineCount;
  return {
    clientName: 'Entreprise Démonstration', lines,
    invoice: {
      id: '22222222-2222-4222-8222-222222222222', clientProfileId: '11111111-1111-4111-8111-111111111111',
      ...(status === 'BROUILLON' ? {} : { number: 'FAC-2026-0001', issuedAt: now }), status,
      issueDate: '2026-07-17', dueDate: '2026-07-31', currency: 'XOF', currencyScale: 0,
      companySnapshot: { displayName: 'SAMTECH', address: 'Plateau, Dakar', phone: '+221 33 000 00 00', email: 'contact@samtech.sn' },
      clientSnapshot: { displayName: 'Entreprise Démonstration', address: 'Mermoz, Dakar', phone: '+221 77 000 00 00' },
      subtotalMinor: 15_000 * lineCount, discountTotalMinor: 1_500 * lineCount, taxTotalMinor: 0,
      grandTotalMinor, paidTotalMinor: 0, balanceMinor: status === 'ANNULEE' ? 0 : grandTotalMinor,
      notes: 'Document généré hors ligne depuis les instantanés de la facture.', terms: 'Paiement à réception.',
      ...(status === 'ANNULEE' ? { cancelledAt: now, cancellationReason: 'Erreur commerciale' } : {}),
      createdAt: now, updatedAt: now,
    },
  };
}

describe('PDF de facture Sprint 5', () => {
  it.each(['BROUILLON', 'EMISE', 'ANNULEE'] as const)('génère un PDF %s valide et lisible par pdf-lib', async (status) => {
    const bytes = await generateInvoicePdf(fixture(status));
    expect(new TextDecoder('latin1').decode(bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.byteLength).toBeGreaterThan(1_000);
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(document.getTitle()).toBe(status === 'BROUILLON' ? 'Facture brouillon' : 'FAC-2026-0001');
    expect(document.getSubject()).toContain(`SAMTECH CRM - ${status} - SAMTECH - Entreprise Démonstration - XOF`);
  });

  it('pagine une facture longue sans altérer les données', async () => {
    const bytes = await generateInvoicePdf(fixture('EMISE', 80));
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(2);
  });

  it('produit un nom de fichier portable', () => {
    expect(PDF_MIME_TYPE).toBe('application/pdf');
    expect(safePdfFilename('FAC/2026 0001')).toBe('facture-fac-2026-0001.pdf');
    expect(safePdfFilename(undefined, 'BROUILLON')).toBe('facture-brouillon.pdf');
  });

  it.each([
    ['EMISE', 0, 13_500, ['TOTAL : 13 500 XOF', 'Payé : 0 XOF', 'Solde : 13 500 XOF']],
    ['PARTIELLEMENT_PAYEE', 3_500, 10_000, ['TOTAL : 13 500 XOF', 'Payé : 3 500 XOF', 'Solde : 10 000 XOF']],
    ['PAYEE', 13_500, 0, ['TOTAL : 13 500 XOF', 'Payé : 13 500 XOF', 'Solde : 0 XOF']],
  ] as const)('utilise les agrégats actuels pour le PDF %s', async (status, paidTotalMinor, balanceMinor, expected) => {
    const value = fixture(status); value.invoice.paidTotalMinor = paidTotalMinor; value.invoice.balanceMinor = balanceMinor;
    expect(invoiceFinancialSummary(value)).toEqual(expected);
    const document = await PDFDocument.load(await generateInvoicePdf(value));
    expect(document.getSubject()).toContain(status);
  });

  it('reflète les deux retours de statut après contrepassation', () => {
    const value = fixture('PAYEE');
    value.invoice.paidTotalMinor = 13_500;
    value.invoice.balanceMinor = 0;
    expect(invoiceFinancialSummary(value)).toContain('Solde : 0 XOF');
    value.invoice.status = 'PARTIELLEMENT_PAYEE';
    value.invoice.paidTotalMinor = 3_500;
    value.invoice.balanceMinor = 10_000;
    expect(invoiceFinancialSummary(value)).toEqual(['TOTAL : 13 500 XOF', 'Payé : 3 500 XOF', 'Solde : 10 000 XOF']);
    value.invoice.status = 'EMISE';
    value.invoice.paidTotalMinor = 0;
    value.invoice.balanceMinor = 13_500;
    expect(invoiceFinancialSummary(value)).toEqual(['TOTAL : 13 500 XOF', 'Payé : 0 XOF', 'Solde : 13 500 XOF']);
  });

  it.runIf(process.env.GENERATE_PDF_FIXTURES === '1')('écrit les spécimens destinés au contrôle visuel', async () => {
    const output = resolve(process.cwd(), 'output', 'pdf');
    await mkdir(output, { recursive: true });
    const longText = fixture('EMISE', 3); longText.lines = longText.lines.map((line) => ({ ...line, designationSnapshot: `${line.designationSnapshot} — accompagnement stratégique, déploiement opérationnel et transfert de compétences auprès des équipes locales`, descriptionSnapshot: 'Description détaillée destinée à vérifier les retours à la ligne, la conservation des marges et la lisibilité générale du document. '.repeat(4) })); longText.invoice.notes = 'Note longue avec plusieurs informations commerciales, sans coordonnée réelle. '.repeat(12);
    const accents = fixture('EMISE', 2); accents.invoice.companySnapshot.displayName = 'Œuvre & Études'; accents.invoice.clientSnapshot.displayName = 'Société Démonstration'; accents.clientName = 'Société Démonstration'; accents.invoice.notes = 'Accents contrôlés : à, â, ç, é, è, ê, ë, î, ï, ô, ù, û, ü, ÿ, œ et €.';
    await Promise.all([
      ['facture-simple.pdf', fixture('EMISE', 1)],
      ['facture-multipage.pdf', fixture('EMISE', 80)],
      ['facture-textes-longs.pdf', longText],
      ['facture-accents.pdf', accents],
      ['facture-annulee.pdf', fixture('ANNULEE', 2)],
    ].map(async ([name, value]) => writeFile(resolve(output, name as string), await generateInvoicePdf(value as InvoiceAggregate))));
  });
});
