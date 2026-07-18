import Link from 'next/link';

export default function NotFound() {
  return <main className="mx-auto grid min-h-[60vh] max-w-xl place-content-center gap-4 p-6 text-center"><h1 className="text-2xl font-bold">Page introuvable</h1><p>Cette page ou cette ressource n’existe plus.</p><Link href="/" className="mx-auto inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-primary-foreground">Revenir au tableau de bord</Link></main>;
}

