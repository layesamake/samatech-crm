import { formatMinor, formatQuantity, InvoiceAggregate } from '../domain/invoice';
import { safePdfFilename } from './invoice-pdf';

const WIDTH = 1080;
const PADDING = 64;

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

function wrap(ctx: CanvasRenderingContext2D, value: string, width: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= width || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function blobFrom(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Création de l’image impossible')), 'image/png'));
}

export function safeInvoiceImageFilename(number?: string, status?: string, type?: string): string {
  return safePdfFilename(number, status, type).replace(/\.pdf$/, '.png');
}

export async function generateInvoiceImage(value: InvoiceAggregate): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Création de l’image impossible');

  context.font = '400 22px Arial, sans-serif';
  const lineRows = value.lines.map((line) => Math.max(64, wrap(context, line.designationSnapshot, 360).length * 30 + 30));
  const height = Math.max(1500, Math.min(30_000, 940 + lineRows.reduce((total, row) => total + row, 0)));
  canvas.width = WIDTH;
  canvas.height = height;

  const logo = await loadImage(value.invoice.companySnapshot.logoDataUri);
  const invoice = value.invoice;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, WIDTH, height);
  context.fillStyle = '#06460e';
  context.fillRect(0, 0, WIDTH, 242);
  if (logo) {
    const dimensions = fitImage(logo, 140, 96);
    context.drawImage(logo, PADDING, 44, dimensions.width, dimensions.height);
  }
  const companyX = PADDING + (logo ? 164 : 0);
  context.fillStyle = '#ffffff';
  context.font = '700 30px Arial, sans-serif';
  context.fillText((invoice.companySnapshot.displayName || 'ENTREPRISE').toUpperCase(), companyX, 94);
  context.font = '400 21px Arial, sans-serif';
  context.fillText(invoice.companySnapshot.phone || '', companyX, 130);
  context.textAlign = 'right';
  context.font = '700 46px Arial, sans-serif';
  context.fillText('FACTURE', WIDTH - PADDING, 142);
  context.font = '700 23px Arial, sans-serif';
  context.fillText(invoice.status === 'BROUILLON' ? 'BROUILLON' : `# ${invoice.number || ''}`, WIDTH - PADDING, 180);
  context.textAlign = 'left';

  let y = 306;
  context.fillStyle = '#1f2937';
  context.font = '700 31px Arial, sans-serif';
  context.fillText((invoice.clientSnapshot.displayName || value.clientName).toUpperCase(), PADDING, y);
  context.fillStyle = '#6b7280';
  context.font = '400 21px Arial, sans-serif';
  context.textAlign = 'right';
  context.fillText(`Date : ${invoice.issueDate || 'Non émise'}`, WIDTH - PADDING, y - 24);
  context.fillText(invoice.terms || 'Payable à réception', WIDTH - PADDING, y + 12);
  context.textAlign = 'left';
  y += 72;

  context.fillStyle = '#06460e';
  context.fillRect(PADDING, y, WIDTH - PADDING * 2, 48);
  context.fillStyle = '#ffffff';
  context.font = '700 19px Arial, sans-serif';
  context.fillText('DESCRIPTION', PADDING + 18, y + 31);
  context.textAlign = 'right';
  context.fillText('QTÉ', WIDTH - PADDING - 255, y + 31);
  context.fillText('TAUX', WIDTH - PADDING - 130, y + 31);
  context.fillText('MONTANT', WIDTH - PADDING - 18, y + 31);
  context.textAlign = 'left';
  y += 48;

  context.font = '400 22px Arial, sans-serif';
  value.lines.forEach((line, index) => {
    const rowHeight = lineRows[index];
    const description = wrap(context, line.designationSnapshot, 360);
    context.fillStyle = index % 2 ? '#f8fafc' : '#ffffff';
    context.fillRect(PADDING, y, WIDTH - PADDING * 2, rowHeight);
    context.fillStyle = '#1f2937';
    description.forEach((item, itemIndex) => context.fillText(item, PADDING + 18, y + 30 + itemIndex * 30));
    context.textAlign = 'right';
    context.fillText(formatQuantity(line.quantityScaled, line.quantityScale), WIDTH - PADDING - 255, y + 30);
    context.fillText(formatMinor(line.unitPriceMinor, invoice.currency, invoice.currencyScale, { noCurrency: true }), WIDTH - PADDING - 130, y + 30);
    context.fillText(formatMinor(line.lineTotalMinor, invoice.currency, invoice.currencyScale, { noCurrency: true }), WIDTH - PADDING - 18, y + 30);
    context.textAlign = 'left';
    context.strokeStyle = '#e5e7eb';
    context.beginPath(); context.moveTo(PADDING, y + rowHeight); context.lineTo(WIDTH - PADDING, y + rowHeight); context.stroke();
    y += rowHeight;
  });

  y += 48;
  const totalsX = WIDTH - PADDING - 380;
  context.fillStyle = '#f0fdf4';
  context.fillRect(totalsX, y, 380, 154);
  context.fillStyle = '#1f2937';
  context.font = '400 22px Arial, sans-serif';
  context.fillText('Sous-total', totalsX + 22, y + 38);
  context.fillText('Total', totalsX + 22, y + 82);
  context.font = '700 22px Arial, sans-serif';
  context.fillText('Solde dû', totalsX + 22, y + 126);
  context.textAlign = 'right';
  context.font = '400 22px Arial, sans-serif';
  context.fillText(formatMinor(invoice.subtotalMinor, invoice.currency, invoice.currencyScale), WIDTH - PADDING - 22, y + 38);
  context.fillText(formatMinor(invoice.grandTotalMinor, invoice.currency, invoice.currencyScale), WIDTH - PADDING - 22, y + 82);
  context.font = '700 22px Arial, sans-serif';
  context.fillText(formatMinor(invoice.balanceMinor, invoice.currency, invoice.currencyScale), WIDTH - PADDING - 22, y + 126);
  context.textAlign = 'left';
  y += 232;

  if (invoice.status === 'ANNULEE') {
    context.fillStyle = '#b91c1c';
    context.font = '700 36px Arial, sans-serif';
    context.fillText('FACTURE ANNULÉE', PADDING, y);
    y += 42;
  }
  context.fillStyle = '#6b7280';
  context.font = '400 19px Arial, sans-serif';
  context.fillText('Généré hors connexion par SAMTECH CRM', PADDING, Math.min(y, height - 48));
  return blobFrom(canvas);
}

export function downloadInvoiceImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function shareOrDownloadInvoiceImage(blob: Blob, filename: string): Promise<'SHARED' | 'DOWNLOADED'> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: filename });
    return 'SHARED';
  }
  downloadInvoiceImage(blob, filename);
  return 'DOWNLOADED';
}
