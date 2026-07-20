import { PDFPage } from 'pdf-lib';
import { ClientStatement } from '../domain/report';
import { formatMinorExact } from '@/modules/statistics/domain/statistics';
import { createReportDocument, drawReportHeader, drawFinancialWarning, A4, MARGIN, BOTTOM } from './report-pdf-utils';

export async function generateClientStatementPdf(report: ClientStatement): Promise<Uint8Array> {
  const { document, fonts, colors } = await createReportDocument('Relevé Client', report.context);
  
  let page!: PDFPage; let y = 0; let pageNum = 0;

  const addPage = () => { 
    page = document.addPage(A4); 
    pageNum++;
    y = A4[1] - MARGIN;
    const pageText = `Page ${pageNum}`;
    const w = fonts.regular.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, { x: A4[0] - MARGIN - w, y: BOTTOM, size: 8, font: fonts.regular, color: colors.textLight });
    drawFinancialWarning(page, fonts, colors);
    return y;
  };

  const drawRow = (label: string, value: string, isBold = false) => {
    if (y < BOTTOM + 20) y = addPage() - 40;
    const font = isBold ? fonts.bold : fonts.regular;
    page.drawText(label, { x: MARGIN, y, size: 10, font, color: colors.textDark });
    const valW = font.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: A4[0] - MARGIN - valW, y, size: 10, font, color: colors.textDark });
    y -= 16;
  };

  y = addPage();
  y = drawReportHeader(page, y, `Relevé Client : ${report.clientName}`, report.context, fonts, colors);

  if (report.groups.length === 0) {
    page.drawText('Aucun mouvement pour ce client.', { x: MARGIN, y, size: 10, font: fonts.regular, color: colors.textLight });
  } else {
    for (const group of report.groups) {
      if (y < BOTTOM + 120) y = addPage() - 40;
      
      page.drawRectangle({ x: MARGIN, y: y - 10, width: A4[0] - 2 * MARGIN, height: 24, color: colors.bgLight });
      page.drawText(`Devise : ${group.currency}`, { x: MARGIN + 10, y: y - 2, size: 12, font: fonts.bold, color: colors.primaryBlue });
      y -= 30;

      const format = (minor: string) => formatMinorExact(minor, group.currency, group.currencyScale);

      drawRow('Solde d\'ouverture (avant la période)', format(group.openingBalanceMinor), true);
      y -= 10;

      page.drawText('Date', { x: MARGIN, y, size: 9, font: fonts.bold, color: colors.textLight });
      page.drawText('Description', { x: MARGIN + 70, y, size: 9, font: fonts.bold, color: colors.textLight });
      page.drawText('Débit (Facturé)', { x: MARGIN + 230, y, size: 9, font: fonts.bold, color: colors.textLight });
      page.drawText('Crédit (Payé)', { x: MARGIN + 330, y, size: 9, font: fonts.bold, color: colors.textLight });
      page.drawText('Solde', { x: MARGIN + 430, y, size: 9, font: fonts.bold, color: colors.textLight });
      y -= 14;

      for (const m of group.movements) {
        if (y < BOTTOM + 30) {
          y = addPage() - 40;
          // repeat headers
          page.drawText('Date', { x: MARGIN, y, size: 9, font: fonts.bold, color: colors.textLight });
          page.drawText('Description', { x: MARGIN + 70, y, size: 9, font: fonts.bold, color: colors.textLight });
          page.drawText('Débit (Facturé)', { x: MARGIN + 230, y, size: 9, font: fonts.bold, color: colors.textLight });
          page.drawText('Crédit (Payé)', { x: MARGIN + 330, y, size: 9, font: fonts.bold, color: colors.textLight });
          page.drawText('Solde', { x: MARGIN + 430, y, size: 9, font: fonts.bold, color: colors.textLight });
          y -= 14;
        }
        
        page.drawText(m.date, { x: MARGIN, y, size: 8, font: fonts.regular, color: colors.textDark });
        page.drawText(`${m.description} ${m.reference}`, { x: MARGIN + 70, y, size: 8, font: fonts.regular, color: colors.textDark });
        
        if (m.debitMinor !== '0') {
          page.drawText(format(m.debitMinor), { x: MARGIN + 230, y, size: 8, font: fonts.regular, color: colors.textDark });
        }
        if (m.creditMinor !== '0') {
          page.drawText(format(m.creditMinor), { x: MARGIN + 330, y, size: 8, font: fonts.regular, color: colors.textDark });
        }
        
        page.drawText(format(m.balanceMinor), { x: MARGIN + 430, y, size: 8, font: fonts.bold, color: colors.textDark });
        y -= 12;
      }
      
      y -= 10;
      drawRow('Solde de clôture (fin de période)', format(group.closingBalanceMinor), true);
      y -= 30;
    }
  }

  return await document.save();
}
