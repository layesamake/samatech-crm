import { PDFPage } from 'pdf-lib';
import { FinancialReport } from '../domain/report';
import { formatMinorExact } from '@/modules/statistics/domain/statistics';
import { createReportDocument, drawReportHeader, drawFinancialWarning, A4, MARGIN, BOTTOM } from './report-pdf-utils';

export async function generateFinancialReportPdf(report: FinancialReport): Promise<Uint8Array> {
  const { document, fonts, colors } = await createReportDocument('Rapport Financier', report.context);
  
  let page!: PDFPage; 
  let y = 0; 
  let pageNum = 0;

  const addPage = () => { 
    page = document.addPage(A4); 
    pageNum++;
    y = A4[1] - MARGIN;
    
    // Draw page number
    const pageText = `Page ${pageNum}`;
    const w = fonts.regular.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, { x: A4[0] - MARGIN - w, y: BOTTOM, size: 8, font: fonts.regular, color: colors.textLight });
    drawFinancialWarning(page, fonts, colors);
    
    return y;
  };

  const drawRow = (label: string, value: string, isBold = false) => {
    if (y < BOTTOM + 40) y = addPage() - 40;
    const font = isBold ? fonts.bold : fonts.regular;
    page.drawText(label, { x: MARGIN, y, size: 10, font, color: colors.textDark });
    const valW = font.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: A4[0] - MARGIN - valW, y, size: 10, font, color: colors.textDark });
    y -= 16;
  };

  y = addPage();
  y = drawReportHeader(page, y, 'Rapport Financier', report.context, fonts, colors);

  if (report.groups.length === 0) {
    page.drawText('Aucune donnée financière pour cette période.', { x: MARGIN, y, size: 10, font: fonts.regular, color: colors.textLight });
  } else {
    for (const group of report.groups) {
      if (y < BOTTOM + 100) y = addPage() - 40;
      
      page.drawRectangle({ x: MARGIN, y: y - 10, width: A4[0] - 2 * MARGIN, height: 24, color: colors.bgLight });
      page.drawText(`Synthèse en ${group.currency}`, { x: MARGIN + 10, y: y - 2, size: 12, font: fonts.bold, color: colors.primaryBlue });
      y -= 30;

      const format = (minor: string) => formatMinorExact(minor, group.currency, group.currencyScale);

      drawRow('Facturé', format(group.billedMinor));
      drawRow('Encaissé', format(group.collectedMinor));
      drawRow('Dépenses', format(group.expensesMinor));
      y -= 8;
      drawRow('Flux de trésorerie net (Encaissé - Dépenses)', format(group.netCashFlowMinor), true);
      y -= 16;

      drawRow('Restant à recouvrer (Créances)', format(group.receivableMinor));
      drawRow('  Dont échu (En retard)', format(group.overdueMinor));
      drawRow('  Dont non échu', format(group.notYetDueMinor));
      y -= 16;

      drawRow('Solde total de trésorerie (à fin de période)', format(group.treasuryBalanceMinor), true);
      y -= 30;
    }
  }

  return await document.save();
}
