'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductInterestOption, ProductInterestSelector } from '@/components/ProductInterestSelector';
import { UpdateClientUseCase } from '@/modules/clients/application/update-client';
import { ClientAggregate, UpdateClientFormInput, UpdateClientInput, UpdateClientSchema } from '@/modules/clients/domain/client';
import { ManageClientsUseCase } from '@/modules/clients/application/manage-clients';
import { DexieCatalogRepository } from '@/modules/catalog/infrastructure/dexie-catalog-repository';
import { DexieLocationRepository } from '@/modules/locations/infrastructure/dexie-location-repository';

const clients = new ManageClientsUseCase();
const updateClient = new UpdateClientUseCase();

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientAggregate | null>();
  const [locations, setLocations] = useState<Array<{ id: string; name: string; archived: boolean }>>([]);
  const [products, setProducts] = useState<ProductInterestOption[]>([]);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UpdateClientFormInput, unknown, UpdateClientInput>({
    resolver: zodResolver(UpdateClientSchema),
  });

  useEffect(() => {
    void Promise.all([
      clients.get(id),
      new DexieLocationRepository().getAll(),
      new DexieCatalogRepository().getAllProducts(),
    ]).then(([loadedClient, loadedLocations, loadedProducts]) => {
      setClient(loadedClient);
      setLocations(loadedLocations.map((location) => ({ id: location.id, name: location.name, archived: Boolean(location.archivedAt) })));
      setProducts(loadedProducts.map((product) => ({ id: product.id, name: product.name, archived: Boolean(product.archivedAt) || !product.isActive })));
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible'));
  }, [id]);

  useEffect(() => {
    if (!client) return;
    reset({
      displayName: client.contact.displayName,
      firstName: client.contact.firstName ?? '',
      lastName: client.contact.lastName ?? '',
      companyName: client.contact.companyName ?? '',
      jobTitle: client.contact.jobTitle ?? '',
      whatsappPhone: client.contact.whatsappPhone,
      secondaryPhone: client.contact.secondaryPhone ?? '',
      email: client.contact.email ?? '',
      locationId: client.contact.locationId ?? '',
      address: client.contact.address ?? '',
      productIds: client.interests.map((interest) => interest.productId),
    });
  }, [client, reset]);

  const submit = async (data: UpdateClientInput, forceDuplicate = false) => {
    setError('');
    setWarning('');
    const result = await updateClient.execute(id, data, forceDuplicate);
    if (result.error) return setError(result.error);
    if (result.warning) {
      setWarning(result.warning);
      return;
    }
    router.push(`/clients/${id}`);
  };

  if (client === undefined && !error) return <p className="p-4">Chargement…</p>;
  if (client === null) return <p className="p-4">Client introuvable.</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-4 pb-24 md:p-8">
      <header className="flex items-center gap-3">
        <Link href={`/clients/${id}`} aria-label="Retour à la fiche client" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div><h1 className="text-2xl font-bold">Modifier le client</h1><p className="text-sm text-muted-foreground">Les factures et l’historique existants sont conservés.</p></div>
      </header>

      <form onSubmit={handleSubmit((data) => submit(data))} className="space-y-5 rounded-xl border bg-card p-5 text-card-foreground">
        {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">{error}</p>}
        {warning && <div role="alert" className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"><p>{warning}</p><Button type="button" variant="outline" onClick={handleSubmit((data) => submit(data, true))}>Confirmer quand même</Button></div>}

        <div className="space-y-1"><Label htmlFor="displayName">Nom d’affichage *</Label><Input id="displayName" {...register('displayName')} />{errors.displayName && <p className="text-xs text-red-600">{errors.displayName.message}</p>}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1"><Label htmlFor="firstName">Prénom</Label><Input id="firstName" {...register('firstName')} /></div>
          <div className="space-y-1"><Label htmlFor="lastName">Nom</Label><Input id="lastName" {...register('lastName')} /></div>
          <div className="space-y-1"><Label htmlFor="companyName">Entreprise</Label><Input id="companyName" {...register('companyName')} /></div>
          <div className="space-y-1"><Label htmlFor="jobTitle">Fonction</Label><Input id="jobTitle" {...register('jobTitle')} /></div>
          <div className="space-y-1"><Label htmlFor="whatsappPhone">Numéro WhatsApp *</Label><Input id="whatsappPhone" type="tel" {...register('whatsappPhone')} />{errors.whatsappPhone && <p className="text-xs text-red-600">{errors.whatsappPhone.message}</p>}</div>
          <div className="space-y-1"><Label htmlFor="secondaryPhone">Téléphone secondaire</Label><Input id="secondaryPhone" type="tel" {...register('secondaryPhone')} /></div>
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register('email')} />{errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}</div>
        </div>
        <div className="space-y-1"><Label htmlFor="locationId">Localité</Label><select id="locationId" className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...register('locationId')}><option value="">Non renseignée</option>{locations.filter((location) => !location.archived || location.id === client?.contact.locationId).map((location) => <option key={location.id} value={location.id}>{location.name}{location.archived ? ' (Archivée)' : ''}</option>)}</select></div>
        <div className="space-y-1"><Label htmlFor="address">Adresse</Label><Input id="address" {...register('address')} /></div>
        <Controller name="productIds" control={control} defaultValue={[]} render={({ field }) => <ProductInterestSelector products={products.filter((product) => !product.archived || (field.value ?? []).includes(product.id))} selectedIds={field.value ?? []} onChange={field.onChange} />} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Link href={`/clients/${id}`} className="inline-flex h-11 items-center justify-center rounded-md border px-4">Annuler</Link><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enregistrement…' : 'Enregistrer les modifications'}</Button></div>
      </form>
    </main>
  );
}
