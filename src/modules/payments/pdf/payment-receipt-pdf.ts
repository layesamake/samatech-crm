import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatMinor, InvoiceRecord } from '@/modules/invoices/domain/invoice';
import { PDF_MIME_TYPE } from '@/modules/invoices/pdf/invoice-pdf';
import { PAYMENT_METHOD_LABELS, PaymentRecord } from '../domain/payment';

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 44;

export interface PaymentReceiptPdfData {
  payment: PaymentRecord;
  invoice: InvoiceRecord;
  clientName: string;
  companyLogoDataUri?: string;
  companySignatureDataUri?: string;
}

function safeText(value: unknown): string {
  return String(value ?? '').replace(/[\u00A0\u202F]/g, ' ').replace(/[^\x20-\x7E\xA0-\xFF\u0152\u0153\u20AC\n]/g, '?');
}

export function paymentReceiptNumber(payment: PaymentRecord): string {
  return `RCP-${payment.paymentDate.replace(/-/g, '')}-${payment.id.slice(0, 8).toUpperCase()}`;
}

export function paymentReceiptFilename(payment: PaymentRecord): string {
  return `recu-paiement-${paymentReceiptNumber(payment).toLocaleLowerCase('fr')}.pdf`;
}

export async function generatePaymentReceiptPdf(value: PaymentReceiptPdfData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const page = document.addPage(A4);
  const primary = rgb(6 / 255, 70 / 255, 14 / 255);
  const dark = rgb(0.16, 0.18, 0.2);
  const muted = rgb(0.38, 0.42, 0.46);
  const line = rgb(0.86, 0.88, 0.9);
  const receiptId = paymentReceiptNumber(value.payment);

  document.setTitle(`Reçu de paiement ${receiptId}`);
  document.setSubject(`Reçu ${receiptId} pour ${value.clientName}`);
  document.setCreator('SAMTECH CRM');
  document.setCreationDate(new Date(value.payment.createdAt));

  const embedImage = async (dataUri?: string) => {
    if (!dataUri) return null;
    try {
      const [, base64] = dataUri.split(',', 2);
      if (!base64) return null;
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      return dataUri.includes('image/png') ? await document.embedPng(bytes) : await document.embedJpg(bytes);
    } catch {
      return null;
    }
  };

  const [logo, signature] = await Promise.all([embedImage(value.companyLogoDataUri ?? value.invoice.companySnapshot.logoDataUri), embedImage(value.companySignatureDataUri)]);
  let y = A4[1] - MARGIN;
  if (logo) {
    const dimensions = logo.scaleToFit(84, 54);
    page.drawImage(logo, { x: MARGIN, y: y - dimensions.height, width: dimensions.width, height: dimensions.height });
  }
  page.drawText(safeText(value.invoice.companySnapshot.displayName || 'ENTREPRISE').toUpperCase(), { x: MARGIN + (logo ? 100 : 0), y: y - 12, size: 13, font: bold, color: dark });
  page.drawText(safeText(value.invoice.companySnapshot.phone || ''), { x: MARGIN + (logo ? 100 : 0), y: y - 29, size: 9, font: regular, color: muted });

  const title = 'REÇU DE PAIEMENT';
  const titleWidth = bold.widthOfTextAtSize(title, 20);
  page.drawText(title, { x: A4[0] - MARGIN - titleWidth, y: y - 12, size: 20, font: bold, color: primary });
  const idWidth = regular.widthOfTextAtSize(receiptId, 9);
  page.drawText(receiptId, { x: A4[0] - MARGIN - idWidth, y: y - 31, size: 9, font: regular, color: muted });

  y -= 92;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 1, color: line });
  y -= 35;

  page.drawText('Reçu de :', { x: MARGIN, y, size: 10, font: regular, color: muted });
  page.drawText(safeText(value.clientName || value.invoice.clientSnapshot.displayName).toUpperCase(), { x: MARGIN, y: y - 18, size: 12, font: bold, color: dark });
  page.drawText(`Facture : ${safeText(value.invoice.number || 'Sans numéro')}`, { x: MARGIN, y: y - 38, size: 10, font: regular, color: dark });
  page.drawText(`Date du paiement : ${safeText(value.payment.paymentDate)}`, { x: MARGIN, y: y - 56, size: 10, font: regular, color: dark });
  page.drawText(`Mode : ${safeText(PAYMENT_METHOD_LABELS[value.payment.method])}`, { x: MARGIN, y: y - 74, size: 10, font: regular, color: dark });
  if (value.payment.reference) page.drawText(`Référence : ${safeText(value.payment.reference)}`, { x: MARGIN, y: y - 92, size: 10, font: regular, color: dark });

  const amount = formatMinor(value.payment.amountMinor, value.payment.currency, value.payment.currencyScale);
  const boxY = y - 120;
  page.drawRectangle({ x: MARGIN, y: boxY, width: A4[0] - MARGIN * 2, height: 76, color: rgb(239 / 255, 250 / 255, 241 / 255), borderColor: primary, borderWidth: 1 });
  page.drawText('MONTANT REÇU', { x: MARGIN + 18, y: boxY + 49, size: 10, font: bold, color: primary });
  page.drawText(safeText(amount), { x: MARGIN + 18, y: boxY + 21, size: 23, font: bold, color: dark });

  y = boxY - 46;
  page.drawText('Ce document atteste uniquement de l’enregistrement local du paiement indiqué.', { x: MARGIN, y, size: 9, font: regular, color: muted });
  if (value.payment.note) {
    y -= 24;
    page.drawText(`Note : ${safeText(value.payment.note)}`, { x: MARGIN, y, size: 9, font: regular, color: muted, maxWidth: A4[0] - MARGIN * 2 });
  }

  const signatureY = 150;
  page.drawLine({ start: { x: A4[0] - MARGIN - 150, y: signatureY }, end: { x: A4[0] - MARGIN, y: signatureY }, thickness: 0.7, color: line });
  page.drawText('Signature de l’entreprise', { x: A4[0] - MARGIN - 130, y: signatureY - 16, size: 9, font: regular, color: muted });
  if (signature) {
    const dimensions = signature.scaleToFit(110, 90);
    page.drawImage(signature, { x: A4[0] - MARGIN - 130, y: signatureY + 12, width: dimensions.width, height: dimensions.height });
  }

  page.drawText('Généré hors connexion par SAMTECH CRM', { x: MARGIN, y: 34, size: 8, font: regular, color: muted });
  return document.save({ useObjectStreams: false });
}

export function downloadPaymentReceiptPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([Uint8Array.from(bytes)], { type: PDF_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function sharePaymentReceiptPdf(bytes: Uint8Array, filename: string): Promise<'SHARED' | 'DOWNLOADED'> {
  const blob = new Blob([Uint8Array.from(bytes)], { type: PDF_MIME_TYPE });
  const file = new File([blob], filename, { type: PDF_MIME_TYPE });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Reçu de paiement' });
    return 'SHARED';
  }
  downloadPaymentReceiptPdf(bytes, filename);
  return 'DOWNLOADED';
}
