import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { CommercialDocumentAggregate } from '../domain/commercial-document';
import { formatMinor, formatQuantity } from '@/modules/invoices/domain/invoice';

const A4: [number, number] = [595.28, 841.89]; const MARGIN = 44; const BOTTOM = 48;
export const PDF_MIME_TYPE = 'application/pdf';

export function safePdfFilename(document: CommercialDocumentAggregate) {
  let title = 'document';
  if (document.document.type === 'QUOTE') title = 'devis';
  else if (document.document.type === 'PROFORMA') title = 'proforma';
  else if (document.document.type === 'DELIVERY_NOTE') title = 'bl';
  
  const base = document.document.number || (document.document.status === 'DRAFT' ? 'brouillon' : title);
  return `${title}-${base.toLocaleLowerCase('fr').replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document'}.pdf`;
}

function safeText(value: unknown): string { return String(value ?? '').replace(/[\u00A0\u202F]/g, ' ').replace(/[‐‑‒–—―]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\xA0-\xFF\u0152\u0153\u20AC\n]/g, '?'); }

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const paragraphs = safeText(text).split('\n');
  const result: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { result.push(''); continue; }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate;
      else {
        if (line) result.push(line);
        let chunk = '';
        for (const char of word) {
          const next = chunk + char;
          if (font.widthOfTextAtSize(next, size) > width && chunk) { result.push(chunk); chunk = char; } else chunk = next;
        }
        line = chunk;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

export async function generateCommercialDocumentPdf(value: CommercialDocumentAggregate): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  
  let title = 'Document';
  if (value.document.type === 'QUOTE') title = 'Devis';
  else if (value.document.type === 'PROFORMA') title = 'Facture Proforma';
  else if (value.document.type === 'DELIVERY_NOTE') title = 'Bon de Livraison';

  document.setTitle(safeText(value.document.number || `${title} brouillon`));
  document.setSubject(safeText(`SAMTECH CRM - ${title} ${value.document.status} - ${value.document.companySnapshot.displayName} - ${value.document.clientSnapshot.displayName || value.clientName}`));
  document.setCreator('SAMTECH CRM');
  document.setCreationDate(new Date(value.document.issuedAt || value.document.createdAt));
  
  let page!: PDFPage; let y = 0; const pages: PDFPage[] = [];
  
  const embedImage = async (dataUri: string) => {
    try {
      const parts = dataUri.split(',');
      if (parts.length !== 2) return null;
      const isPng = dataUri.includes('image/png');
      const bytes = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
      return isPng ? await document.embedPng(bytes) : await document.embedJpg(bytes);
    } catch { return null; }
  };
  
  const logoImage = value.document.companySnapshot.logoDataUri ? await embedImage(value.document.companySnapshot.logoDataUri) : null;
  const signatureImage = value.document.companySnapshot.managerSignatureDataUri ? await embedImage(value.document.companySnapshot.managerSignatureDataUri) : null;

  const primaryBlue = rgb(43 / 255, 127 / 255, 185 / 255);
  const textDark = rgb(0.2, 0.2, 0.2);
  const textLight = rgb(0.4, 0.4, 0.4);
  const bgLight = rgb(244 / 255, 248 / 255, 251 / 255);
  const lineGray = rgb(0.9, 0.9, 0.9);

  const newPage = () => {
    page = document.addPage(A4); pages.push(page); y = A4[1] - MARGIN;
    if (logoImage) {
      const scale = Math.min(150 / logoImage.width, 50 / logoImage.height);
      page.drawImage(logoImage, { x: MARGIN, y: y - logoImage.height * scale + 10, width: logoImage.width * scale, height: logoImage.height * scale });
    }
    
    const writeTextRight = (text: string, top: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>) => {
      const textWidth = font.widthOfTextAtSize(safeText(text), size);
      page.drawText(safeText(text), { x: A4[0] - MARGIN - textWidth, y: top, size, font, color });
    };

    let rightY = y;
    writeTextRight(title, rightY - 10, 32, regular, primaryBlue);
    rightY -= 35;
    writeTextRight(safeText(value.document.status === 'DRAFT' ? 'BROUILLON' : `# ${value.document.number || ''}`), rightY, 11, bold, textDark);
    rightY -= 30;
    
    if (value.document.issueDate) {
      writeTextRight(`Date d'émission : ${new Date(value.document.issueDate).toLocaleDateString('fr-FR')}`, rightY, 9, regular, textLight);
      rightY -= 14;
    }
    if (value.document.validUntil) {
      writeTextRight(`Valable jusqu'au : ${new Date(value.document.validUntil).toLocaleDateString('fr-FR')}`, rightY, 9, regular, textLight);
      rightY -= 14;
    }

    let leftY = y - 70;
    page.drawText(safeText(value.document.companySnapshot.displayName), { x: MARGIN, y: leftY, size: 10, font: bold, color: textDark });
    leftY -= 14;
    for (const line of wrap(value.document.companySnapshot.address || '', regular, 9, 200)) { page.drawText(line, { x: MARGIN, y: leftY, size: 9, font: regular, color: textLight }); leftY -= 12; }
    if (value.document.companySnapshot.phone) { page.drawText(safeText(value.document.companySnapshot.phone), { x: MARGIN, y: leftY, size: 9, font: regular, color: textLight }); leftY -= 12; }
    if (value.document.companySnapshot.email) { page.drawText(safeText(value.document.companySnapshot.email), { x: MARGIN, y: leftY, size: 9, font: regular, color: textLight }); leftY -= 12; }
    
    leftY -= 20;
    page.drawText('Adressé à :', { x: MARGIN, y: leftY, size: 9, font: regular, color: textLight });
    leftY -= 14;
    page.drawText(safeText(value.document.clientSnapshot.displayName || value.clientName), { x: MARGIN, y: leftY, size: 11, font: bold, color: textDark });
    leftY -= 16;
    for (const line of wrap(value.document.clientSnapshot.address || '', regular, 9, 250)) { page.drawText(line, { x: MARGIN, y: leftY, size: 9, font: regular, color: textLight }); leftY -= 12; }
    if (value.document.clientSnapshot.phone) { page.drawText(safeText(value.document.clientSnapshot.phone), { x: MARGIN, y: leftY, size: 9, font: regular, color: textLight }); leftY -= 12; }
    if (value.document.clientSnapshot.email) { page.drawText(safeText(value.document.clientSnapshot.email), { x: MARGIN, y: leftY, size: 9, font: regular, color: textLight }); leftY -= 12; }

    y = Math.min(leftY, rightY) - 30;
  };

  newPage();

  page.drawRectangle({ x: MARGIN, y: y - 20, width: A4[0] - MARGIN * 2, height: 20, color: bgLight });
  const isDelivery = value.document.type === 'DELIVERY_NOTE';
  
  page.drawText('Description', { x: MARGIN + 10, y: y - 13, size: 8, font: bold, color: textDark });
  page.drawText('Qté', { x: A4[0] - MARGIN - (isDelivery ? 40 : 180), y: y - 13, size: 8, font: bold, color: textDark });
  if (!isDelivery) {
    page.drawText('Prix unit.', { x: A4[0] - MARGIN - 130, y: y - 13, size: 8, font: bold, color: textDark });
    page.drawText('Total', { x: A4[0] - MARGIN - 50, y: y - 13, size: 8, font: bold, color: textDark });
  }

  y -= 30;

  for (const line of value.lines) {
    const titleLines = wrap(line.designationSnapshot, bold, 9, 220);
    const descLines = line.descriptionSnapshot ? wrap(line.descriptionSnapshot, regular, 8, 220) : [];
    const height = (titleLines.length + descLines.length) * 12 + 10;
    
    if (y - height < BOTTOM) newPage();
    
    let lineY = y;
    for (const t of titleLines) { page.drawText(t, { x: MARGIN + 10, y: lineY, size: 9, font: bold, color: textDark }); lineY -= 12; }
    for (const d of descLines) { page.drawText(d, { x: MARGIN + 10, y: lineY, size: 8, font: regular, color: textLight }); lineY -= 12; }
    
    const qty = `${formatQuantity(line.quantityScaled, line.quantityScale)} ${line.unitLabelSnapshot || ''}`.trim();
    page.drawText(safeText(qty), { x: A4[0] - MARGIN - (isDelivery ? 40 : 180), y: y, size: 9, font: regular, color: textDark });
    
    if (!isDelivery) {
      page.drawText(safeText(formatMinor(line.unitPriceMinor ?? 0, value.document.currency, value.document.currencyScale, { noCurrency: true })), { x: A4[0] - MARGIN - 130, y: y, size: 9, font: regular, color: textDark });
      page.drawText(safeText(formatMinor(line.lineTotalMinor ?? 0, value.document.currency, value.document.currencyScale, { noCurrency: true })), { x: A4[0] - MARGIN - 50, y: y, size: 9, font: bold, color: textDark });
    }

    y -= height;
    page.drawLine({ start: { x: MARGIN, y: y + 5 }, end: { x: A4[0] - MARGIN, y: y + 5 }, thickness: 1, color: lineGray });
  }

  y -= 20;

  if (!isDelivery) {
    if (y - 100 < BOTTOM) newPage();
    const rightCol = A4[0] - MARGIN - 150;
    let sumY = y;

    const drawSum = (label: string, amount: number, isBold: boolean = false) => {
      page.drawText(safeText(label), { x: rightCol, y: sumY, size: 9, font: isBold ? bold : regular, color: textDark });
      const val = safeText(formatMinor(amount, value.document.currency, value.document.currencyScale));
      const width = (isBold ? bold : regular).widthOfTextAtSize(val, 9);
      page.drawText(val, { x: A4[0] - MARGIN - width, y: sumY, size: 9, font: isBold ? bold : regular, color: textDark });
      sumY -= 16;
    };

    if (value.document.discountTotalMinor! > 0 || value.document.taxTotalMinor! > 0) {
      drawSum('Sous-total', value.document.subtotalMinor!);
      if (value.document.discountTotalMinor! > 0) drawSum('Remise', -value.document.discountTotalMinor!);
      if (value.document.taxTotalMinor! > 0) drawSum('Taxes', value.document.taxTotalMinor!);
      sumY -= 4;
    }
    
    page.drawRectangle({ x: rightCol - 10, y: sumY - 4, width: 160, height: 24, color: bgLight });
    drawSum('TOTAL', value.document.grandTotalMinor!, true);
    y = sumY - 20;
  }

  if (value.document.notes || value.document.terms) {
    if (y - 60 < BOTTOM) newPage();
    if (value.document.notes) {
      page.drawText('Notes :', { x: MARGIN, y, size: 9, font: bold, color: textDark });
      y -= 14;
      for (const line of wrap(value.document.notes, regular, 8, 300)) { page.drawText(line, { x: MARGIN, y, size: 8, font: regular, color: textLight }); y -= 11; }
      y -= 10;
    }
    if (value.document.terms) {
      page.drawText('Conditions :', { x: MARGIN, y, size: 9, font: bold, color: textDark });
      y -= 14;
      for (const line of wrap(value.document.terms, regular, 8, 300)) { page.drawText(line, { x: MARGIN, y, size: 8, font: regular, color: textLight }); y -= 11; }
    }
  }

  if (signatureImage) {
    if (y - 100 < BOTTOM) newPage();
    y -= 30;
    const scale = Math.min(120 / signatureImage.width, 60 / signatureImage.height);
    page.drawImage(signatureImage, { x: A4[0] - MARGIN - signatureImage.width * scale, y: y - signatureImage.height * scale, width: signatureImage.width * scale, height: signatureImage.height * scale });
  }

  const totalPages = pages.length;
  pages.forEach((p, index) => {
    p.drawText(`Page ${index + 1} / ${totalPages}`, { x: A4[0] / 2 - 20, y: MARGIN, size: 8, font: regular, color: textLight });
  });

  return await document.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([Uint8Array.from(bytes).buffer], { type: PDF_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareOrDownloadPdf(bytes: Uint8Array, filename: string): Promise<void> {
  const file = new File([Uint8Array.from(bytes).buffer], filename, { type: PDF_MIME_TYPE });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; } catch (caught) { if ((caught as Error).name !== 'AbortError') throw caught; return; }
  }
  downloadPdf(bytes, filename);
}
