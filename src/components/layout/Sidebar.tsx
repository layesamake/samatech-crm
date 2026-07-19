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
  PieChart
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Tableau de bord', icon: Home },
    { href: '/prospects', label: 'Prospects', icon: Users },
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

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="flex flex-col p-4 border-b">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-3">
             <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
               AS
             </div>
             <div>
               <p className="font-medium text-sm truncate w-32">Abdoulaye Samake</p>
               <p className="text-xs text-muted-foreground truncate w-32">admin@samatech.com</p>
             </div>
           </div>
           {onClose && (
             <button onClick={onClose} className="p-2 md:hidden">
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
