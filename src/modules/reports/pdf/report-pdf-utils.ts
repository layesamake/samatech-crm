import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { ReportContext } from '../domain/report';

export const A4: [number, number] = [595.28, 841.89];
export const MARGIN = 44;
export const BOTTOM = 48;
export const PDF_MIME_TYPE = 'application/pdf';

export function safeText(value: unknown): string { 
  return String(value ?? '').replace(/[\u00A0\u202F]/g, ' ').replace(/[‐‑‒–—―]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\xA0-\xFF\u0152\u0153\u20AC\n]/g, '?'); 
}

export function safePdfFilename(prefix: string, dateStr: string) { 
  return `${prefix}-${dateStr.slice(0,10)}.pdf`; 
}

export function wrap(text: string, font: PDFFont, size: number, width: number): string[] { 
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
          if (font.widthOfTextAtSize(next, size) > width && chunk) { 
            result.push(chunk); chunk = char; 
          } else chunk = next; 
        } 
        line = chunk; 
      } 
    } 
    if (line) result.push(line); 
  } 
  return result; 
}

export async function createReportDocument(title: string, context: ReportContext) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(safeText(title));
  document.setSubject(safeText(`Rapport ${context.reportType} - SAMTECH CRM`));
  document.setCreator('SAMTECH CRM');
  document.setCreationDate(new Date());

  const primaryBlue = rgb(43 / 255, 127 / 255, 185 / 255);
  const textDark = rgb(0.2, 0.2, 0.2);
  const textLight = rgb(0.4, 0.4, 0.4);
  const bgLight = rgb(244 / 255, 248 / 255, 251 / 255);
  const lineGray = rgb(0.9, 0.9, 0.9);

  return { document, fonts: { regular, bold }, colors: { primaryBlue, textDark, textLight, bgLight, lineGray } };
}

export function drawReportHeader(page: PDFPage, y: number, title: string, context: ReportContext, fonts: { regular: PDFFont, bold: PDFFont }, colors: Record<string, import('pdf-lib').RGB>) {
  const { bold, regular } = fonts;
  let currentY = y;
  
  page.drawText(safeText(title).toUpperCase(), { x: MARGIN, y: currentY, size: 16, font: bold, color: colors.textDark });
  
  currentY -= 20;
  page.drawText(`Période : ${context.period.label}`, { x: MARGIN, y: currentY, size: 10, font: regular, color: colors.textLight });
  
  const genDateText = `Généré le ${new Date(context.generatedAt).toLocaleDateString('fr-FR', { timeZone: context.period.timezone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  const genDateWidth = regular.widthOfTextAtSize(genDateText, 10);
  page.drawText(genDateText, { x: A4[0] - MARGIN - genDateWidth, y: currentY, size: 10, font: regular, color: colors.textLight });
  
  return currentY - 30;
}

export function drawFinancialWarning(page: PDFPage, fonts: { regular: PDFFont }, colors: Record<string, import('pdf-lib').RGB>) {
  const warning = 'Rapport interne de gestion — ne remplace pas des états comptables ou fiscaux certifiés.';
  const w = fonts.regular.widthOfTextAtSize(warning, 8);
  page.drawText(warning, { x: (A4[0] - w) / 2, y: BOTTOM - 15, size: 8, font: fonts.regular, color: colors.textLight });
}
