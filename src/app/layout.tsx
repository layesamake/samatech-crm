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
import SecurityGate from '@/modules/security/presentation/SecurityGate';
import PageTitleSync from '@/components/PageTitleSync';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NetworkIndicator } from '@/components/layout/NetworkIndicator';
import { BusinessProvider } from '@/components/providers/BusinessProvider';
import { BusinessGate } from '@/components/providers/BusinessGate';
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="h-full font-sans" suppressHydrationWarning>
      <body className="h-full antialiased bg-background text-foreground flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem themes={['light', 'dark', 'theme-phantom', 'theme-chase']} disableTransitionOnChange>
          <NetworkIndicator />
          <PWARegister />
          <PageTitleSync />
          <SecurityGate>
            <BusinessProvider>
              <BusinessGate>
                <a href="#contenu-principal" className="sr-only fixed left-2 top-2 z-[100] rounded-md bg-background px-4 py-3 font-medium shadow focus:not-sr-only">Aller au contenu principal</a>
                <AppShell>
                  {children}
                </AppShell>
              </BusinessGate>
            </BusinessProvider>
          </SecurityGate>
        </ThemeProvider>
      </body>
    </html>
  )
}
