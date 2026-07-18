"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, MessageCircle, Phone, Calendar, Archive } from "lucide-react";

import { DexieProspectRepository } from "@/modules/prospects/infrastructure/dexie-prospect-repository";
import { DexieLocationRepository } from "@/modules/locations/infrastructure/dexie-location-repository";
import { DexieCatalogRepository } from "@/modules/catalog/infrastructure/dexie-catalog-repository";
import { Button } from "@/components/ui/button";
import { ArchiveProspectUseCase } from "@/modules/prospects/application/archive-prospect";
import { ManageFollowUpsUseCase } from "@/modules/follow-ups/application/manage-follow-ups";
import { ManageClientsUseCase } from "@/modules/clients/application/manage-clients";
import ConvertProspectPanel from "@/modules/clients/presentation/ConvertProspectPanel";

const repository = new DexieProspectRepository();
const locRepo = new DexieLocationRepository();
const catRepo = new DexieCatalogRepository();
const archiveUseCase = new ArchiveProspectUseCase(repository);
const followUpsUseCase = new ManageFollowUpsUseCase();
const clientsUseCase = new ManageClientsUseCase();

export default function ProspectDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const prospect = useLiveQuery(() => repository.getById(id), [id]);
  const nextFollowUp = useLiveQuery(() => followUpsUseCase.nextForContact(id), [id]);
  const convertedClient = useLiveQuery(() => clientsUseCase.getByContactId(id), [id]);

  const [locationName, setLocationName] = useState<string>('');
  const [locationArchived, setLocationArchived] = useState(false);
  const [interestNames, setInterestNames] = useState<Array<{ name: string; inactive: boolean }>>([]);

  useEffect(() => {
    if (prospect) {
      if (prospect.contact.locationId) {
        locRepo.getById(prospect.contact.locationId).then(loc => {
          if (loc) { setLocationName(loc.name); setLocationArchived(Boolean(loc.archivedAt)); }
        });
      }
      if (prospect.interests && prospect.interests.length > 0) {
        catRepo.getAllProducts().then(prods => {
          const names = prospect.interests!.map(i => {
            const p = prods.find(pr => pr.id === i.productId);
            return p ? { name: p.name, inactive: Boolean(p.archivedAt) || !p.isActive } : null;
          }).filter(Boolean);
          setInterestNames(names as Array<{ name: string; inactive: boolean }>);
        });
      }
    }
  }, [prospect]);

  if (prospect === undefined) {
    return <div className="p-4">Chargement...</div>;
  }

  if (prospect === null) {
    return <div className="p-4">Prospect introuvable.</div>;
  }

  const { contact, profile } = prospect;

  const handleArchive = async () => {
    if (confirm("Voulez-vous vraiment archiver ce prospect ?")) {
      const result = await archiveUseCase.execute(id);
      if (result.success) {
        router.push("/prospects");
      } else {
        alert(result.error);
      }
    }
  };

  const whatsappLink = `https://wa.me/${contact.normalizedWhatsappPhone.replace('+', '')}`;

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      <header className="sticky top-0 z-10 bg-card text-card-foreground border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/prospects" aria-label="Retour aux prospects" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-slate-700 active:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800 line-clamp-1">{contact.displayName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/prospects/${id}/modifier`} aria-label="Modifier ce prospect">
            <Button variant="ghost" size="icon" aria-hidden="true" tabIndex={-1}>
              <Edit className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 space-y-4 max-w-2xl mx-auto w-full">
        {contact.archivedAt && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 flex items-center gap-2">
            <Archive className="h-5 w-5" />
            <span>Ce prospect est archivé.</span>
          </div>
        )}

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
          <span className="font-semibold text-blue-900">Prochaine relance : </span>
          {nextFollowUp ? <Link href={`/follow-ups/${nextFollowUp.id}`} className="text-blue-800 underline">{new Date(nextFollowUp.dueAt).toLocaleString('fr-FR', { timeZone: nextFollowUp.timezone })}</Link> : <span>Aucune relance planifiée</span>}
        </div>

        {!contact.archivedAt && (convertedClient ? <Link href={`/clients/${convertedClient.profile.id}`} className="block h-11 rounded-md bg-emerald-700 px-4 py-3 text-center text-white">Ouvrir la fiche client</Link> : <ConvertProspectPanel contactId={contact.id} displayName={contact.displayName} />)}

        {/* Actions rapides */}
        <div className="flex gap-3">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full bg-[#0B6B2D] hover:bg-[#085725] text-white flex gap-2">
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
          </a>
          <a href={`tel:${contact.whatsappPhone}`} className="flex-1">
            <Button variant="outline" className="w-full flex gap-2">
              <Phone className="h-5 w-5" />
              Appeler
            </Button>
          </a>
          <Link href={`/follow-ups/new?contactId=${contact.id}`} className="flex-1"><Button variant="outline" className="w-full">Relancer</Button></Link>
        </div>

        {/* Informations */}
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-800 mb-4">Informations</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Statut</span>
                <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{profile.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Niveau d&apos;intérêt</span>
                <span className="font-medium text-slate-800">{profile.interestLevel.replace('_', ' ')}</span>
              </div>
              {locationName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Localité</span>
                  <span className="font-medium text-slate-800">{locationName} {locationArchived && <span className="text-amber-700">(Archivée)</span>}</span>
                </div>
              )}
              {interestNames.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Produits / Services</span>
                  <span className="font-medium text-slate-800 text-right">{interestNames.map((item) => `${item.name}${item.inactive ? ' (Inactif)' : ''}`).join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Téléphone</span>
                <span className="font-medium text-slate-800">{contact.whatsappPhone}</span>
              </div>
              {contact.companyName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Entreprise</span>
                  <span className="font-medium text-slate-800">{contact.companyName}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-slate-50">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Historique
            </h2>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Premier contact</span>
                <span>{profile.firstContactDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Dernier changement statut</span>
                <span>{new Date(profile.lastStatusChangedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Créé le</span>
                <span>{new Date(contact.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-xl border bg-card text-card-foreground p-4">
          <h2 className="font-semibold text-slate-800">Chronologie commerciale</h2>
          {!prospect.events?.length ? <p className="mt-2 text-sm text-slate-700">Aucun événement.</p> : <ol className="mt-3 space-y-3">{prospect.events.map((event) => <li key={event.id} className="border-l-2 border-slate-300 pl-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{event.title}</strong><time className="text-xs text-slate-700">{new Date(event.occurredAt).toLocaleString('fr-FR')}</time></div>{event.summary && <p className="text-sm text-slate-700">{event.summary}</p>}<span className="text-xs text-slate-700">{event.type}</span></li>)}</ol>}
        </section>

        {!contact.archivedAt && (
          <div className="pt-4">
            <Button variant="destructive" className="w-full" onClick={handleArchive}>
              Archiver ce prospect
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
