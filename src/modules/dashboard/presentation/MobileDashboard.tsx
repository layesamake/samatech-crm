'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, ChevronRight, FileWarning, UserPlus, UsersRound } from 'lucide-react';
import { GetStatisticsUseCase } from '@/modules/statistics/application/get-statistics';
import { formatMinorExact, PeriodPreset, StatisticsReport } from '@/modules/statistics/domain/statistics';

const getStatistics = new GetStatisticsUseCase();

type PriorityCardProps = {
  href: string;
  label: string;
  value: number;
  icon: typeof CalendarClock;
  tone: 'primary' | 'warning' | 'danger' | 'success';
};

const priorityTone = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'bg-destructive/10 text-destructive',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
} as const;

function PriorityCard({ href, label, value, icon: Icon, tone }: PriorityCardProps) {
  return (
    <Link href={href} className="rounded-2xl border bg-card p-4 shadow-sm transition-transform active:scale-[0.98]">
      <div className={`mb-3 flex size-10 items-center justify-center rounded-full ${priorityTone[tone]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </Link>
  );
}

export function MobileDashboard() {
  const [report, setReport] = useState<StatisticsReport | null>(null);

  useEffect(() => {
    void getStatistics.execute({ preset: 'CURRENT_MONTH' as PeriodPreset }).then(setReport).catch(console.error);
  }, []);

  if (!report) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement du tableau de bord...</div>;
  }

  const money = report.primaryFinancial;
  const primary = { currency: report.primaryCurrency, scale: report.primaryCurrencyScale };
  const todayLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  if (report.isEmpty) {
    return (
      <div className="min-h-full bg-muted/40 p-4 pb-24">
        <section className="mx-auto max-w-md rounded-3xl border bg-card p-6 shadow-sm">
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserPlus className="size-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">{todayLabel}</p>
          <h1 className="mt-1 text-2xl font-bold">Commencez votre suivi commercial</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Ajoutez votre premier prospect pour organiser les relances, les clients et les factures. Vos données restent enregistrées sur cet appareil.</p>
          <Link href="/prospects/nouveau" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Ajouter un prospect</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/40 p-4 pb-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <section>
          <p className="capitalize text-sm font-medium text-muted-foreground">{todayLabel}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">À faire aujourd&apos;hui</h1>
          <p className="mt-1 text-sm text-muted-foreground">Vos priorités commerciales en un coup d&apos;œil.</p>
        </section>

        <section aria-label="Priorités du jour" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PriorityCard href="/follow-ups?view=OVERDUE" label="Relances en retard" value={report.followUps.overdue} icon={AlertTriangle} tone="danger" />
          <PriorityCard href="/follow-ups?view=TODAY" label="Relances aujourd'hui" value={report.followUps.today} icon={CalendarClock} tone="warning" />
          <PriorityCard href="/prospects" label="Prospects actifs" value={report.prospects.active} icon={UsersRound} tone="primary" />
          <PriorityCard href="/invoices" label="Factures à suivre" value={report.receivables.overdueInvoices} icon={FileWarning} tone="success" />
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Actions rapides</h2>
              <p className="text-xs text-muted-foreground">Une action courante, en un geste.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/prospects/nouveau" className="flex min-h-20 flex-col justify-between rounded-xl bg-primary p-3 text-primary-foreground active:scale-[0.98]"><UserPlus className="size-5" /><span className="text-sm font-semibold">Nouveau prospect</span></Link>
            <Link href="/follow-ups" className="flex min-h-20 flex-col justify-between rounded-xl bg-muted p-3 text-foreground active:scale-[0.98]"><CalendarClock className="size-5 text-primary" /><span className="text-sm font-semibold">Voir les relances</span></Link>
            <Link href="/invoices/new" className="flex min-h-20 flex-col justify-between rounded-xl bg-muted p-3 text-foreground active:scale-[0.98]"><FileWarning className="size-5 text-primary" /><span className="text-sm font-semibold">Nouvelle facture</span></Link>
            <Link href="/campaigns/new" className="flex min-h-20 flex-col justify-between rounded-xl bg-muted p-3 text-foreground active:scale-[0.98]"><UsersRound className="size-5 text-primary" /><span className="text-sm font-semibold">Nouvelle campagne</span></Link>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Créances clients</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatMinorExact(money.receivableMinor, primary.currency, primary.scale)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{report.receivables.overdueInvoices} facture{report.receivables.overdueInvoices > 1 ? 's' : ''} en retard</p>
            </div>
            <Link href="/statistics" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">Statistiques <ChevronRight className="size-4" /></Link>
          </div>
          <div className="mt-5 grid grid-cols-2 border-t pt-4 text-sm">
            <div><p className="font-semibold tabular-nums">{formatMinorExact(money.collectedMinor, primary.currency, primary.scale)}</p><p className="mt-1 text-xs text-muted-foreground">Encaissé ce mois</p></div>
            <div className="border-l pl-4"><p className="font-semibold tabular-nums">{formatMinorExact(money.billedMinor, primary.currency, primary.scale)}</p><p className="mt-1 text-xs text-muted-foreground">Facturé ce mois</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
