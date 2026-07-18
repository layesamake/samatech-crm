/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<CompanyProfile>({
    resolver: zodResolver(CompanyProfileSchema),
  });

  const logoDataUri = useWatch({ control, name: 'logoDataUri' });
  const signatureDataUri = useWatch({ control, name: 'managerSignatureDataUri' });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoDataUri' | 'managerSignatureDataUri') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setValue(field, base64, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    void loadSettings();
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
        <div className={`p-4 rounded-md ${message.includes('succès') ? 'bg-green-500/10 text-green-800 dark:text-green-200' : 'bg-red-500/10 text-red-800 dark:text-red-200'}`}>
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
          
          {/* Nouveaux champs pour le responsable et signature */}
          <div className="space-y-2">
            <label htmlFor="manager-name" className="text-sm font-medium">Prénom et nom du responsable</label>
            <input 
              id="manager-name"
              {...register('managerName')} 
              placeholder="ex: Jean Dupont"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Logo de l&apos;entreprise</label>
            <div className="flex items-center gap-4">
               {logoDataUri ? (
                 <img src={logoDataUri} alt="Logo" className="w-16 h-16 object-contain border rounded-md" />
               ) : (
                 <div className="w-16 h-16 bg-muted border rounded-md flex items-center justify-center text-xs text-slate-400">Aucun</div>
               )}
               <input 
                 type="file" 
                 accept="image/png, image/jpeg"
                 onChange={(e) => handleFileUpload(e, 'logoDataUri')}
                 className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-800 dark:text-blue-200 hover:file:bg-blue-100"
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Signature du responsable</label>
            <div className="flex items-center gap-4">
               {signatureDataUri ? (
                 <img src={signatureDataUri} alt="Signature" className="w-16 h-16 object-contain border rounded-md" />
               ) : (
                 <div className="w-16 h-16 bg-muted border rounded-md flex items-center justify-center text-xs text-slate-400">Aucune</div>
               )}
               <input 
                 type="file" 
                 accept="image/png, image/jpeg"
                 onChange={(e) => handleFileUpload(e, 'managerSignatureDataUri')}
                 className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-800 dark:text-blue-200 hover:file:bg-blue-100"
               />
            </div>
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
