/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CompanyProfile, CompanyProfileSchema } from '../domain/settings';
import { GetSettingsUseCase } from '../application/get-settings';
import { UpdateSettingsUseCase } from '../application/update-settings';
import { DexieSettingsRepository } from '../infrastructure/dexie-settings-repository';

const repository = new DexieSettingsRepository();
const getSettingsUseCase = new GetSettingsUseCase(repository);
const updateSettingsUseCase = new UpdateSettingsUseCase(repository);

export default function CompanySettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CompanyProfile>({
    resolver: zodResolver(CompanyProfileSchema),
  });

  const loadSettings = async () => {
    try {
      const data = await getSettingsUseCase.getCompanyProfile();
      if (data) {
        reset(data);
      } else {
        reset({
          name: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          country: '',
          currencyCode: 'XOF',
          currencySymbol: 'FCFA',
          invoiceDefaults: '',
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

  const onSubmit = async (data: CompanyProfile) => {
    setSaving(true);
    setMessage('');
    try {
      await updateSettingsUseCase.updateCompanyProfile(data);
      setMessage('Paramètres enregistrés avec succès !');
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
            <label htmlFor="company-name" className="text-sm font-medium">Nom de l&apos;entreprise *</label>
            <input 
              id="company-name"
              {...register('name')} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="company-phone" className="text-sm font-medium">Téléphone *</label>
            <input 
              id="company-phone"
              {...register('phone')} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="company-email" className="text-sm font-medium">Email</label>
            <input 
              id="company-email"
              type="email"
              {...register('email')} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="company-address" className="text-sm font-medium">Adresse</label>
            <input 
              id="company-address"
              {...register('address')} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="company-city" className="text-sm font-medium">Ville</label>
            <input 
              id="company-city"
              {...register('city')} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="company-country" className="text-sm font-medium">Pays</label>
            <input 
              id="company-country"
              {...register('country')} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="company-currency" className="text-sm font-medium">Devise (Code) *</label>
            <input 
              id="company-currency"
              {...register('currencyCode')} 
              placeholder="ex: XOF, EUR, USD"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {errors.currencyCode && <p className="text-xs text-red-500">{errors.currencyCode.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="company-symbol" className="text-sm font-medium">Symbole de la devise *</label>
            <input 
              id="company-symbol"
              {...register('currencySymbol')} 
              placeholder="ex: FCFA, €, $"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
            {errors.currencySymbol && <p className="text-xs text-red-500">{errors.currencySymbol.message}</p>}
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
