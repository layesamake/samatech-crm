import { Suspense } from 'react';
import NewPaymentForm from '@/modules/payments/presentation/NewPaymentForm';

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<p className="p-4">Chargement...</p>}>
      <NewPaymentForm />
    </Suspense>
  );
}
