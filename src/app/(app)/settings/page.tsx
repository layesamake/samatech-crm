'use client';

import { useState } from 'react';
import CompanySettingsForm from '@/modules/settings/presentation/CompanySettingsForm';
import InvoiceSettingsForm from '@/modules/settings/presentation/InvoiceSettingsForm';
import LocationsManager from '@/modules/locations/presentation/LocationsManager';
import AppearanceSettingsForm from '@/modules/settings/presentation/AppearanceSettingsForm';
import Link from 'next/link';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'COMPANY' | 'INVOICE' | 'LOCATIONS' | 'APPEARANCE'>('COMPANY');

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight hidden md:block">Paramètres</h1>
        </div>
        {(activeTab === 'COMPANY' || activeTab === 'INVOICE') && (
          <button 
            type="submit" 
            form={`${activeTab}-form`}
            aria-label="Enregistrer les modifications"
            className="p-2 border rounded-xl hover:bg-muted text-blue-600 bg-blue-500/10 transition-colors"
          >
            <Save className="w-5 h-5" />
          </button>
        )}
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
        <button
          onClick={() => setActiveTab('APPEARANCE')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'APPEARANCE' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Apparence
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'COMPANY' && <CompanySettingsForm />}
        {activeTab === 'INVOICE' && <InvoiceSettingsForm />}
        {activeTab === 'LOCATIONS' && <LocationsManager />}
        {activeTab === 'APPEARANCE' && <AppearanceSettingsForm />}
      </div>
    </div>
  );
}
