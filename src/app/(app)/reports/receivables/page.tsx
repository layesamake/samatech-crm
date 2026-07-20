'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download } from 'lucide-react';
import { GenerateReportUseCase } from '@/modules/reports/application/generate-report';
import { DexieReportRepository } from '@/modules/reports/infrastructure/dexie-report-repository';
import { generateReceivablesReportPdf } from '@/modules/reports/pdf/receivables-report-pdf';

const useCase = new GenerateReportUseCase(new DexieReportRepository());

export default function ReceivablesReportPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const [asOfDate, setAsOfDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const report = await useCase.generateReceivablesReport(asOfDate);
      const pdfBytes = await generateReceivablesReportPdf(report);
      
      const blob = new Blob([Uint8Array.from(pdfBytes).buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balance-agee-${asOfDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader 
        title="Balance Âgée des Créances" 
        description="Générer l'état des créances clients avec ventilation par ancienneté."
      />

      <Card>
        <CardHeader>
          <CardTitle>Date de référence</CardTitle>
          <CardDescription>Sélectionnez la date à laquelle arrêter les calculs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="asOfDate">À la date du</Label>
            <Input 
              id="asOfDate" 
              type="date" 
              value={asOfDate} 
              onChange={(e) => setAsOfDate(e.target.value)} 
              required 
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={loading || !asOfDate} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Télécharger le PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
