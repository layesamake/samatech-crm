import CommercialDocumentForm from '@/modules/commercial-documents/presentation/CommercialDocumentForm';

export const metadata = { title: 'Modifier le document | SAMTECH CRM' };

export default async function EditCommercialDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CommercialDocumentForm documentId={id} />;
}
