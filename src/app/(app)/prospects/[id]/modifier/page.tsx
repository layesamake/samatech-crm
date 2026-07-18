"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";

import { DexieLocationRepository } from "@/modules/locations/infrastructure/dexie-location-repository";
import { DexieCatalogRepository } from "@/modules/catalog/infrastructure/dexie-catalog-repository";
import { UpdateProspectSchema, UpdateProspectInput, UpdateProspectFormInput, PROSPECT_STATUSES, INTEREST_LEVELS } from "@/modules/prospects/domain/prospect";
import { DexieProspectRepository } from "@/modules/prospects/infrastructure/dexie-prospect-repository";
import { UpdateProspectUseCase } from "@/modules/prospects/application/update-prospect";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductInterestSelector, ProductInterestOption } from "@/components/ProductInterestSelector";

const repository = new DexieProspectRepository();
const updateUseCase = new UpdateProspectUseCase(repository);

export default function ModifierProspectPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [forceDuplicate, setForceDuplicate] = useState(false);
  const [locations, setLocations] = useState<{id: string, name: string, archived: boolean}[]>([]);
  const [products, setProducts] = useState<ProductInterestOption[]>([]);

  useEffect(() => {
    const locRepo = new DexieLocationRepository();
    const catRepo = new DexieCatalogRepository();
    Promise.all([locRepo.getAll(), catRepo.getAllProducts()]).then(([locs, prods]) => {
      setLocations(locs.map(l => ({ id: l.id, name: l.name, archived: Boolean(l.archivedAt) })));
      setProducts(prods.map(p => ({ id: p.id, name: p.name, archived: Boolean(p.archivedAt) || !p.isActive })));
    }).catch(console.error);
  }, []);

  // Charger le prospect
  const prospect = useLiveQuery(() => repository.getById(id), [id]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProspectFormInput, unknown, UpdateProspectInput>({
    resolver: zodResolver(UpdateProspectSchema),
  });

  useEffect(() => {
    if (prospect) {
      reset({
        displayName: prospect.contact.displayName,
        whatsappPhone: prospect.contact.whatsappPhone,
        companyName: prospect.contact.companyName || "",
        status: prospect.profile.status,
        interestLevel: prospect.profile.interestLevel,
        source: prospect.contact.source || undefined,
        lostReason: prospect.profile.lostReason || "",
        locationId: prospect.contact.locationId || "",
        productIds: prospect.interests ? prospect.interests.map(i => i.productId) : [],
      });
    }
  }, [prospect, reset]);

  const onSubmit = async (data: UpdateProspectInput) => {
    setError(null);
    const result = await updateUseCase.execute(id, data, forceDuplicate);

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
    router.push(`/prospects/${id}`);
  };

  if (prospect === undefined) {
    return <div className="p-4">Chargement...</div>;
  }

  if (prospect === null) {
    return <div className="p-4">Prospect introuvable.</div>;
  }

  return (
    <div className="flex flex-col bg-muted/50 min-h-screen">
      <header className="sticky top-0 z-10 bg-card text-card-foreground border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/prospects/${id}`} aria-label="Retour à la fiche prospect" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground active:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground line-clamp-1">Modifier {prospect.contact.displayName}</h1>
      </header>

      <main className="flex-1 p-4 pb-12">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-5 bg-card text-card-foreground p-5 rounded-xl shadow-sm border border-border">
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {warning && (
            <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-200">
              <p className="mb-2">{warning}</p>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={handleSubmit(onSubmit)}
              >
                Confirmer quand même
              </Button>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="displayName">Nom d&apos;affichage *</Label>
            <Input id="displayName" placeholder="Ex: Jean Dupont" {...register("displayName")} />
            {errors.displayName && <p className="text-xs text-red-500">{errors.displayName.message as string}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="whatsappPhone">Numéro WhatsApp *</Label>
            <Input id="whatsappPhone" type="tel" placeholder="Ex: +221 77 123 45 67" {...register("whatsappPhone")} />
            {errors.whatsappPhone && <p className="text-xs text-red-500">{errors.whatsappPhone.message as string}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="companyName">Entreprise</Label>
            <Input id="companyName" placeholder="Ex: Samatech..." {...register("companyName")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="status">Statut</Label>
              <select id="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register("status")}>
                {PROSPECT_STATUSES.filter((status) => status !== 'CONVERTI' || prospect.profile.status === 'CONVERTI').map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="interestLevel">Intérêt</Label>
              <select id="interestLevel" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register("interestLevel")}>
                {INTEREST_LEVELS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="locationId">Localité</Label>
            <select id="locationId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" {...register("locationId")}>
              <option value="">Sélectionnez...</option>
              {locations.filter((loc) => !loc.archived || loc.id === prospect.contact.locationId).map(loc => <option key={loc.id} value={loc.id}>{loc.name}{loc.archived ? ' (Archivée)' : ''}</option>)}
            </select>
          </div>

          <Controller name="productIds" control={control} defaultValue={[]} render={({ field }) => (
            <ProductInterestSelector products={products.filter((product) => !product.archived || (field.value ?? []).includes(product.id))} selectedIds={field.value ?? []} onChange={field.onChange} />
          )} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Mettre à jour"}
          </Button>

        </form>
      </main>
    </div>
  );
}
