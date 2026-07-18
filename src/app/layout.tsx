import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'SAMTECH CRM', template: '%s — SAMTECH CRM' },
  description: 'Application de gestion commerciale hors ligne',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SAMTECH CRM',
  },
  formatDetection: {
    telephone: false,
  },
}

import PWARegister from '@/components/PWARegister'
import Link from 'next/link';
import SecurityGate from '@/modules/security/presentation/SecurityGate';
import PageTitleSync from '@/components/PageTitleSync';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="h-full font-sans">
      <body className="h-full antialiased bg-background text-foreground flex flex-col">
        <PWARegister />
        <PageTitleSync />
        <SecurityGate>
        <a href="#contenu-principal" className="sr-only fixed left-2 top-2 z-[100] rounded-md bg-background px-4 py-3 font-medium shadow focus:not-sr-only">Aller au contenu principal</a>
        {/* En-tête / Navigation principale de l'application */}
        <header className="sticky top-0 z-50 flex min-h-14 w-full items-center gap-3 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4">
          <Link href="/" className="shrink-0 text-lg font-semibold">SAMTECH CRM</Link>
          <span className="shrink-0 text-[10px] text-muted-foreground" aria-label="Version 1.0.0 bêta 1">v1.0.0-beta.1</span>
          <nav aria-label="Navigation principale" className="flex min-w-0 flex-1 gap-1 overflow-x-auto sm:ml-2 sm:gap-2">
            <Link href="/" className="text-sm font-medium hover:underline">Tableau de bord</Link>
            <Link href="/prospects" className="text-sm font-medium hover:underline">Prospects</Link>
            <Link href="/clients" className="text-sm font-medium hover:underline">Clients</Link>
            <Link href="/invoices" className="text-sm font-medium hover:underline">Factures</Link>
            <Link href="/payments" className="text-sm font-medium hover:underline">Paiements</Link>
            <Link href="/campaigns" className="text-sm font-medium hover:underline">Campagnes</Link>
            <Link href="/statistics" className="text-sm font-medium hover:underline">Statistiques</Link>
            <Link href="/follow-ups" className="text-sm font-medium hover:underline">Relances</Link>
            <Link href="/catalog" className="text-sm font-medium hover:underline">Catalogue</Link>
            <Link href="/message-templates" className="text-sm font-medium hover:underline">Modèles</Link>
            <Link href="/settings" className="text-sm font-medium hover:underline">Paramètres</Link>
          </nav>
        </header>

        {/* Zone de contenu */}
        <main id="contenu-principal" tabIndex={-1} className="flex-1 overflow-y-auto">
          {children}
        </main>
        </SecurityGate>
      </body>
    </html>
  )
}
