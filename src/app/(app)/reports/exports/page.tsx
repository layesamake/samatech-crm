'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download } from 'lucide-react';
import { ExportCsvUseCase } from '@/modules/reports/application/export-csv';
import { DexieReportRepository } from '@/modules/reports/infrastructure/dexie-report-repository';
import { ExportDataset } from '@/modules/reports/domain/csv';

const useCase = new ExportCsvUseCase(new DexieReportRepository());

const DATASETS: { value: ExportDataset, label: string }[] = [
  { value: 'CONTACTS_PROSPECTS', label: 'Contacts & Prospects' },
  { value: 'CLIENTS', label: 'Clients' },
  { value: 'CATALOG', label: 'Catalogue Produits' },
  { value: 'FOLLOW_UPS', label: 'Relances' },
  { value: 'INVOICES', label: 'Factures' },
  { value: 'INVOICE_LINES', label: 'Lignes de Factures' },
  { value: 'PAYMENTS', label: 'Paiements' },
  { value: 'EXPENSES', label: 'Dépenses' },
  { value: 'TREASURY_ACCOUNTS', label: 'Comptes de Trésorerie' },
  { value: 'TREASURY_MOVEMENTS', label: 'Mouvements de Trésorerie' },
  { value: 'BUDGETS', label: 'Budgets' },
  { value: 'FORECASTS', label: 'Prévisions' },
  { value: 'COMMERCIAL_DOCUMENTS', label: 'Documents Commerciaux' },
  { value: 'COMMERCIAL_DOCUMENT_LINES', label: 'Lignes de Documents Commerciaux' },
  { value: 'DELIVERY_NOTES', label: 'Bons de Livraison' },
];

export default function ExportsPage() {
  const [dataset, setDataset] = useState<ExportDataset>('CLIENTS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const csvString = await useCase.exportDataset({ dataset, includeArchived: true });
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${dataset.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader 
        title="Exports CSV" 
        description="Exporter les jeux de données brutes. Les formules de type tableur seront neutralisées pour votre sécurité."
      />

      <Card>
        <CardHeader>
          <CardTitle>Jeu de données</CardTitle>
          <CardDescription>Sélectionnez le type de données à exporter.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
          
          <div className="space-y-2">
            <Select value={dataset} onValueChange={(v) => setDataset(v as ExportDataset)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un jeu de données" />
              </SelectTrigger>
              <SelectContent>
                {DATASETS.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted/50 rounded-md text-sm text-muted-foreground mt-4">
            <p><strong>Avertissement :</strong> Ce fichier CSV contient des données personnelles ou sensibles.</p>
            <p className="mt-2 text-xs">Note : Ce CSV ne peut pas être utilisé pour restaurer l'application SAMTECH CRM.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleExport} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Télécharger le CSV
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
