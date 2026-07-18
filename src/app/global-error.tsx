'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset(): void }) {
  return <html lang="fr"><body><main style={{ maxWidth: 560, margin: '10vh auto', padding: 24, fontFamily: 'system-ui', textAlign: 'center' }}><h1>Impossible d’afficher SAMTECH CRM</h1><p>Les données locales restent sur cet appareil. Rechargez l’application pour reprendre.</p><button onClick={reset} style={{ minHeight: 44, padding: '8px 20px' }}>Réessayer</button></main></body></html>;
}

