'use client';

import { useState } from 'react';
import CompanySettingsForm from '@/modules/settings/presentation/CompanySettingsForm';
import InvoiceSettingsForm from '@/modules/settings/presentation/InvoiceSettingsForm';
import LocationsManager from '@/modules/locations/presentation/LocationsManager';
import Link from 'next/link';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'COMPANY' | 'INVOICE' | 'LOCATIONS'>('COMPANY');

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">Gérez les préférences de votre entreprise, de facturation et les localités.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/settings/backup" className="rounded-lg border p-4 hover:bg-muted"><span className="font-semibold">Sauvegarde et restauration</span><span className="block text-sm text-muted-foreground">Exporter, vérifier ou restaurer les données locales.</span></Link>
        <Link href="/settings/security" className="rounded-lg border p-4 hover:bg-muted"><span className="font-semibold">Sécurité locale</span><span className="block text-sm text-muted-foreground">Configurer le PIN et le verrouillage.</span></Link>
      </div>

      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('COMPANY')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'COMPANY' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Entreprise
        </button>
        <button
          onClick={() => setActiveTab('INVOICE')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'INVOICE' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Facturation
        </button>
        <button
          onClick={() => setActiveTab('LOCATIONS')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'LOCATIONS' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Localités
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'COMPANY' && <CompanySettingsForm />}
        {activeTab === 'INVOICE' && <InvoiceSettingsForm />}
        {activeTab === 'LOCATIONS' && <LocationsManager />}
      </div>
    </div>
  );
}
