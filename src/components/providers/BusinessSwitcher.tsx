'use client';

import { useBusiness } from './BusinessProvider';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function BusinessSwitcher() {
  const { activeBusiness, businesses, switchBusiness } = useBusiness();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  if (!activeBusiness) return null;

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="h-10 px-2 lg:px-3 flex items-center gap-2 border border-transparent hover:border-border hover:bg-white/5 transition-all outline-none rounded-md">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-xs flex-shrink-0">
            {activeBusiness.logoBase64 ? (
              <img src={activeBusiness.logoBase64} alt={activeBusiness.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              activeBusiness.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <span className="font-semibold hidden sm:inline-block max-w-[150px] truncate">
            {activeBusiness.name}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground px-2 pt-1 uppercase">Espaces disponibles</p>
          <div className="space-y-1">
            {businesses.filter(b => b.status !== 'archived').map(b => (
              <Button 
                key={b.id} 
                variant={b.id === activeBusiness.id ? 'secondary' : 'ghost'} 
                className="w-full justify-start font-normal h-10 px-2"
                onClick={() => {
                  setOpen(false);
                  if (b.id !== activeBusiness.id) {
                    setSwitchingTo(b.name);
                    switchBusiness(b.id);
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
          
          <Button variant="ghost" className="w-full justify-start text-sm h-9 px-2 text-muted-foreground" onClick={() => { setOpen(false); router.push('/settings'); }}>
            <Settings className="h-4 w-4 mr-2" />
            Gérer mes espaces
          </Button>
        </div>
      </PopoverContent>
    </Popover>
    {switchingTo && (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground">Ouverture de {switchingTo}...</h2>
        <p className="text-muted-foreground mt-2">Veuillez patienter</p>
      </div>
    )}
    </>
  );
}
