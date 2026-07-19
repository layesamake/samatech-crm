'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Download } from 'lucide-react';
import { GenerateReportUseCase } from '@/modules/reports/application/generate-report';
import { DexieReportRepository } from '@/modules/reports/infrastructure/dexie-report-repository';
import { generateCommercialReportPdf } from '@/modules/reports/pdf/commercial-report-pdf';

const useCase = new GenerateReportUseCase(new DexieReportRepository());

export default function CommercialReportPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  
  const [from, setFrom] = useState(startOfMonth);
  const [to, setTo] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const period = {
        from,
        to,
        timezone: 'Africa/Dakar' as const,
        label: `Du ${new Date(from).toLocaleDateString('fr-FR')} au ${new Date(to).toLocaleDateString('fr-FR')}`
      };
      
      const report = await useCase.generateCommercialReport(period);
      const pdfBytes = await generateCommercialReportPdf(report);
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-commercial-${to}.pdf`;
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
        title="Rapport Commercial" 
        description="Générer le rapport synthétique des ventes et prospections."
      />

      <Card>
        <CardHeader>
          <CardTitle>Période du rapport</CardTitle>
          <CardDescription>Sélectionnez la plage de dates pour générer le rapport.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">Date de début</Label>
              <Input 
                id="from" 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Date de fin</Label>
              <Input 
                id="to" 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
                required 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={loading || !from || !to} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Télécharger le PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
