import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccessibleBars } from '../presentation/AccessibleBars';
import { PeriodSelector, StatisticsView } from '../presentation/StatisticsDashboard';
import { calculateStatistics, resolveStatisticsPeriod } from '../domain/statistics';

vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

describe('composants statistiques accessibles', () => {
  it('expose un libellé graphique et une alternative textuelle', () => {
    render(<AccessibleBars title="Produits demandés" items={[{ label: 'Formation', value: 3, display: '3 demandes' }]} />);
    expect(screen.getByRole('img', { name: 'Produits demandés' })).toBeInTheDocument();
    expect(screen.getByText('Alternative textuelle')).toBeInTheDocument();
    expect(screen.getAllByText('3 demandes')).toHaveLength(2);
  });

  it('affiche un état vide sans NaN ni barre factice', () => {
    const { container } = render(<AccessibleBars title="Vide" items={[]} />);
    expect(screen.getByText('Aucune donnée sur la période.')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('NaN');
  });

  it('transmet les bornes personnalisées inclusives', () => {
    const apply = vi.fn(); render(<PeriodSelector preset="CURRENT_MONTH" from="2026-07-01" to="2026-07-31" pending={false} onApply={apply} />);
    fireEvent.change(screen.getByLabelText('Période d’analyse'), { target: { value: 'CUSTOM' } });
    fireEvent.change(screen.getByLabelText('Début de période'), { target: { value: '2026-07-02' } });
    fireEvent.change(screen.getByLabelText('Fin de période'), { target: { value: '2026-07-03' } });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
    expect(apply).toHaveBeenCalledWith({ preset: 'CUSTOM', from: '2026-07-02', to: '2026-07-03', includeArchivedProducts: false });
  });

  it('rend les cartes, raccourcis, multi-devise et avertissement d’intégrité', () => {
    const report = calculateStatistics({ contacts: [], prospectProfiles: [], clientProfiles: [], locations: [], products: [], prospectInterests: [], followUps: [], invoices: [], invoiceLines: [], payments: [], campaigns: [], campaignRecipients: [], expenses: [] }, { period: resolveStatisticsPeriod('CURRENT_MONTH', '2026-07-18'), today: '2026-07-18', primaryCurrency: 'XOF', primaryCurrencyScale: 0 });
    report.isEmpty = false; report.hasOtherCurrencies = true; report.integrity = { hasIssues: true, count: 2, byCode: { MISSING_REFERENCE: 2 } };
    report.financial.push(report.primaryFinancial, { currency: 'USD', currencyScale: 2, billedMinor: '100', collectedMinor: '0', receivableMinor: '100', overdueMinor: '0', upcomingMinor: '100', expensesMinor: '0' });
    render(<StatisticsView report={report} detailed />);
    expect(screen.getByText('Prospects totaux')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('2 incohérence(s)');
    expect(screen.getByRole('status')).toHaveTextContent('Plusieurs devises');
    expect(screen.getByRole('link', { name: 'Ajouter un prospect' })).toHaveAttribute('href', '/prospects/nouveau');
    expect(screen.getByRole('link', { name: 'Créer une facture' })).toHaveAttribute('href', '/invoices/new');
    expect(screen.getByRole('link', { name: 'Voir les relances du jour' })).toHaveAttribute('href', '/follow-ups?view=TODAY');
    expect(screen.getByRole('link', { name: 'Voir les créances' })).toHaveAttribute('href', '/payments?view=RECEIVABLES');
    expect(screen.getByText(/USD · échelle 2/)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('NaN');
  });
});
