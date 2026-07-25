'use client';

import { Bell, CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GetStatisticsUseCase } from '@/modules/statistics/application/get-statistics';
import type { PeriodPreset, StatisticsReport } from '@/modules/statistics/domain/statistics';
import { Button } from '@/components/ui/button';

const statistics = new GetStatisticsUseCase();
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

function summary(report: StatisticsReport) {
  const parts: string[] = [];
  if (report.followUps.overdue > 0) parts.push(`${report.followUps.overdue} relance${report.followUps.overdue > 1 ? 's' : ''} en retard`);
  if (report.followUps.today > 0) parts.push(`${report.followUps.today} relance${report.followUps.today > 1 ? 's' : ''} aujourd’hui`);
  if (report.receivables.overdueInvoices > 0) parts.push(`${report.receivables.overdueInvoices} paiement${report.receivables.overdueInvoices > 1 ? 's' : ''} attendu${report.receivables.overdueInvoices > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

async function notify(body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !body) return;
  const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready.catch(() => undefined) : undefined;
  if (registration) {
    await registration.showNotification('SAMTECH CRM — À suivre', { body, icon: '/icon-192.png', tag: 'samtech-daily-reminders' });
    return;
  }
  new Notification('SAMTECH CRM — À suivre', { body, icon: '/icon-192.png', tag: 'samtech-daily-reminders' });
}

export function LocalNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const lastSummary = useRef('');

  const check = useCallback(async () => {
    const report = await statistics.execute({ preset: 'CURRENT_MONTH' as PeriodPreset });
    const message = summary(report);
    if (message && message !== lastSummary.current) {
      await notify(message);
      lastSummary.current = message;
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
    if (Notification.permission !== 'granted') return;
    void check();
    const interval = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [check]);

  const enable = async () => {
    if (!('Notification' in window)) return;
    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission === 'granted') {
      lastSummary.current = '';
      await check();
    }
  };

  if (permission === 'unsupported') return null;
  if (permission === 'granted') return <p className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />Alertes locales activées lorsque l’application est ouverte.</p>;
  if (permission === 'denied') return <p className="text-xs text-muted-foreground">Les alertes locales sont bloquées dans le navigateur.</p>;
  return <div className="rounded-xl border border-dashed bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">Recevoir les rappels locaux</p><p className="mt-1 text-xs text-muted-foreground">Relances et paiements attendus, lorsque l’application est ouverte.</p></div><Button type="button" variant="outline" className="gap-2" onClick={() => void enable()}><Bell className="size-4" aria-hidden="true" />Activer</Button></div></div>;
}
