import { formatMinor } from '@/modules/invoices/domain/invoice';
import { PAYMENT_METHOD_LABELS, PaymentRecord } from '../domain/payment';
import { PaymentReceiptPdfData, paymentReceiptNumber } from './payment-receipt-pdf';

export type PaymentReceiptImageData = PaymentReceiptPdfData;

const WIDTH = 1080;
const HEIGHT = 1528;
const PADDING = 72;

function loadImage(dataUri?: string): Promise<HTMLImageElement | null> {
  if (!dataUri) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = dataUri;
  });
}

function fitImage(image: HTMLImageElement, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
  return { width: image.naturalWidth * ratio, height: image.naturalHeight * ratio };
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  let result = text;
  while (result.length > 1 && ctx.measureText(result).width > maxWidth) result = result.slice(0, -1);
  ctx.fillText(result === text ? result : `${result}…`, x, y);
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Création de l’image impossible')), 'image/png'));
}

export function paymentReceiptImageFilename(payment: PaymentRecord): string {
  return `recu-paiement-${paymentReceiptNumber(payment).toLocaleLowerCase('fr')}.png`;
}

export async function generatePaymentReceiptImage(value: PaymentReceiptImageData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Création de l’image impossible');

  const [logo, stamp] = await Promise.all([
    loadImage(value.companyLogoDataUri ?? value.invoice.companySnapshot.logoDataUri),
    loadImage(value.stampDataUri),
  ]);
  const company = value.invoice.companySnapshot;
  const receiptId = paymentReceiptNumber(value.payment);
  const amount = formatMinor(value.payment.amountMinor, value.payment.currency, value.payment.currencyScale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#06460e';
  ctx.fillRect(0, 0, WIDTH, 280);
  if (logo) {
    const dimensions = fitImage(logo, 150, 110);
    ctx.drawImage(logo, PADDING, 54, dimensions.width, dimensions.height);
  }
  const companyX = PADDING + (logo ? 176 : 0);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 30px Arial, sans-serif';
  drawText(ctx, (company.displayName || 'ENTREPRISE').toUpperCase(), companyX, 100, 420);
  ctx.font = '400 23px Arial, sans-serif';
  drawText(ctx, company.phone || '', companyX, 138, 420);
  ctx.font = '700 42px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('REÇU DE PAIEMENT', WIDTH - PADDING, 185);
  ctx.font = '400 22px Arial, sans-serif';
  ctx.fillText(receiptId, WIDTH - PADDING, 222);
  ctx.textAlign = 'left';

  let y = 360;
  ctx.fillStyle = '#6b7280';
  ctx.font = '400 23px Arial, sans-serif';
  ctx.fillText('Reçu de :', PADDING, y);
  y += 46;
  ctx.fillStyle = '#1f2937';
  ctx.font = '700 34px Arial, sans-serif';
  drawText(ctx, (value.clientName || value.invoice.clientSnapshot.displayName).toUpperCase(), PADDING, y, WIDTH - PADDING * 2);
  y += 66;
  ctx.font = '400 25px Arial, sans-serif';
  drawText(ctx, `Facture : ${value.invoice.number || 'Sans numéro'}`, PADDING, y, WIDTH - PADDING * 2);
  y += 42;
  drawText(ctx, `Date du paiement : ${value.payment.paymentDate}`, PADDING, y, WIDTH - PADDING * 2);
  y += 42;
  drawText(ctx, `Mode : ${PAYMENT_METHOD_LABELS[value.payment.method]}`, PADDING, y, WIDTH - PADDING * 2);
  if (value.payment.reference) {
    y += 42;
    drawText(ctx, `Référence : ${value.payment.reference}`, PADDING, y, WIDTH - PADDING * 2);
  }

  const amountY = y + 70;
  ctx.fillStyle = '#effaf1';
  ctx.strokeStyle = '#06460e';
  ctx.lineWidth = 3;
  ctx.fillRect(PADDING, amountY, WIDTH - PADDING * 2, 178);
  ctx.strokeRect(PADDING, amountY, WIDTH - PADDING * 2, 178);
  ctx.fillStyle = '#06460e';
  ctx.font = '700 23px Arial, sans-serif';
  ctx.fillText('MONTANT REÇU', PADDING + 34, amountY + 55);
  ctx.fillStyle = '#1f2937';
  ctx.font = '700 48px Arial, sans-serif';
  drawText(ctx, amount, PADDING + 34, amountY + 125, WIDTH - PADDING * 2 - 68);

  let noteY = amountY + 245;
  ctx.fillStyle = '#6b7280';
  ctx.font = '400 21px Arial, sans-serif';
  drawText(ctx, 'Ce document atteste de l’enregistrement local du paiement indiqué.', PADDING, noteY, WIDTH - PADDING * 2);
  if (value.payment.note) {
    noteY += 38;
    drawText(ctx, `Note : ${value.payment.note}`, PADDING, noteY, WIDTH - PADDING * 2);
  }

  const signatureX = WIDTH - PADDING - 300;
  const signatureY = HEIGHT - 255;
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(signatureX, signatureY);
  ctx.lineTo(WIDTH - PADDING, signatureY);
  ctx.stroke();
  ctx.fillStyle = '#6b7280';
  ctx.font = '400 20px Arial, sans-serif';
  ctx.fillText('Cachet de l’entreprise', signatureX + 24, signatureY + 34);
  if (stamp) {
    const dimensions = fitImage(stamp, 220, 160);
    ctx.drawImage(stamp, signatureX + 34, signatureY - dimensions.height - 20, dimensions.width, dimensions.height);
  }

  ctx.fillStyle = '#6b7280';
  ctx.font = '400 18px Arial, sans-serif';
  ctx.fillText('Généré hors connexion par SAMTECH CRM', PADDING, HEIGHT - 54);
  return canvasBlob(canvas);
}

export function downloadPaymentReceiptImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function sharePaymentReceiptImage(blob: Blob, filename: string): Promise<'SHARED' | 'DOWNLOADED'> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Reçu de paiement' });
    return 'SHARED';
  }
  downloadPaymentReceiptImage(blob, filename);
  return 'DOWNLOADED';
}
