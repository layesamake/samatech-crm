'use client';
import { useParams } from 'next/navigation';
import InvoiceForm from '@/modules/invoices/presentation/InvoiceForm';
export default function EditInvoicePage() { const { id } = useParams() as { id: string }; return <InvoiceForm invoiceId={id} />; }
