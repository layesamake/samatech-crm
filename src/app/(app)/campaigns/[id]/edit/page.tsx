'use client';
import { useParams } from 'next/navigation';
import { CampaignEditor } from '@/modules/campaigns/presentation/CampaignEditor';
export default function EditCampaignPage() { const { id } = useParams<{ id: string }>(); return <CampaignEditor campaignId={id} />; }
