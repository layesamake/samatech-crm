import { Suspense } from 'react';
import InvoiceForm from '@/modules/invoices/presentation/InvoiceForm';
export default function NewInvoicePage() { return <Suspense fallback={<p className="p-4">Chargement...</p>}><InvoiceForm /></Suspense>; }
