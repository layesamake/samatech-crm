import { Suspense } from 'react';
import CommercialDocumentForm from '@/modules/commercial-documents/presentation/CommercialDocumentForm';

export const metadata = { title: 'Nouveau document commercial | SAMTECH CRM' };

export default function CreateCommercialDocumentPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement du formulaire...</div>}>
      <CommercialDocumentForm />
    </Suspense>
  );
}
