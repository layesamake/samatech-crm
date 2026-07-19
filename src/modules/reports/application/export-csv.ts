import { escapeSpreadsheetCell, ExportCriteria } from '../domain/csv';
import { ReportRepository } from '../domain/report';

export class ExportCsvUseCase {
  constructor(private readonly repository: ReportRepository) {}

  async exportDataset(criteria: ExportCriteria): Promise<string> {
    const data = await this.repository.fetchDataset(criteria);
    if (data.length === 0) {
      return this.serializeToCsv([], []);
    }

    // Extraire les colonnes de manière stable
    const allKeys = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    
    // Trier les clés pour avoir des en-têtes stables
    const columns = Array.from(allKeys).sort();

    return this.serializeToCsv(columns, data);
  }

  private serializeToCsv(columns: string[], data: Record<string, unknown>[]): string {
    const BOM = '\uFEFF';
    
    if (columns.length === 0) {
      return BOM + 'Aucune donnée disponible\r\n';
    }

    const headers = columns.map(escapeSpreadsheetCell).join(';') + '\r\n';

    const rows = data.map(row => {
      return columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return escapeSpreadsheetCell('');
        if (typeof val === 'object') {
          // Flatten objects or stringify safely
          if (Array.isArray(val)) {
            return escapeSpreadsheetCell(val.map(v => String(v)).join(', '));
          } else {
            return escapeSpreadsheetCell(JSON.stringify(val)); // or handle specific complex types
          }
        }
        return escapeSpreadsheetCell(String(val));
      }).join(';');
    }).join('\r\n');

    return BOM + headers + (rows ? rows + '\r\n' : '');
  }
}
