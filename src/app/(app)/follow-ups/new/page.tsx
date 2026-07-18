import { Suspense } from 'react';
import NewFollowUpClient from '@/modules/follow-ups/presentation/NewFollowUpClient';
export default function NewFollowUpPage() { return <main className="p-4 md:p-8"><h1 className="mx-auto mb-5 max-w-xl text-2xl font-bold">Planifier une relance</h1><Suspense fallback={<p className="mx-auto max-w-xl">Chargement du formulaire...</p>}><NewFollowUpClient /></Suspense></main>; }
