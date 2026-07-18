'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ManageClientsUseCase } from '@/modules/clients/application/manage-clients';
import { ClientAggregate } from '@/modules/clients/domain/client';
import { ManagePaymentsUseCase } from '@/modules/payments/application/manage-payments';
import { ReceivableRecord } from '@/modules/payments/domain/payment';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { Search, ArrowUpDown, Plus } from 'lucide-react';

const manage = new ManageClientsUseCase();
const managePayments = new ManagePaymentsUseCase();

const AVATAR_COLORS = [
  'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-indigo-400', 'bg-cyan-400', 'bg-teal-400'
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || '?').toUpperCase();
}

type TabType = 'ACTIF' | 'IMPAYE' | 'TOUTES';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientAggregate[]>([]);
  const [receivables, setReceivables] = useState<ReceivableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ACTIF');
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      manage.list({ showArchived: true }),
      managePayments.receivables()
    ])
    .then(([clientsResult, receivablesResult]) => {
      setClients(clientsResult);
      setReceivables(receivablesResult);
      setError('');
    })
    .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible'))
    .finally(() => setLoading(false));
  }, []);

  const debtByClient = useMemo(() => {
    const map = new Map<string, { amount: number, currency: string, scale: number }>();
    for (const rec of receivables) {
      const existing = map.get(rec.invoice.clientProfileId) || { amount: 0, currency: rec.invoice.currency, scale: rec.invoice.currencyScale };
      existing.amount += Number(rec.invoice.balanceMinor);
      map.set(rec.invoice.clientProfileId, existing);
    }
    return map;
  }, [receivables]);

  const filteredClients = useMemo(() => {
    let list = clients;
    if (activeTab === 'ACTIF') {
      list = list.filter(c => !c.contact.archivedAt);
    } else if (activeTab === 'IMPAYE') {
      list = list.filter(c => (debtByClient.get(c.profile.id)?.amount || 0) > 0);
    }
    
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c => c.contact.displayName.toLowerCase().includes(q));
    }
    
    return list;
  }, [clients, activeTab, query, debtByClient]);

  return (
    <main className="mx-auto max-w-5xl bg-background min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background pt-4 px-4 pb-0 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Clients</h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md hover:bg-muted" aria-label="Trier"><ArrowUpDown className="w-5 h-5" /></button>
            <button className="p-2 rounded-md hover:bg-muted" onClick={() => setShowSearch(!showSearch)} aria-label="Rechercher"><Search className="w-5 h-5" /></button>
          </div>
        </div>

        {showSearch && (
          <div className="mb-4">
            <input 
              autoFocus
              type="text" 
              placeholder="Rechercher un client..." 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              className="w-full h-11 px-4 rounded-md border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div className="flex">
          <button 
            onClick={() => setActiveTab('ACTIF')}
            className={`flex-1 pb-3 text-sm font-medium text-center ${activeTab === 'ACTIF' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Actif
          </button>
          <button 
            onClick={() => setActiveTab('IMPAYE')}
            className={`flex-1 pb-3 text-sm font-medium text-center ${activeTab === 'IMPAYE' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Impayé
          </button>
          <button 
            onClick={() => setActiveTab('TOUTES')}
            className={`flex-1 pb-3 text-sm font-medium text-center ${activeTab === 'TOUTES' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Toutes
          </button>
        </div>
      </header>

      {error ? (
        <p role="alert" className="m-4 rounded-md bg-red-500/10 p-4 text-red-800 dark:text-red-200">{error}</p>
      ) : loading ? (
        <p role="status" className="p-8 text-center text-muted-foreground">Chargement des clients...</p>
      ) : filteredClients.length === 0 ? (
        <p className="p-8 text-center text-muted-foreground">Aucun client trouvé.</p>
      ) : (
        <div className="flex flex-col">
          {filteredClients.map(client => {
            const debt = debtByClient.get(client.profile.id);
            const currency = debt?.currency || 'XOF';
            const debtStr = debt && debt.amount > 0 ? formatMinor(debt.amount, debt.currency, debt.scale, { noCurrency: true }) : '0';
            const debtFormatted = `${currency}${debtStr.replace(/\s/g, '')}`;
            const unusedFormatted = `${currency}0`;
            
            return (
              <Link 
                key={client.profile.id} 
                href={`/clients/${client.profile.id}`}
                className="flex items-start gap-4 p-4 border-b hover:bg-muted/30 transition-colors"
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-lg ${getAvatarColor(client.contact.displayName)}`}>
                  {getInitials(client.contact.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-base truncate">
                    {client.contact.displayName} {client.contact.archivedAt && <span className="text-xs font-normal text-muted-foreground">(Archivé)</span>}
                  </h2>
                  <div className="flex mt-1">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Comptes débiteurs</p>
                      <p className="font-bold text-sm">{debtFormatted}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Crédits inutilisés</p>
                      <p className="font-bold text-sm">{unusedFormatted}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link 
        href="/prospects/nouveau"
        className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-3xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </main>
  );
}
