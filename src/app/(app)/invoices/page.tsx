'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useDeferredValue, useMemo, memo } from 'react';
import { ManageInvoicesUseCase } from '@/modules/invoices/application/manage-invoices';
import { formatMinor, InvoiceAggregate, INVOICE_STATUSES } from '@/modules/invoices/domain/invoice';
import { ListSkeleton } from '@/components/ui/loading-skeletons';
import { SwipeableActionItem } from '@/components/ui/swipeable-action-item';
import { CreditCard, Eye, Search, Plus, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// Redesigned InvoiceCard
const InvoiceCard = memo(({ invoiceAggr, router }: { invoiceAggr: InvoiceAggregate, router: any }) => {
  const { invoice, clientName } = invoiceAggr;
  
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  const isOverdue = Boolean(invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAYEE' && invoice.status !== 'ANNULEE');
  const displayStatus = isOverdue ? 'EN RETARD' : invoice.status;

  return (
    <SwipeableActionItem 
      onSwipeRight={() => router.push(`/payments?invoiceId=${invoice.id}`)}
      leftIcon={CreditCard} leftLabel="Payer" leftBgColor="bg-emerald-600"
      onSwipeLeft={() => router.push(`/invoices/${invoice.id}`)}
      rightIcon={Eye} rightLabel="Détails" rightBgColor="bg-blue-600"
    >
      <div onClick={() => router.push(`/invoices/${invoice.id}`)} className="bg-background text-foreground p-4 cursor-pointer border-b hover:bg-muted/50 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 flex-1">
            <strong className="text-base font-semibold">{clientName || 'Client inconnu'}</strong>
            <span className="text-sm text-muted-foreground">
              {formatDate(invoice.issueDate)} • {invoice.number || 'Brouillon'}
            </span>
            <span className={cn("text-xs font-semibold mt-1 uppercase", isOverdue ? "text-red-500" : "text-muted-foreground")}>
              {displayStatus}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <strong className="text-base font-semibold">
              {formatMinor(invoice.grandTotalMinor, invoice.currency, invoice.currencyScale)}
            </strong>
            <span className="text-sm text-muted-foreground">
              Échéance : {formatMinor(invoice.balanceMinor, invoice.currency, invoice.currencyScale)}
            </span>
          </div>
        </div>
      </div>
    </SwipeableActionItem>
  );
});
InvoiceCard.displayName = 'InvoiceCard';

const manage = new ManageInvoicesUseCase();

export default function InvoicesPage() { 
  const router = useRouter();
  const [items, setItems] = useState<InvoiceAggregate[]>([]); 
  const [query, setQuery] = useState(''); 
  const deferredQuery = useDeferredValue(query); 
  
  type TabType = 'Impayé' | 'Payé' | 'Brouillon' | 'Toutes';
  const [activeTab, setActiveTab] = useState<TabType>('Toutes');
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [from, setFrom] = useState(''); 
  const [to, setTo] = useState(''); 
  
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(''); 
  const [limit, setLimit] = useState(50);
  
  const getStatusFromTab = (tab: TabType) => {
    switch(tab) {
      case 'Payé': return 'PAYEE';
      case 'Brouillon': return 'BROUILLON';
      default: return undefined;
    }
  };

  useEffect(() => { 
    const fetchStatus = getStatusFromTab(activeTab);
    
    void manage.list({ 
      query: deferredQuery, 
      status: fetchStatus as any, 
      from: from || undefined, 
      to: to || undefined 
    }).then((result) => { 
      let filtered = result;
      if (activeTab === 'Impayé') {
        filtered = result.filter(r => r.invoice.balanceMinor > 0 && r.invoice.status !== 'BROUILLON' && r.invoice.status !== 'ANNULEE');
      }
      setItems(filtered); 
      setError(''); 
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Chargement impossible'))
    .finally(() => setLoading(false)); 
  }, [deferredQuery, activeTab, from, to]);
  
  const paginatedItems = useMemo(() => items.slice(0, limit), [items, limit]);

  return (
    <main className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
      <header className="sticky top-0 z-10 bg-background border-b pt-2 md:pt-4">
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold hidden md:block">Factures</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 border rounded-xl hover:bg-muted" aria-label="Trier">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <button 
              className="p-2 border rounded-xl hover:bg-muted" 
              aria-label="Rechercher"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {showSearch && (
          <div className="px-4 pb-3 animate-in slide-in-from-top-2">
            <input 
              autoFocus
              aria-label="Rechercher une facture" 
              className="w-full h-12 rounded-xl border px-4 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
              placeholder="Numéro ou client" 
              value={query} 
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        )}

        <div className="flex overflow-x-auto no-scrollbar border-b px-2">
          {(['Impayé', 'Payé', 'Brouillon', 'Toutes'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 min-w-[80px] py-3 text-sm font-medium text-center relative transition-colors whitespace-nowrap px-4",
                activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
        
        <div className="px-4 py-3 bg-muted/10 flex flex-col">
          <button 
            className="flex items-center text-sm text-muted-foreground w-full text-left"
            onClick={() => setShowFilters(!showFilters)}
          >
            Plus de filtres : <strong className="ml-1 text-foreground flex items-center">Sélectionner des filtres <ChevronDown className={cn("w-4 h-4 ml-1 transition-transform", showFilters && "rotate-180")} /></strong>
          </button>
          
          {showFilters && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 animate-in slide-in-from-top-2 pb-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Du</label>
                <input type="date" className="w-full h-11 rounded-xl border px-3 text-sm bg-background" value={from} onChange={(e) => setFrom(e.target.value)}/>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Au</label>
                <input type="date" className="w-full h-11 rounded-xl border px-3 text-sm bg-background" value={to} onChange={(e) => setTo(e.target.value)}/>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="flex-1">
        {error ? (
          <p role="alert" className="p-4 text-red-800 dark:text-red-200">{error}</p>
        ) : loading ? (
          <div className="mt-4"><ListSkeleton count={4} /></div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">Aucune facture ne correspond aux critères.</p>
        ) : (
          <div className="flex flex-col">
            {paginatedItems.map((invoiceAggr) => (
              <InvoiceCard key={invoiceAggr.invoice.id} invoiceAggr={invoiceAggr} router={router} />
            ))}
          </div>
        )}
        
        {items.length > limit && (
          <div className="p-4 flex justify-center">
            <button className="px-6 py-2.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors" onClick={() => setLimit(l => l + 50)}>
              Charger plus
            </button>
          </div>
        )}
      </section>

      <Link 
        href="/invoices/new" 
        className="fixed bottom-[84px] lg:bottom-8 right-4 w-14 h-14 bg-foreground text-background rounded-[20px] flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </Link>
    </main>
  );
}
