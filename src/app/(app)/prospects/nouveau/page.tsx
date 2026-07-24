"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CreateProspectSchema, CreateProspectInput, CreateProspectFormInput, CONTACT_SOURCES, CONTACT_SOURCE_LABELS, PROSPECT_STATUSES, PROSPECT_STATUS_LABELS, INTEREST_LEVELS, INTEREST_LEVEL_LABELS } from "@/modules/prospects/domain/prospect";
import { DexieProspectRepository } from "@/modules/prospects/infrastructure/dexie-prospect-repository";
import { CreateProspectUseCase } from "@/modules/prospects/application/create-prospect";
import { DexieLocationRepository } from "@/modules/locations/infrastructure/dexie-location-repository";
import { DexieCatalogRepository } from "@/modules/catalog/infrastructure/dexie-catalog-repository";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductInterestSelector } from "@/components/ProductInterestSelector";

const repository = new DexieProspectRepository();
const createUseCase = new CreateProspectUseCase(repository);

export default function NouveauProspectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [forceDuplicate, setForceDuplicate] = useState(false);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  
  const [locationMode, setLocationMode] = useState<'SELECT' | 'NEW'>('SELECT');
  const [newLocationName, setNewLocationName] = useState('');

  useEffect(() => {
    const locRepo = new DexieLocationRepository();
    const catRepo = new DexieCatalogRepository();
    Promise.all([locRepo.getAllActive(), catRepo.getAllProductsActive()]).then(([locs, prods]) => {
      setLocations(locs.map(l => ({ id: l.id, name: l.name })));
      setProducts(prods.map(p => ({ id: p.id, name: p.name })));
    }).catch(console.error);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateProspectFormInput, unknown, CreateProspectInput>({
    resolver: zodResolver(CreateProspectSchema),
    defaultValues: {
      status: "NOUVEAU",
      interestLevel: "NON_QUALIFIE",
    },
  });

  const [firstName = "", lastName = ""] = useWatch({ control, name: ["firstName", "lastName"] });
  const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

  useEffect(() => {
    setValue("displayName", displayName);
  }, [displayName, setValue]);

  const handleCreateProduct = async (name: string) => {
    const catRepo = new DexieCatalogRepository();
    const { ManageCatalogUseCase } = await import("@/modules/catalog/application/manage-catalog");
    const manageCat = new ManageCatalogUseCase(catRepo);
    try {
      const newProduct = await manageCat.createProduct({
        name,
        type: 'SERVICE',
        currency: 'XOF',
        currencyScale: 0,
        unitPriceMinor: 0,
        defaultTaxRateBasisPoints: 0,
      });
      setProducts(prev => [...prev, { id: newProduct.id, name: newProduct.name }]);
      const current = getValues('productIds') || [];
      setValue('productIds', [...current, newProduct.id], { shouldDirty: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur création produit");
    }
  };

  const onSubmit = async (data: CreateProspectInput) => {
    setError(null);
    
    let locationId = data.locationId;
    if (locationMode === 'NEW' && newLocationName.trim()) {
      const locRepo = new DexieLocationRepository();
      const { ManageLocationsUseCase } = await import("@/modules/locations/application/manage-locations");
      const manageLoc = new ManageLocationsUseCase(locRepo);
      try {
        const loc = await manageLoc.createLocation({ name: newLocationName.trim(), level: 'CITY' });
        locationId = loc.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la création de la localité");
        return;
      }
    }

    const payload = { ...data, locationId };
    const result = await createUseCase.execute(payload, forceDuplicate);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.warning && !forceDuplicate) {
      setWarning(result.warning);
      setForceDuplicate(true);
      return;
    }

    // Succès
    if (result.prospect) {
      router.push(`/prospects/${result.prospect.contact.id}`);
    }
  };

  return (
    <div className="flex flex-col bg-muted/50 min-h-screen">
      <header className="sticky top-0 z-10 bg-card text-card-foreground border-b px-4 py-3 flex items-center gap-3 bg-background text-foreground">
        <Link href="/prospects" aria-label="Retour aux prospects" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground active:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Nouveau Prospect</h1>
      </header>

      <main className="flex-1 p-4 pb-28">
        <form id="prospect-form" onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-5 bg-card text-card-foreground p-5 rounded-xl shadow-sm border border-border bg-background text-foreground">
          
          {error && (
            <div className="p-3 bg-red-500/10 text-red-800 dark:text-red-200 text-sm rounded-lg border border-red-500/20 bg-background text-foreground">
              {error}
            </div>
          )}

          {warning && (
            <div className="p-3 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm rounded-lg border border-amber-500/20 bg-background text-foreground">
              <p className="mb-2">{warning}</p>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-100 bg-background text-foreground"
                onClick={handleSubmit(onSubmit)}
              >
                Confirmer quand même
              </Button>
            </div>
          )}

          <section className="space-y-3" aria-labelledby="prospect-identity">
            <div className="flex items-baseline justify-between">
              <h2 id="prospect-identity" className="text-sm font-semibold">Identité</h2>
              <span className="text-xs text-muted-foreground">Champs requis *</span>
            </div>
            <div className="w-28 space-y-1">
              <Label htmlFor="title">Titre</Label>
              <select id="title" className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-background text-foreground" {...register("title")}>
                <option value="">Sélectionnez...</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="Mlle">Mlle</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" className="h-11" placeholder="Ex: Jean" autoComplete="given-name" {...register("firstName")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" className="h-11" placeholder="Ex: Dupont" autoComplete="family-name" {...register("lastName")} />
            </div>
          </div>
          </section>

          <div className="space-y-1">
            <Label htmlFor="displayName">Nom d&apos;affichage *</Label>
            <Input id="displayName" className="h-11 bg-muted/40" placeholder="Renseigné à partir du prénom et du nom" readOnly {...register("displayName")} />
            <p className="text-xs text-muted-foreground">Prénom suivi du nom.</p>
            {errors.displayName && <p className="text-xs text-red-500">{errors.displayName.message as string}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="whatsappPhone">Numéro WhatsApp *</Label>
            <Input id="whatsappPhone" className="h-11" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex: +221 77 123 45 67" {...register("whatsappPhone")} />
            {errors.whatsappPhone && <p className="text-xs text-red-500">{errors.whatsappPhone.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="status">Statut</Label>
              <select id="status" className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-background text-foreground" {...register("status")}>
                {PROSPECT_STATUSES.filter((status) => status !== 'CONVERTI').map(s => <option key={s} value={s}>{PROSPECT_STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="interestLevel">Intérêt</Label>
              <select id="interestLevel" className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-background text-foreground" {...register("interestLevel")}>
                {INTEREST_LEVELS.map(s => <option key={s} value={s}>{INTEREST_LEVEL_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="locationId">Localité</Label>
              <button 
                type="button" 
                onClick={() => setLocationMode(m => m === 'SELECT' ? 'NEW' : 'SELECT')} 
                className="text-xs text-primary hover:underline font-medium"
              >
                {locationMode === 'SELECT' ? '+ Nouvelle localité' : 'Choisir existante'}
              </button>
            </div>
            {locationMode === 'SELECT' ? (
              <select id="locationId" className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-background text-foreground" {...register("locationId")}>
                <option value="">Sélectionnez...</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            ) : (
              <Input 
                placeholder="Nom de la nouvelle localité..." 
                value={newLocationName} 
                onChange={e => setNewLocationName(e.target.value)} 
                className="h-11"
              />
            )}
          </div>

          <Controller name="productIds" control={control} defaultValue={[]} render={({ field }) => (
            <ProductInterestSelector 
              products={products} 
              selectedIds={field.value ?? []} 
              onChange={field.onChange} 
              onCreateProduct={handleCreateProduct}
            />
          )} />

          <details className="rounded-xl border bg-muted/20 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">Plus de détails</summary>
            <p className="mt-1 text-xs text-muted-foreground">Ajoutez ces informations si elles sont déjà disponibles.</p>
            <div className="mt-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" className="h-11" type="email" autoComplete="email" placeholder="Ex: jean.dupont@email.com" {...register("email")} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="companyName">Entreprise</Label>
                <Input id="companyName" className="h-11" placeholder="Ex: Samatech..." autoComplete="organization" {...register("companyName")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Note commerciale</Label>
                <textarea id="notes" rows={4} className="w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground" placeholder="Contexte, besoin ou prochaine étape…" {...register("notes")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="source">Source</Label>
                <select id="source" className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-background text-foreground" {...register("source")}>
                  <option value="">Sélectionnez...</option>
                  {CONTACT_SOURCES.map(s => <option key={s} value={s}>{CONTACT_SOURCE_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
          </details>

        </form>
        <div className="fixed inset-x-0 bottom-16 z-20 border-t bg-background/95 p-3 backdrop-blur lg:static lg:mx-auto lg:mt-4 lg:max-w-md lg:border lg:rounded-xl">
          <Button form="prospect-form" type="submit" className="min-h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Création..." : "Enregistrer le prospect"}
          </Button>
        </div>
      </main>
    </div>
  );
}
