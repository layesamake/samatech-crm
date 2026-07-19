'use client';

import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PieChart, DollarSign, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ReportsDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rapports & Exports" 
        description="Générez des rapports de gestion détaillés et exportez vos données."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Rapport Commercial
            </CardTitle>
            <CardDescription>
              Synthèse des ventes, prospection, et documents commerciaux.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between group">
              <Link href="/reports/commercial">
                Générer
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Rapport Financier
            </CardTitle>
            <CardDescription>
              Facturation, encaissements, dépenses et flux de trésorerie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between group">
              <Link href="/reports/financial">
                Générer
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Balance Âgée
            </CardTitle>
            <CardDescription>
              État des créances clients avec ventilation par ancienneté.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between group">
              <Link href="/reports/receivables">
                Générer
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Exports CSV
            </CardTitle>
            <CardDescription>
              Exportez les données brutes pour un traitement externe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full justify-between group">
              <Link href="/reports/exports">
                Accéder
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
