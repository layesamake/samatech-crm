'use client';

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col lg:pl-72 min-h-screen">
        <Topbar />
        
        <main id="contenu-principal" tabIndex={-1} className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
