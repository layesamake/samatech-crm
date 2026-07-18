'use client';
import { useSearchParams } from 'next/navigation';
import FollowUpForm from './FollowUpForm';
export default function NewFollowUpClient() { const contactId = useSearchParams().get('contactId') || undefined; return <FollowUpForm contactId={contactId} />; }
