/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InvoiceSettings, InvoiceSettingsSchema } from '../domain/settings';
import { GetSettingsUseCase } from '../application/get-settings';
import { UpdateSettingsUseCase } from '../application/update-settings';
import { DexieSettingsRepository } from '../infrastructure/dexie-settings-repository';

const repository = new DexieSettingsRepository();
const getSettingsUseCase = new GetSettingsUseCase(repository);
const updateSettingsUseCase = new UpdateSettingsUseCase(repository);

export default function InvoiceSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvoiceSettings>({
    resolver: zodResolver(InvoiceSettingsSchema),
  });

  const loadSettings = async () => {
    try {
      const data = await getSettingsUseCase.getInvoiceSettings();
      if (data) {
        reset(data);
      } else {
        reset({
          currencyCode: 'XOF',
          prefix: 'FACT-',
          nextValue: 1,
          enableTaxes: false,
          defaultTaxRate: 0,
        });
      }
    } catch (error) {
      console.error(error);
      setMessage('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, []);

  const onSubmit = async (data: InvoiceSettings) => {
    setSaving(true);
    setMessage('');
    try {
      await updateSettingsUseCase.updateInvoiceSettings(data);
      setMessage('Paramètres de facturation enregistrés avec succès !');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {message && (
        <div className={`p-4 rounded-md ${message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="invoice-currency" className="text-sm font-medium">Devise (Code) *</label>
            <input 
              id="invoice-currency"
              {...register('currencyCode')} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {errors.currencyCode && <p className="text-xs text-red-500">{errors.currencyCode.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="invoice-prefix" className="text-sm font-medium">Préfixe de facture *</label>
            <input 
              id="invoice-prefix"
              {...register('prefix')} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {errors.prefix && <p className="text-xs text-red-500">{errors.prefix.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="invoice-next" className="text-sm font-medium">Prochaine valeur (Numéro) *</label>
            <input 
              id="invoice-next"
              type="number"
              {...register('nextValue', { valueAsNumber: true })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {errors.nextValue && <p className="text-xs text-red-500">{errors.nextValue.message}</p>}
            <p className="text-xs text-muted-foreground">Sera utilisé pour la prochaine facture créée.</p>
          </div>

          <div className="space-y-2 flex flex-col justify-end pb-2">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox"
                {...register('enableTaxes')} 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Activer la gestion des taxes (TVA)</span>
            </label>
          </div>

          <div className="space-y-2">
            <label htmlFor="invoice-tax" className="text-sm font-medium">Taux de taxe par défaut (%)</label>
            <input 
              id="invoice-tax"
              type="number"
              step="0.01"
              {...register('defaultTaxRate', { valueAsNumber: true })} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {errors.defaultTaxRate && <p className="text-xs text-red-500">{errors.defaultTaxRate.message}</p>}
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
