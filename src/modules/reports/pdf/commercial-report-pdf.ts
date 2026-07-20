import { PDFPage } from 'pdf-lib';
import { CommercialReport } from '../domain/report';
import { formatMinorExact } from '@/modules/statistics/domain/statistics';
import { createReportDocument, drawReportHeader, A4, MARGIN, BOTTOM } from './report-pdf-utils';

export async function generateCommercialReportPdf(report: CommercialReport): Promise<Uint8Array> {
  const { document, fonts, colors } = await createReportDocument('Rapport Commercial', report.context);
  
  let page!: PDFPage; let y = 0; let pageNum = 0;

  const addPage = () => { 
    page = document.addPage(A4); 
    pageNum++;
    y = A4[1] - MARGIN;
    const pageText = `Page ${pageNum}`;
    const w = fonts.regular.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, { x: A4[0] - MARGIN - w, y: BOTTOM, size: 8, font: fonts.regular, color: colors.textLight });
    return y;
  };

  const drawSection = (title: string) => {
    if (y < BOTTOM + 60) y = addPage() - 40;
    page.drawRectangle({ x: MARGIN, y: y - 10, width: A4[0] - 2 * MARGIN, height: 24, color: colors.bgLight });
    page.drawText(title, { x: MARGIN + 10, y: y - 2, size: 12, font: fonts.bold, color: colors.primaryBlue });
    y -= 30;
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
  y = drawReportHeader(page, y, 'Rapport Commercial', report.context, fonts, colors);

  drawSection('Acquisition (Prospects & Clients)');
  drawRow('Prospects actifs', String(report.activeProspects));
  drawRow('Nouveaux prospects', String(report.newProspects));
  drawRow('Conversions', String(report.conversions));
  drawRow('Taux de conversion', `${report.conversionRatePercentage.toFixed(1)}%`);
  if (report.averageConversionDays !== null) {
    drawRow('Délai moyen de conversion', `${report.averageConversionDays} jours`);
  }
  y -= 10;

  drawSection('Suivis');
  drawRow('Suivis en attente', String(report.pendingFollowUps));
  drawRow('Suivis en retard', String(report.overdueFollowUps));
  drawRow('Suivis complétés', String(report.completedFollowUps));
  y -= 10;

  drawSection('Documents Commerciaux');
  drawRow('Devis émis', String(report.quotesIssued));
  drawRow('Devis acceptés/convertis', String(report.quotesAccepted + report.quotesConverted));
  drawRow('Factures pro forma émises', String(report.proformasIssued));
  drawRow('Bons de livraison émis', String(report.deliveryNotesIssued));
  y -= 10;

  if (report.invoicedByCurrency.length > 0) {
    drawSection('Facturation');
    for (const c of report.invoicedByCurrency) {
      drawRow(`Facturé (${c.currency})`, formatMinorExact(c.minor, c.currency, c.currencyScale), true);
    }
  }

  return await document.save();
}
