'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FollowUpForm from '@/modules/follow-ups/presentation/FollowUpForm';
import { ManageFollowUpsUseCase } from '@/modules/follow-ups/application/manage-follow-ups';
import { FollowUpRecord } from '@/modules/follow-ups/domain/follow-up';
const manage = new ManageFollowUpsUseCase();
export default function EditFollowUpPage() { const { id } = useParams() as { id: string }; const [item, setItem] = useState<FollowUpRecord>(); useEffect(() => { void manage.get(id).then(setItem); }, [id]); return <main className="p-4 md:p-8"><h1 className="mx-auto mb-5 max-w-xl text-2xl font-bold">Modifier la relance</h1>{item ? <FollowUpForm initial={item}/> : <p>Chargement...</p>}</main>; }
