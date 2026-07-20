import { PDFPage, rgb } from 'pdf-lib';
import { ReceivablesReport } from '../domain/report';
import { formatMinorExact } from '@/modules/statistics/domain/statistics';
import { createReportDocument, drawReportHeader, drawFinancialWarning, A4, MARGIN, BOTTOM } from './report-pdf-utils';

export async function generateReceivablesReportPdf(report: ReceivablesReport): Promise<Uint8Array> {
  const { document, fonts, colors } = await createReportDocument('Balance Âgée des Créances', report.context);
  
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
  y = drawReportHeader(page, y, 'Balance Âgée des Créances', report.context, fonts, colors);

  if (report.groups.length === 0) {
    page.drawText('Aucune créance enregistrée à cette date.', { x: MARGIN, y, size: 10, font: fonts.regular, color: colors.textLight });
  } else {
    for (const group of report.groups) {
      if (y < BOTTOM + 120) y = addPage() - 40;
      
      page.drawRectangle({ x: MARGIN, y: y - 10, width: A4[0] - 2 * MARGIN, height: 24, color: colors.bgLight });
      page.drawText(`Devise : ${group.currency}`, { x: MARGIN + 10, y: y - 2, size: 12, font: fonts.bold, color: colors.primaryBlue });
      y -= 30;

      const format = (minor: string) => formatMinorExact(minor, group.currency, group.currencyScale);

      drawRow('Créances Totales', format(group.totalReceivablesMinor), true);
      y -= 10;
      drawRow('  Non échues', format(group.notDueMinor));
      drawRow('  0 - 30 jours', format(group.tranche0_30Minor));
      drawRow('  31 - 60 jours', format(group.tranche31_60Minor));
      drawRow('  61 - 90 jours', format(group.tranche61_90Minor));
      drawRow('  > 90 jours', format(group.trancheOver90Minor));
      y -= 20;

      // Détails
      page.drawText('Détail des factures non soldées', { x: MARGIN, y, size: 10, font: fonts.bold, color: colors.textDark });
      y -= 20;

      for (const item of group.items) {
        if (y < BOTTOM + 30) y = addPage() - 40;
        const lineText = `${item.clientName} - Facture ${item.invoiceNumber} (Dû: ${item.dueDate || '-'})`;
        page.drawText(lineText, { x: MARGIN, y, size: 9, font: fonts.regular, color: colors.textDark });
        
        const balanceText = `${format(item.balanceMinor)} (${item.daysOverdue}j retard)`;
        const w = fonts.regular.widthOfTextAtSize(balanceText, 9);
        page.drawText(balanceText, { x: A4[0] - MARGIN - w, y, size: 9, font: fonts.regular, color: item.daysOverdue > 0 ? rgb(0.8, 0.2, 0.2) : colors.textDark });
        y -= 14;
      }
      
      y -= 20;
    }
  }

  return await document.save();
}
