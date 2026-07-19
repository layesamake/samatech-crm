import CommercialDocumentList from '@/modules/commercial-documents/presentation/CommercialDocumentList';

export const metadata = { title: 'Documents commerciaux | SAMTECH CRM' };

export default function CommercialDocumentsPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <CommercialDocumentList />
    </main>
  );
}
