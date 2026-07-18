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
  Sun
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
    { href: '/prospects', label: 'Prospects', icon: Users },
    { href: '/payments', label: 'Paiements', icon: CreditCard },
    { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
    { href: '/statistics', label: 'Statistiques', icon: BarChart },
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
          
          <Link href="/clients" className={cn("flex flex-col items-center justify-center w-16 h-full gap-1 transition-transform active:scale-95", pathname?.startsWith('/clients') ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <Users className={cn("h-5 w-5", pathname?.startsWith('/clients') ? "fill-primary/20 stroke-[2.5]" : "stroke-2")} />
            <span className="text-[10px] font-medium">Clients</span>
          </Link>

          {/* FAB (Floating Action Button) */}
          <div className="relative fab-container flex items-center justify-center">
            <button 
              onClick={() => setFabOpen(!fabOpen)}
              className={cn(
                "flex items-center justify-center -mt-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 transition-all focus:outline-none", 
                fabOpen ? "rotate-45 bg-destructive text-destructive-foreground shadow-destructive/30" : "hover:scale-105 active:scale-95"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
            
            {/* Popover */}
            <div className={cn("absolute bottom-20 left-1/2 -translate-x-1/2 bg-popover/90 backdrop-blur-xl text-popover-foreground rounded-2xl shadow-2xl border w-56 flex flex-col p-2 gap-1 origin-bottom transition-all duration-200", fabOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none")}>
               <Link href="/invoices/new" onClick={() => setFabOpen(false)} className="flex items-center p-3 rounded-xl hover:bg-muted font-medium text-sm transition-colors">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3"><FileText className="h-4 w-4 text-primary" /></div> Facture
               </Link>
               <Link href="/prospects/nouveau" onClick={() => setFabOpen(false)} className="flex items-center p-3 rounded-xl hover:bg-muted font-medium text-sm transition-colors">
                  <div className="bg-orange-500/10 p-2 rounded-lg mr-3"><Users className="h-4 w-4 text-orange-500" /></div> Prospect
               </Link>
               <Link href="/payments" onClick={() => setFabOpen(false)} className="flex items-center p-3 rounded-xl hover:bg-muted font-medium text-sm transition-colors">
                  <div className="bg-green-500/10 p-2 rounded-lg mr-3"><CreditCard className="h-4 w-4 text-green-500" /></div> Paiement
               </Link>
            </div>
          </div>

          <Link href="/invoices" className={cn("flex flex-col items-center justify-center w-16 h-full gap-1 transition-transform active:scale-95", pathname?.startsWith('/invoices') ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <FileText className={cn("h-5 w-5", pathname?.startsWith('/invoices') ? "fill-primary/20 stroke-[2.5]" : "stroke-2")} />
            <span className="text-[10px] font-medium">Factures</span>
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
      {/* Overlay to block interactions behind the fab popover */}
      {fabOpen && (
        <div className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setFabOpen(false)} />
      )}
    </>
  );
}
