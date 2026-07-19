export type ExportDataset =
  | 'CONTACTS_PROSPECTS'
  | 'CLIENTS'
  | 'CATALOG'
  | 'FOLLOW_UPS'
  | 'INVOICES'
  | 'INVOICE_LINES'
  | 'PAYMENTS'
  | 'EXPENSES'
  | 'TREASURY_ACCOUNTS'
  | 'TREASURY_MOVEMENTS'
  | 'BUDGETS'
  | 'FORECASTS'
  | 'COMMERCIAL_DOCUMENTS'
  | 'COMMERCIAL_DOCUMENT_LINES'
  | 'DELIVERY_NOTES';

export interface ExportCriteria {
  dataset: ExportDataset;
  from?: string;
  to?: string;
  includeArchived: boolean;
  statuses?: string[];
  clientProfileId?: string;
}

export interface ExportPreview {
  criteria: ExportCriteria;
  rowCount: number;
  columns: string[];
  containsPersonalData: boolean;
}

/**
 * Fonction pure pour neutraliser les cellules de tableur,
 * protégeant contre l'injection CSV (formules =, +, -, @, espaces avant).
 */
export function escapeSpreadsheetCell(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (!str) return '';

  // 1. Détecter si ça commence par un caractère d'injection, même après des espaces/contrôles
  // Initiateurs connus: =, +, -, @, \t, \r
  // On inclut aussi les variantes pleine largeur: ＝, ＋, －, ＠
  const injectionRegex = /^[ \t\r\n\v\f\u00A0]*[=+\-@\t\r＝＋－＠]/;

  let neutralized = str;
  if (injectionRegex.test(str)) {
    // 2. Si c'est un caractère d'injection, on préfixe d'une apostrophe (')
    // C'est le standard accepté pour forcer l'interprétation comme texte.
    neutralized = "'" + str;
  }

  // 3. Doubler tous les guillemets existants pour le format CSV
  const escapedQuotes = neutralized.replace(/"/g, '""');

  // 4. Entourer la cellule finale de guillemets doubles
  return `"${escapedQuotes}"`;
}
