'use client';

import Link from 'next/link'
import {
  Home,
  Users,
  FileText,
  CreditCard,
  BarChart,
  Megaphone,
  Repeat,
  FolderOpen,
  Settings,
  Receipt,
  MessageSquare,
  X,
  DollarSign,
  PieChart,
  Briefcase,
  ChevronDown
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useBusiness } from '@/components/providers/BusinessProvider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface SidebarProps {
  onClose?: () => void
}

const links = [
  { href: '/', label: 'Tableau de bord', icon: Home },
  { href: '/prospects', label: 'Prospects', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Briefcase },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/commercial-documents', label: 'Ventes', icon: FileText },
  { href: '/invoices', label: 'Factures', icon: FileText },
  { href: '/payments', label: 'Paiements', icon: CreditCard },
  { href: '/expenses', label: 'Dépenses', icon: Receipt },
  { href: '/treasury', label: 'Trésorerie', icon: DollarSign },
  { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
  { href: '/message-templates', label: 'Modèles de messages', icon: MessageSquare },
  { href: '/statistics', label: 'Statistiques', icon: BarChart },
  { href: '/reports', label: 'Rapports', icon: PieChart },
  { href: '/follow-ups', label: 'Relances', icon: Repeat },
  { href: '/catalog', label: 'Catalogue', icon: FolderOpen },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { activeBusiness, businesses, switchBusiness } = useBusiness()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="flex flex-col p-4 border-b">
        <div className="flex items-center justify-between">
           <Popover open={open} onOpenChange={setOpen}>
             <PopoverTrigger className="flex items-center space-x-3 outline-none text-left flex-1 min-w-0">
               <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl shrink-0">
                 {activeBusiness?.logoBase64 ? (
                   <img src={activeBusiness.logoBase64} alt={activeBusiness.name} className="w-full h-full object-cover rounded-full" />
                 ) : (
                   activeBusiness?.name?.substring(0, 2).toUpperCase() || 'AS'
                 )}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="font-semibold text-sm truncate uppercase">{activeBusiness?.name || 'Espace'}</p>
                 <p className="text-xs text-muted-foreground truncate">admin@samatech.com</p>
               </div>
               <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
             </PopoverTrigger>
             <PopoverContent className="w-[280px] p-2" align="start">
               <div className="space-y-2">
                 <p className="text-xs font-medium text-muted-foreground px-2 pt-1 uppercase">Espaces disponibles</p>
                 <div className="space-y-1">
                   {businesses.filter(b => b.status !== 'archived').map(b => (
                     <Button 
                       key={b.id} 
                       variant={b.id === activeBusiness?.id ? 'secondary' : 'ghost'} 
                       className="w-full justify-start font-normal h-10 px-2"
                       onClick={() => {
                         setOpen(false);
                         if (b.id !== activeBusiness?.id) {
                           switchBusiness(b.id);
                           if (onClose) onClose();
                         }
                       }}
                     >
                       <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs flex-shrink-0 mr-3">
                         {b.logoBase64 ? (
                           <img src={b.logoBase64} alt={b.name} className="w-full h-full object-cover rounded-full" />
                         ) : (
                           b.name.substring(0, 2).toUpperCase()
                         )}
                       </div>
                       <span className="truncate">{b.name}</span>
                     </Button>
                   ))}
                 </div>
                 
                 <div className="h-px bg-border my-2" />
                 
                 <Button variant="ghost" className="w-full justify-start text-sm h-9 px-2 text-muted-foreground" onClick={() => { setOpen(false); router.push('/settings'); if (onClose) onClose(); }}>
                   <Settings className="h-4 w-4 mr-2" />
                   Gérer mes espaces
                 </Button>
               </div>
             </PopoverContent>
           </Popover>

           {onClose && (
             <button onClick={onClose} className="p-2 ml-2 shrink-0 md:hidden bg-muted/30 rounded-full hover:bg-muted/50">
               <X className="w-5 h-5 text-muted-foreground" />
             </button>
           )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
