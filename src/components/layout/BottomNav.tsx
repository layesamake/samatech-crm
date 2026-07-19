'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Menu,
  Moon,
  Sun,
  Receipt,
  MessageSquare,
  DollarSign,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [fabOpen, setFabOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fermer le FAB si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fabOpen && !(e.target as Element).closest('.fab-container')) {
        setFabOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fabOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const primaryLinks = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/invoices', label: 'Factures', icon: FileText },
  ];

  const moreLinks = [
    { href: '/commercial-documents', label: 'Ventes', icon: FileText },
    { href: '/prospects', label: 'Prospects', icon: Users },
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
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-t pb-safe lg:hidden">
        <div className="flex h-16 items-center justify-around px-2 relative">
          
          <Link href="/" className={cn("flex flex-col items-center justify-center w-16 h-full gap-1 transition-transform active:scale-95", pathname === '/' ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <Home className={cn("h-5 w-5", pathname === '/' ? "fill-primary/20 stroke-[2.5]" : "stroke-2")} />
            <span className="text-[10px] font-medium">Accueil</span>
          </Link>
          
          <Link href="/prospects" className={cn("flex flex-col items-center justify-center w-16 h-full gap-1 transition-transform active:scale-95", pathname?.startsWith('/prospects') ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <Users className={cn("h-5 w-5", pathname?.startsWith('/prospects') ? "fill-primary/20 stroke-[2.5]" : "stroke-2")} />
            <span className="text-[10px] font-medium">Prospects</span>
          </Link>

          <Link href="/follow-ups" className={cn("flex flex-col items-center justify-center w-16 h-full gap-1 transition-transform active:scale-95", pathname?.startsWith('/follow-ups') ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <Repeat className={cn("h-5 w-5", pathname?.startsWith('/follow-ups') ? "fill-primary/20 stroke-[2.5]" : "stroke-2")} />
            <span className="text-[10px] font-medium">Relances</span>
          </Link>

          <Link href="/clients" className={cn("flex flex-col items-center justify-center w-16 h-full gap-1 transition-transform active:scale-95", pathname?.startsWith('/clients') ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <Users className={cn("h-5 w-5", pathname?.startsWith('/clients') ? "fill-primary/20 stroke-[2.5]" : "stroke-2")} />
            <span className="text-[10px] font-medium">Clients</span>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground hover:text-foreground transition-transform active:scale-95">
              <Menu className="h-5 w-5 stroke-2" />
              <span className="text-[10px] font-medium">Plus</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl border-t h-[80vh] flex flex-col p-0 bg-background/95 backdrop-blur-xl">
              <SheetHeader className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-left font-bold text-lg">Menu</SheetTitle>
                  {mounted && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full bg-muted/50"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                  )}
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {moreLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center p-4 rounded-2xl transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
                          : "bg-muted/40 text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-4 h-6 w-6",
                          isActive ? "text-primary-foreground" : "text-muted-foreground"
                        )}
                      />
                      <span className="text-base">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

    </>
  );
}
