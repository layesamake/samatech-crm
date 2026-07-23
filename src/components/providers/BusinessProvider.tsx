'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BusinessDatabaseManager, BusinessResolutionStatus } from '@/infrastructure/database/business-manager';
import { BusinessRecord } from '@/infrastructure/database/master-db';

interface BusinessContextState {
  status: BusinessResolutionStatus;
  businesses: BusinessRecord[];
  activeBusiness: BusinessRecord | null;
  activeBusinessId: string | null;
  createBusiness: (params: { name: string; logoBase64?: string }) => Promise<void>;
  switchBusiness: (id: string) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextState | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BusinessResolutionStatus>('INITIALIZING');
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<BusinessRecord | null>(null);

  const refreshBusinesses = async () => {
    try {
      const all = await BusinessDatabaseManager.getAllBusinesses();
      setBusinesses(all);
      
      const activeId = BusinessDatabaseManager.getActiveBusinessId();
      if (activeId) {
        const active = all.find(b => b.id === activeId) || null;
        setActiveBusiness(active);
      }
    } catch (e) {
      console.error('Failed to refresh businesses', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const resolution = await BusinessDatabaseManager.initialize();
        if (mounted) {
          await refreshBusinesses();
          setStatus(resolution);
        }
      } catch (e) {
        console.error('BusinessProvider initialization failed', e);
        if (mounted) setStatus('ERROR');
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const createBusiness = async (params: { name: string; logoBase64?: string }) => {
    const newBusiness = await BusinessDatabaseManager.createBusiness(params);
    await refreshBusinesses();
    // After creating a business (especially the first one), switch to it.
    await switchBusiness(newBusiness.id);
  };

  const switchBusiness = async (id: string) => {
    await BusinessDatabaseManager.switchBusiness(id);
  };

  return (
    <BusinessContext.Provider
      value={{
        status,
        businesses,
        activeBusiness,
        activeBusinessId: activeBusiness?.id || null,
        createBusiness,
        switchBusiness,
        refreshBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
