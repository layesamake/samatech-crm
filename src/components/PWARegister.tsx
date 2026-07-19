'use client';

import { useEffect, useState } from 'react';

export default function PWARegister() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') return;

    const wb = navigator.serviceWorker;
    
    // Si la page est rechargée après que le worker ait pris le contrôle
    wb.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    wb.register('/sw.js').then((registration) => {
      // Détecter un nouveau SW en attente d'activation
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdate(true);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShowUpdate(true);
            }
          });
        }
      });
    }).catch((error) => {
      console.error('Échec de l\'enregistrement du Service Worker:', error);
    });

  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div 
      role="alert" 
      className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[60] bg-slate-900 text-white p-4 rounded-xl shadow-2xl border flex flex-col sm:flex-row items-center gap-4 max-w-sm"
    >
      <div className="text-sm font-medium flex-1">
        Une nouvelle version de SAMTECH CRM est prête à être installée.
      </div>
      <div className="flex gap-2 w-full sm:w-auto shrink-0">
        <button 
          onClick={() => setShowUpdate(false)}
          className="flex-1 sm:flex-none px-3 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          Plus tard
        </button>
        <button 
          onClick={handleUpdate}
          className="flex-1 sm:flex-none px-3 py-2 text-sm font-medium text-slate-900 bg-white hover:bg-slate-200 rounded-lg transition-colors"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}
