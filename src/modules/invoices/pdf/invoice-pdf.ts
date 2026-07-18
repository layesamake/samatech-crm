import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { formatMinor, formatQuantity, InvoiceAggregate } from '../domain/invoice';

const A4: [number, number] = [595.28, 841.89]; const MARGIN = 44; const BOTTOM = 48;
export const PDF_MIME_TYPE = 'application/pdf';
export function safePdfFilename(number?: string, status?: string) { const base = number || (status === 'BROUILLON' ? 'brouillon' : 'facture'); return `facture-${base.toLocaleLowerCase('fr').replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document'}.pdf`; }
export function invoiceFinancialSummary(value: InvoiceAggregate): string[] { return [`TOTAL : ${formatMinor(value.invoice.grandTotalMinor, value.invoice.currency, value.invoice.currencyScale)}`, `Payé : ${formatMinor(value.invoice.paidTotalMinor, value.invoice.currency, value.invoice.currencyScale)}`, `Solde : ${formatMinor(value.invoice.balanceMinor, value.invoice.currency, value.invoice.currencyScale)}`]; }
function safeText(value: unknown): string { return String(value ?? '').replace(/[\u00A0\u202F]/g, ' ').replace(/[‐‑‒–—―]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\xA0-\xFF\u0152\u0153\u20AC\n]/g, '?'); }
function wrap(text: string, font: PDFFont, size: number, width: number): string[] { const paragraphs = safeText(text).split('\n'); const result: string[] = []; for (const paragraph of paragraphs) { const words = paragraph.split(/\s+/).filter(Boolean); if (!words.length) { result.push(''); continue; } let line = ''; for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate; else { if (line) result.push(line); let chunk = ''; for (const char of word) { const next = chunk + char; if (font.widthOfTextAtSize(next, size) > width && chunk) { result.push(chunk); chunk = char; } else chunk = next; } line = chunk; } } if (line) result.push(line); } return result; }

export async function generateInvoicePdf(value: InvoiceAggregate): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(safeText(value.invoice.number || 'Facture brouillon'));
  document.setSubject(safeText(`SAMTECH CRM - ${value.invoice.status} - ${value.invoice.companySnapshot.displayName} - ${value.invoice.clientSnapshot.displayName || value.clientName} - ${value.invoice.currency}`));
  document.setCreator('SAMTECH CRM');
  document.setCreationDate(new Date(value.invoice.issuedAt || value.invoice.createdAt));
  
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
  
  const logoImage = value.invoice.companySnapshot.logoDataUri ? await embedImage(value.invoice.companySnapshot.logoDataUri) : null;
  const signatureImage = value.invoice.companySnapshot.managerSignatureDataUri ? await embedImage(value.invoice.companySnapshot.managerSignatureDataUri) : null;

  const primaryBlue = rgb(43 / 255, 127 / 255, 185 / 255);
  const textDark = rgb(0.2, 0.2, 0.2);
  const textLight = rgb(0.4, 0.4, 0.4);
  const bgLight = rgb(244 / 255, 248 / 255, 251 / 255);
  const lineGray = rgb(0.9, 0.9, 0.9);

  const writeTextRight = (txt: string, yPos: number, size: number, font: PDFFont, color: ReturnType<typeof rgb> = textDark) => {
    const textWidth = font.widthOfTextAtSize(txt, size);
    page.drawText(txt, { x: A4[0] - MARGIN - textWidth, y: yPos, size, font, color });
  };

  const addPage = () => { 
    page = document.addPage(A4); pages.push(page); y = A4[1] - MARGIN; 
    
    let leftY = y;
    if (logoImage) {
      const dims = logoImage.scaleToFit(80, 50);
      page.drawImage(logoImage, { x: MARGIN, y: leftY - dims.height, width: dims.width, height: dims.height });
      leftY -= dims.height + 15;
    } else {
      leftY -= 20;
    }
    
    page.drawText(safeText(value.invoice.companySnapshot.displayName || 'ENTREPRISE').toUpperCase(), { x: MARGIN, y: leftY, size: 12, font: bold, color: textDark }); 
    leftY -= 20;

    let rightY = y;
    writeTextRight('Facture', rightY - 10, 32, regular, primaryBlue);
    rightY -= 35;
    writeTextRight(safeText(value.invoice.status === 'BROUILLON' ? 'BROUILLON' : `# ${value.invoice.number || ''}`), rightY, 11, bold, textDark);
    rightY -= 30;
    writeTextRight('Solde dû', rightY, 10, bold, textDark);
    rightY -= 15;
    writeTextRight(`${value.invoice.currency} ${formatMinor(value.invoice.balanceMinor, value.invoice.currency, value.invoice.currencyScale, { noCurrency: true })}`, rightY, 14, bold, textDark);
    
    y = Math.min(leftY, rightY) - 40;
  };
  
  const ensure = (height: number) => { if (y - height < BOTTOM) addPage(); };
  
  addPage();

  // Client and Dates section
  const clientY = y;
  page.drawText(safeText(value.invoice.clientSnapshot.displayName || value.clientName).toUpperCase(), { x: MARGIN, y: clientY, size: 11, font: bold, color: textDark });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
    } catch { return dateStr; }
  };

  const datesY = clientY + 15;
  const labelsX = A4[0] - MARGIN - 200;
  const valuesX = A4[0] - MARGIN;

  const issueDateStr = formatDate(value.invoice.issueDate) || 'Non émise';
  page.drawText('Date de facture :', { x: labelsX, y: datesY, size: 10, font: regular, color: textLight });
  const issueDateWidth = regular.widthOfTextAtSize(issueDateStr, 10);
  page.drawText(issueDateStr, { x: valuesX - issueDateWidth, y: datesY, size: 10, font: regular, color: textDark });

  const termsStr = safeText(value.invoice.terms || 'Payable à réception');
  page.drawText('Conditions :', { x: labelsX, y: datesY - 18, size: 10, font: regular, color: textLight });
  const termsWidth = regular.widthOfTextAtSize(termsStr, 10);
  page.drawText(termsStr, { x: valuesX - termsWidth, y: datesY - 18, size: 10, font: regular, color: textDark });

  y = datesY - 50;

  // Table Header
  ensure(40);
  page.drawRectangle({ x: MARGIN, y: y - 15, width: A4[0] - MARGIN * 2, height: 25, color: primaryBlue });
  
  const colX = { 
    num: MARGIN + 10, 
    desc: MARGIN + 40, 
    qty: A4[0] - MARGIN - 250, 
    rate: A4[0] - MARGIN - 170, 
    discount: A4[0] - MARGIN - 100, 
    amount: A4[0] - MARGIN - 10 
  };

  const drawColRight = (txt: string, rightAlignX: number, yPos: number, fontFace: PDFFont, size: number, color: ReturnType<typeof rgb>) => {
    const w = fontFace.widthOfTextAtSize(txt, size);
    page.drawText(txt, { x: rightAlignX - w, y: yPos, size, font: fontFace, color });
  };

  page.drawText('#', { x: colX.num, y, size: 10, font: regular, color: rgb(1,1,1) });
  page.drawText('Description', { x: colX.desc, y, size: 10, font: regular, color: rgb(1,1,1) });
  drawColRight('Quantité', colX.qty, y, regular, 10, rgb(1,1,1));
  drawColRight('Taux', colX.rate, y, regular, 10, rgb(1,1,1));
  drawColRight('Remise', colX.discount, y, regular, 10, rgb(1,1,1));
  drawColRight('Montant', colX.amount, y, regular, 10, rgb(1,1,1));

  y -= 30;

  // Table Lines
  for (const line of value.lines) {
    ensure(30);
    page.drawText(`${line.position + 1}`, { x: colX.num, y, size: 9, font: regular, color: textDark });
    
    const descLines = wrap(line.designationSnapshot, regular, 9, 180);
    let descY = y;
    for (const d of descLines) {
      page.drawText(d, { x: colX.desc, y: descY, size: 9, font: regular, color: textDark });
      descY -= 12;
    }
    
    const qtyStr = formatQuantity(line.quantityScaled, line.quantityScale);
    drawColRight(qtyStr, colX.qty, y, regular, 9, textDark);
    if (line.unitLabelSnapshot) {
      drawColRight(line.unitLabelSnapshot, colX.qty, y - 10, regular, 8, textLight);
    }
    
    drawColRight(formatMinor(line.unitPriceMinor, value.invoice.currency, value.invoice.currencyScale, { noCurrency: true }), colX.rate, y, regular, 9, textDark);
    
    if (line.discountMinor > 0) {
      drawColRight(formatMinor(line.discountMinor, value.invoice.currency, value.invoice.currencyScale, { noCurrency: true }), colX.discount, y, regular, 9, textDark);
    }
    
    drawColRight(formatMinor(line.lineTotalMinor, value.invoice.currency, value.invoice.currencyScale, { noCurrency: true }), colX.amount, y, regular, 9, textDark);

    const rowHeight = Math.max(15, y - descY + 5);
    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 0.5, color: lineGray });
    y -= 15;
  }

  // Totals
  ensure(80);
  const labelRightX = A4[0] - MARGIN - 120;
  const valRightX = A4[0] - MARGIN - 10;

  drawColRight('Sous-total', labelRightX, y, regular, 10, textDark);
  drawColRight(formatMinor(value.invoice.subtotalMinor, value.invoice.currency, value.invoice.currencyScale, { noCurrency: true }), valRightX, y, regular, 10, textDark);
  y -= 20;

  drawColRight('Total', labelRightX, y, bold, 10, textDark);
  drawColRight(`${value.invoice.currency}${formatMinor(value.invoice.grandTotalMinor, value.invoice.currency, value.invoice.currencyScale, { noCurrency: true })}`, valRightX, y, bold, 10, textDark);
  y -= 20;

  page.drawRectangle({ x: A4[0] / 2, y: y - 10, width: A4[0] / 2 - MARGIN, height: 25, color: bgLight });
  drawColRight('Solde dû', labelRightX, y, bold, 10, textDark);
  drawColRight(`${value.invoice.currency}${formatMinor(value.invoice.balanceMinor, value.invoice.currency, value.invoice.currencyScale, { noCurrency: true })}`, valRightX, y, bold, 10, textDark);
  
  y -= 50;

  // Footer
  ensure(150);
  page.drawText('Merci de votre confiance.', { x: MARGIN, y, size: 10, font: regular, color: textLight });
  y -= 10;

  if (signatureImage) {
    const dims = signatureImage.scaleToFit(120, 120);
    page.drawImage(signatureImage, { x: MARGIN, y: y - dims.height, width: dims.width, height: dims.height });
    y -= dims.height + 10;
  } else {
    y -= 50;
  }

  if (value.invoice.companySnapshot.managerName) {
    page.drawText(safeText(value.invoice.companySnapshot.managerName), { x: MARGIN, y, size: 10, font: regular, color: textDark });
    y -= 12;
    page.drawText('Le Gérant', { x: MARGIN, y, size: 10, font: regular, color: textLight });
  }

  if (value.invoice.status === 'ANNULEE') { 
    page.drawText('ANNULÉE', { x: MARGIN, y: y - 30, size: 24, font: bold, color: rgb(0.75, 0.05, 0.05) }); 
    page.drawText(`Motif d'annulation : ${value.invoice.cancellationReason || ''}`, { x: MARGIN, y: y - 45, size: 10, font: bold, color: rgb(0.65, 0.05, 0.05) }); 
  }

  pages.forEach((item, index) => item.drawText(`Page ${index + 1} / ${pages.length}`, { x: A4[0] / 2 - 20, y: 22, size: 8, font: regular, color: textLight }));
  
  return document.save({ useObjectStreams: false });
}

export function downloadPdf(bytes: Uint8Array, filename: string) { const blob = new Blob([Uint8Array.from(bytes)], { type: PDF_MIME_TYPE }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
export async function shareOrDownloadPdf(bytes: Uint8Array, filename: string): Promise<'SHARED' | 'DOWNLOADED'> { const blob = new Blob([Uint8Array.from(bytes)], { type: PDF_MIME_TYPE }); const file = new File([blob], filename, { type: PDF_MIME_TYPE }); if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return 'SHARED'; } downloadPdf(bytes, filename); return 'DOWNLOADED'; }
