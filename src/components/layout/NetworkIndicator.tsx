'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NetworkIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Initial state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setShow(true);
    }

    const handleOnline = () => {
      setIsOffline(false);
      // On le laisse visible quelques secondes pour dire "De retour en ligne"
      setTimeout(() => setShow(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!show && !isOffline) return null;

  return (
    <div 
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-2 text-sm font-medium transition-all duration-300 transform",
        isOffline 
          ? "bg-amber-500 text-white translate-y-0" 
          : "bg-emerald-500 text-white translate-y-0",
        !show && !isOffline && "-translate-y-full"
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4 mr-2" />
          <span>Mode hors ligne actif. Vos modifications seront enregistrées localement.</span>
        </>
      ) : (
        <span>Connexion rétablie !</span>
      )}
    </div>
  );
}
