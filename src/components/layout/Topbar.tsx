'use client';

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { BusinessSwitcher } from '@/components/providers/BusinessSwitcher'

const routeTitles: Record<string, string> = {
  '/': 'Tableau de bord',
  '/prospects': 'Prospects',
  '/clients': 'Clients',
  '/commercial-documents': 'Ventes',
  '/invoices': 'Factures',
  '/payments': 'Paiements',
  '/expenses': 'Dépenses',
  '/treasury': 'Trésorerie',
  '/campaigns': 'Campagnes',
  '/message-templates': 'Modèles',
  '/statistics': 'Statistiques',
  '/reports': 'Rapports',
  '/follow-ups': 'Relances',
  '/catalog': 'Catalogue',
  '/settings': 'Paramètres',
};

export function Topbar() {
  const pathname = usePathname();
  
  // Find the most specific matching route title
  const currentTitle = Object.entries(routeTitles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname === route || pathname?.startsWith(route + '/'))?.[1] || 'SAMTECH CRM';

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-nav-bg text-nav-fg backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
           {/* Espace pour la recherche ou le titre global si on est sur grand écran */}
           <h1 className="text-lg font-semibold lg:hidden">{currentTitle}</h1>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div id="topbar-actions" className="flex items-center"></div>
          
          <Button variant="ghost" size="icon" className="-m-2.5 p-2.5 text-nav-muted hover:text-nav-fg hover:bg-white/10">
            <span className="sr-only">Voir les notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </Button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          {/* Business Switcher */}
          <BusinessSwitcher />
        </div>
      </div>
    </header>
  )
}
