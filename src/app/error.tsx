'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset(): void }) {
  useEffect(() => { console.error('Erreur applicative récupérable', error.digest ?? 'sans-code'); }, [error.digest]);
  return <main className="mx-auto grid min-h-[60vh] max-w-xl place-content-center gap-4 p-6 text-center" role="alert"><h1 className="text-2xl font-bold">Une erreur inattendue est survenue</h1><p>Vos données locales n’ont pas été effacées. Vous pouvez réessayer ou revenir au tableau de bord.</p><div className="flex flex-wrap justify-center gap-3"><button onClick={reset} className="min-h-11 rounded-md bg-primary px-5 text-primary-foreground">Réessayer</button><Link href="/" className="inline-flex min-h-11 items-center rounded-md border px-5">Tableau de bord</Link></div></main>;
}

