'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatMinor } from '@/modules/invoices/domain/invoice';
import { ManagePaymentsUseCase } from '../application/manage-payments';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PaymentMethod, ReceivableRecord, minorToPaymentInput, parsePaymentAmount } from '../domain/payment';
import { ManageTreasuryAccountsUseCase, TreasuryAccountWithBalance } from '@/modules/treasury/application/manage-treasury-accounts';
import { AllocateTreasurySourcesUseCase } from '@/modules/treasury/application/allocate-treasury-sources';
import { treasuryRepository } from '@/modules/treasury/infrastructure/dexie-treasury-repository';

const managePayments = new ManagePaymentsUseCase();
const accountUseCase = new ManageTreasuryAccountsUseCase(treasuryRepository);
const allocateUseCase = new AllocateTreasurySourcesUseCase(treasuryRepository);

function todayLocal(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function NewPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInvoiceId = searchParams?.get('invoiceId') || '';

  const [receivables, setReceivables] = useState<ReceivableRecord[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialInvoiceId);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayLocal());
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<TreasuryAccountWithBalance[]>([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountUseCase.listAccountsWithBalance().then(setAccounts).catch(console.error);
    managePayments.receivables().then((debts) => {
      setReceivables(debts);
      if (initialInvoiceId && !selectedInvoiceId) {
        setSelectedInvoiceId(initialInvoiceId);
      } else if (debts.length === 1 && !selectedInvoiceId) {
        setSelectedInvoiceId(debts[0].invoice.id);
      }
      setLoading(false);
    }).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Chargement des factures impossible');
      setLoading(false);
    });
  }, [initialInvoiceId, selectedInvoiceId]);

  const selectedReceivable = receivables.find((r) => r.invoice.id === selectedInvoiceId);
  const invoice = selectedReceivable?.invoice;

  useEffect(() => {
    if (invoice) {
      setAmount(minorToPaymentInput(invoice.balanceMinor, invoice.currencyScale));
    } else {
      setAmount('');
    }
  }, [invoice]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!invoice || !selectedReceivable) {
      setError('Veuillez sélectionner une facture à régler.');
      return;
    }
    setError('');
    try {
      const amountMinor = parsePaymentAmount(amount, invoice.currencyScale);
      if (amountMinor > invoice.balanceMinor) {
        throw new Error('Le paiement dépasse le solde restant de la facture.');
      }
      const historical = Boolean(invoice.issueDate && paymentDate < invoice.issueDate);
      if (historical && !window.confirm('La date de paiement précède la date d’émission de la facture. Confirmer cet historique légitime ?')) {
        return;
      }
      if (!window.confirm(`Enregistrer le paiement de ${formatMinor(amountMinor, invoice.currency, invoice.currencyScale)} ?`)) {
        return;
      }
      setPending(true);
      const agg = await managePayments.record({
        invoiceId: invoice.id,
        clientProfileId: invoice.clientProfileId,
        paymentDate,
        amountMinor,
        currency: invoice.currency,
        currencyScale: invoice.currencyScale,
        method,
        reference,
        note,
        confirmHistoricalDate: historical,
      });
      if (accountId) {
        await allocateUseCase.allocate('PAYMENT', agg.payment.id, accountId);
      }
      router.push('/payments');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Enregistrement impossible');
      setPending(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Nouveau paiement</h1>
          <p className="text-sm text-muted-foreground">Enregistrez un encaissement pour une facture en attente.</p>
        </div>
        <Link href="/payments" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
          ← Retour
        </Link>
      </header>

      {error && <p role="alert" className="rounded-md bg-red-500/10 p-3 text-red-800 dark:text-red-200">{error}</p>}

      {loading ? (
        <p>Chargement des factures impayées…</p>
      ) : receivables.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center bg-card">
          <p className="text-muted-foreground">Aucune facture en attente de paiement.</p>
          <Link href="/invoices" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-white text-sm">
            Voir les factures
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card text-card-foreground p-5">
          <div>
            <label className="block text-sm font-medium">Facture à régler</label>
            <select
              required
              aria-label="Sélectionner la facture"
              className="mt-1 h-11 w-full rounded-md border px-3 bg-background text-foreground"
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
            >
              <option value="">-- Sélectionnez une facture --</option>
              {receivables.map(({ invoice: inv, clientName, daysOverdue }) => (
                <option key={inv.id} value={inv.id}>
                  {inv.number} - {clientName} ({formatMinor(inv.balanceMinor, inv.currency, inv.currencyScale)} restants){daysOverdue > 0 ? ` [En retard de ${daysOverdue} j]` : ''}
                </option>
              ))}
            </select>
          </div>

          {invoice && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm flex flex-wrap justify-between gap-2">
              <span>Client : <strong>{selectedReceivable.clientName}</strong></span>
              <span>Solde restant : <strong>{formatMinor(invoice.balanceMinor, invoice.currency, invoice.currencyScale)}</strong></span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">
                Montant ({invoice?.currency ?? 'XOF'})
              </label>
              <input
                required
                disabled={!invoice}
                inputMode="decimal"
                aria-label="Montant du paiement"
                className="mt-1 h-11 w-full rounded-md border px-3 bg-background text-foreground disabled:opacity-50"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Date du paiement</label>
              <input
                required
                type="date"
                aria-label="Date du paiement"
                className="mt-1 h-11 w-full rounded-md border px-3 bg-background text-foreground"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Mode de paiement</label>
              <select
                aria-label="Mode de paiement"
                className="mt-1 h-11 w-full rounded-md border px-3 bg-background text-foreground"
                value={method}
                onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((item) => (
                  <option key={item} value={item}>{PAYMENT_METHOD_LABELS[item]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Compte de trésorerie (facultatif)</label>
              <select
                aria-label="Compte de trésorerie"
                className="mt-1 h-11 w-full rounded-md border px-3 bg-background text-foreground"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
              >
                <option value="">Aucun compte affecté</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Référence (facultative)</label>
              <input
                aria-label="Référence du paiement"
                placeholder="Numéro de chèque, transaction Wave/OM..."
                className="mt-1 h-11 w-full rounded-md border px-3 bg-background text-foreground"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Note {method === 'OTHER' ? '(obligatoire pour le mode Autre)' : '(facultative)'}
            </label>
            <textarea
              required={method === 'OTHER'}
              aria-label="Note du paiement"
              className="mt-1 min-h-20 w-full rounded-md border p-3 bg-background text-foreground"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          {invoice?.issueDate && paymentDate < invoice.issueDate && (
            <p role="alert" className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              Cette date précède l’émission de la facture le {invoice.issueDate}. Une confirmation supplémentaire sera demandée.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            {invoice && (
              <button
                type="button"
                className="h-11 rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted"
                onClick={() => setAmount(minorToPaymentInput(invoice.balanceMinor, invoice.currencyScale))}
              >
                Régler tout le solde
              </button>
            )}
            <button
              disabled={pending || !invoice}
              className="h-11 rounded-md bg-emerald-700 px-6 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
            >
              {pending ? 'Enregistrement…' : 'Enregistrer le paiement'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
