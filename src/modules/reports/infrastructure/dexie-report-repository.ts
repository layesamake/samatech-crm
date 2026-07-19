import { db } from '@/infrastructure/database/db';
import { ExportCriteria } from '../domain/csv';
import { ReportPeriod, ReportRepository, FinancialReportGroup, ReceivablesReportGroup, ClientStatementGroup, CommercialReport, FinancialReport, ReceivablesReport, ClientStatement } from '../domain/report';
import { DexieStatisticsReadRepository } from '@/modules/statistics/infrastructure/dexie-statistics-read-repository';
import { calculateStatistics } from '@/modules/statistics/domain/statistics';

export class DexieReportRepository implements ReportRepository {
  private readonly statsRepo = new DexieStatisticsReadRepository();

  async fetchDataset(criteria: ExportCriteria): Promise<Record<string, unknown>[]> {
    // CSV logic
    switch (criteria.dataset) {
      case 'CONTACTS_PROSPECTS':
        return await db.contacts.toArray();
      case 'CLIENTS':
        return await db.clientProfiles.toArray();
      case 'CATALOG':
        return await db.products.toArray();
      case 'FOLLOW_UPS':
        return await db.followUps.toArray();
      case 'INVOICES':
        return await db.invoices.toArray();
      case 'INVOICE_LINES':
        return await db.invoiceLines.toArray();
      case 'PAYMENTS':
        return await db.payments.toArray();
      case 'EXPENSES':
        return await db.expenses.toArray();
      case 'TREASURY_ACCOUNTS':
        return await db.treasuryAccounts.toArray();
      case 'TREASURY_MOVEMENTS':
        return await db.treasuryOperations.toArray();
      case 'BUDGETS':
        return await db.expenseBudgets.toArray();
      case 'FORECASTS':
        return await db.treasuryForecastItems.toArray();
      case 'COMMERCIAL_DOCUMENTS':
        return await db.commercialDocuments.toArray();
      case 'COMMERCIAL_DOCUMENT_LINES':
        return await db.commercialDocumentLines.toArray();
      case 'DELIVERY_NOTES':
        return await db.commercialDocuments.where('type').equals('DELIVERY_NOTE').toArray();
      default:
        return [];
    }
  }

  async getCommercialReportData(period: ReportPeriod): Promise<Omit<CommercialReport, 'context'>> {
    const snapshot = await this.statsRepo.loadSnapshot();
    const statsPeriod = { preset: 'CUSTOM' as const, from: period.from, to: period.to, label: period.label, timezone: period.timezone };
    const today = new Date().toISOString().slice(0, 10);
    
    // We need documents manually since statistics may not include detailed commercial documents breakdown
    const commercialDocuments = await db.commercialDocuments.toArray();
    
    // Filtre sur la période
    const inPeriod = (d?: string) => d && d >= period.from && d <= period.to;

    const quotes = commercialDocuments.filter(d => d.type === 'QUOTE' && inPeriod(d.issueDate || d.createdAt.slice(0,10)));
    const proformas = commercialDocuments.filter(d => d.type === 'PROFORMA' && inPeriod(d.issueDate || d.createdAt.slice(0,10)));
    const deliveries = commercialDocuments.filter(d => d.type === 'DELIVERY_NOTE' && inPeriod(d.issueDate || d.createdAt.slice(0,10)));

    const stats = calculateStatistics(snapshot.data, {
      period: statsPeriod,
      today,
      primaryCurrency: snapshot.primaryCurrency,
      primaryCurrencyScale: snapshot.primaryCurrencyScale,
    });

    return {
      totalProspects: stats.prospects.total,
      newProspects: stats.prospects.newInPeriod,
      activeProspects: stats.prospects.active,
      totalClients: stats.clients.total,
      newClients: stats.conversions.inPeriod, // approximation if not explicitly available
      conversions: stats.conversions.inPeriod,
      conversionRatePercentage: stats.conversions.ratePercent || 0,
      averageConversionDays: stats.conversions.averageDelayDays,
      
      totalFollowUps: stats.followUps.today + stats.followUps.upcoming + stats.followUps.overdue,
      pendingFollowUps: stats.followUps.today + stats.followUps.upcoming,
      overdueFollowUps: stats.followUps.overdue,
      completedFollowUps: stats.followUps.completedInPeriod,
      
      totalInvoicesIssued: stats.financial.reduce((acc, curr) => acc + (Number(curr.billedMinor) > 0 ? 1 : 0), 0), // approximate
      invoicedByCurrency: stats.financial.map(f => ({ currency: f.currency, currencyScale: f.currencyScale, minor: f.billedMinor })),
      collectedByCurrency: stats.financial.map(f => ({ currency: f.currency, currencyScale: f.currencyScale, minor: f.collectedMinor })),
      
      productsSold: stats.soldProducts,
      
      quotesIssued: quotes.filter(q => q.status === 'ISSUED').length,
      quotesAccepted: quotes.filter(q => q.status === 'ACCEPTED').length,
      quotesRejected: quotes.filter(q => q.status === 'REJECTED').length,
      quotesExpired: 0, // not implemented logic here
      quotesConverted: quotes.filter(q => q.status === 'CONVERTED').length,
      
      proformasIssued: proformas.filter(p => p.status === 'ISSUED').length,
      proformasAccepted: proformas.filter(p => p.status === 'ACCEPTED').length,
      proformasRejected: proformas.filter(p => p.status === 'REJECTED').length,
      
      deliveryNotesIssued: deliveries.filter(d => d.status === 'ISSUED').length,
      deliveryNotesDelivered: deliveries.filter(d => d.status === 'DELIVERED').length,
    };
  }

  async getFinancialReportData(period: ReportPeriod): Promise<Omit<FinancialReport, 'context'>> {
    const invoices = await db.invoices.toArray();
    const payments = await db.payments.toArray();
    const expenses = await db.expenses.toArray();
    const operations = await db.treasuryOperations.toArray();
    
    const inPeriod = (d?: string) => d && d >= period.from && d <= period.to;

    // Grouping logic...
    const groupsMap = new Map<string, FinancialReportGroup>();

    const getGroup = (currency: string, currencyScale: number) => {
      const key = `${currency}-${currencyScale}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          currency,
          currencyScale,
          billedMinor: '0',
          collectedMinor: '0',
          expensesMinor: '0',
          netCashFlowMinor: '0',
          receivableMinor: '0',
          overdueMinor: '0',
          notYetDueMinor: '0',
          treasuryBalanceMinor: '0',
          adjustmentsInMinor: '0',
          adjustmentsOutMinor: '0',
        });
      }
      return groupsMap.get(key)!;
    };

    // Calculate Billed, Collected, Receivable
    for (const invoice of invoices) {
      if (invoice.status === 'BROUILLON' || invoice.status === 'ANNULEE') continue;
      
      const group = getGroup(invoice.currency, invoice.currencyScale);
      
      if (inPeriod(invoice.issueDate)) {
        group.billedMinor = (BigInt(group.billedMinor) + BigInt(invoice.grandTotalMinor)).toString();
      }
      
      const paidMinor = invoice.paidAmountMinor || 0;
      const due = BigInt(invoice.grandTotalMinor) - BigInt(paidMinor);
      if (due > 0n) {
        group.receivableMinor = (BigInt(group.receivableMinor) + due).toString();
        const todayStr = new Date().toISOString().slice(0, 10);
        if (invoice.dueDate && invoice.dueDate < todayStr) {
          group.overdueMinor = (BigInt(group.overdueMinor) + due).toString();
        } else {
          group.notYetDueMinor = (BigInt(group.notYetDueMinor) + due).toString();
        }
      }
    }

    for (const payment of payments) {
      if (payment.status !== 'CONFIRME' || !inPeriod(payment.paymentDate)) continue;
      const group = getGroup(payment.currency, payment.currencyScale);
      group.collectedMinor = (BigInt(group.collectedMinor) + BigInt(payment.amountMinor)).toString();
    }

    for (const exp of expenses) {
      if (exp.status !== 'PAYEE' || !inPeriod(exp.expenseDate)) continue;
      const group = getGroup(exp.currency, exp.currencyScale);
      group.expensesMinor = (BigInt(group.expensesMinor) + BigInt(exp.totalAmountMinor)).toString();
    }

    // Treasury balances
    const accounts = await db.treasuryAccounts.toArray();
    for (const account of accounts) {
      // Calculate balance up to 'to'
      let balance = BigInt(0);
      const accOps = operations.filter(o => (o.accountId === account.id || o.destinationAccountId === account.id) && o.status === 'COMPLETED' && o.operationDate <= period.to);
      for (const op of accOps) {
        if (op.accountId === account.id) {
          if (op.kind === 'EXPENSE_PAYMENT' || op.kind === 'ADJUSTMENT_OUT' || op.kind === 'TRANSFER_OUT') balance -= BigInt(op.amountMinor);
          else balance += BigInt(op.amountMinor);
        } else if (op.destinationAccountId === account.id && op.kind === 'TRANSFER_OUT') {
          balance += BigInt(op.amountMinor);
        }
      }
      
      const group = getGroup(account.currency, account.currencyScale);
      group.treasuryBalanceMinor = (BigInt(group.treasuryBalanceMinor) + balance).toString();
    }

    // Net Cash Flow = collected - expenses
    for (const group of groupsMap.values()) {
      group.netCashFlowMinor = (BigInt(group.collectedMinor) - BigInt(group.expensesMinor)).toString();
    }

    return {
      groups: Array.from(groupsMap.values()),
      activeBudgets: [], // TODO fill if needed
      forecasts30: [],
      forecasts60: [],
      forecasts90: [],
    };
  }

  async getReceivablesReportData(asOfDate: string): Promise<Omit<ReceivablesReport, 'context'>> {
    const invoices = await db.invoices.toArray();
    const payments = await db.payments.toArray();
    const clientProfiles = await db.clientProfiles.toArray();
    const contacts = await db.contacts.toArray();

    const groupsMap = new Map<string, ReceivablesReportGroup>();

    const getGroup = (currency: string, currencyScale: number) => {
      const key = `${currency}-${currencyScale}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          currency,
          currencyScale,
          totalReceivablesMinor: '0',
          notDueMinor: '0',
          tranche0_30Minor: '0',
          tranche31_60Minor: '0',
          tranche61_90Minor: '0',
          trancheOver90Minor: '0',
          items: [],
        });
      }
      return groupsMap.get(key)!;
    };

    for (const invoice of invoices) {
      if (invoice.status === 'BROUILLON' || invoice.status === 'ANNULEE' || invoice.issueDate > asOfDate) continue;

      // Calculate paid up to asOfDate
      const invPayments = payments.filter(p => p.invoiceId === invoice.id && p.status === 'CONFIRME' && p.paymentDate <= asOfDate);
      const paidMinor = invPayments.reduce((acc, p) => acc + BigInt(p.amountMinor), 0n);
      const due = BigInt(invoice.grandTotalMinor) - paidMinor;

      if (due > 0n) {
        const group = getGroup(invoice.currency, invoice.currencyScale);
        group.totalReceivablesMinor = (BigInt(group.totalReceivablesMinor) + due).toString();

        let daysOverdue = 0;
        if (invoice.dueDate && invoice.dueDate < asOfDate) {
          daysOverdue = Math.floor((new Date(asOfDate).getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        }

        if (daysOverdue <= 0) group.notDueMinor = (BigInt(group.notDueMinor) + due).toString();
        else if (daysOverdue <= 30) group.tranche0_30Minor = (BigInt(group.tranche0_30Minor) + due).toString();
        else if (daysOverdue <= 60) group.tranche31_60Minor = (BigInt(group.tranche31_60Minor) + due).toString();
        else if (daysOverdue <= 90) group.tranche61_90Minor = (BigInt(group.tranche61_90Minor) + due).toString();
        else group.trancheOver90Minor = (BigInt(group.trancheOver90Minor) + due).toString();

        const clientProfile = clientProfiles.find(c => c.id === invoice.clientProfileId);
        const contact = contacts.find(c => c.id === clientProfile?.contactId);

        group.items.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.number || '',
          clientId: invoice.clientProfileId,
          clientName: contact?.displayName || 'Inconnu',
          issueDate: invoice.issueDate || '',
          dueDate: invoice.dueDate || '',
          currency: invoice.currency,
          currencyScale: invoice.currencyScale,
          totalMinor: invoice.grandTotalMinor.toString(),
          paidMinor: paidMinor.toString(),
          balanceMinor: due.toString(),
          daysOverdue: Math.max(0, daysOverdue),
          status: paidMinor === 0n ? 'ISSUED' : 'PARTIAL'
        });
      }
    }

    return { groups: Array.from(groupsMap.values()) };
  }

  async getClientStatementData(clientId: string, period: ReportPeriod): Promise<Omit<ClientStatement, 'context'>> {
    const clientProfile = await db.clientProfiles.get(clientId);
    if (!clientProfile) throw new Error('Client introuvable');
    const contact = await db.contacts.get(clientProfile.contactId);
    
    const invoices = await db.invoices.where('clientProfileId').equals(clientId).toArray();
    const invoiceIds = invoices.map(i => i.id);
    const payments = await db.payments.where('invoiceId').anyOf(invoiceIds).toArray();

    const groupsMap = new Map<string, ClientStatementGroup>();

    const getGroup = (currency: string, currencyScale: number) => {
      const key = `${currency}-${currencyScale}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          currency,
          currencyScale,
          openingBalanceMinor: '0',
          closingBalanceMinor: '0',
          movements: [],
        });
      }
      return groupsMap.get(key)!;
    };

    // Calculate opening balance & movements
    for (const invoice of invoices) {
      if (invoice.status === 'BROUILLON' || invoice.status === 'ANNULEE') continue;
      const group = getGroup(invoice.currency, invoice.currencyScale);
      
      if (invoice.issueDate && invoice.issueDate < period.from) {
        group.openingBalanceMinor = (BigInt(group.openingBalanceMinor) + BigInt(invoice.grandTotalMinor)).toString();
      } else if (invoice.issueDate && invoice.issueDate <= period.to) {
        group.movements.push({
          date: invoice.issueDate,
          type: 'INVOICE',
          reference: invoice.number || '',
          description: 'Facture émise',
          debitMinor: invoice.grandTotalMinor.toString(),
          creditMinor: '0',
          balanceMinor: '0' // Computed later
        });
      }
    }

    for (const payment of payments) {
      if (payment.status !== 'CONFIRME') continue;
      const invoice = invoices.find(i => i.id === payment.invoiceId);
      if (!invoice) continue;
      
      const group = getGroup(invoice.currency, invoice.currencyScale);

      if (payment.paymentDate < period.from) {
        group.openingBalanceMinor = (BigInt(group.openingBalanceMinor) - BigInt(payment.amountMinor)).toString();
      } else if (payment.paymentDate <= period.to) {
        group.movements.push({
          date: payment.paymentDate,
          type: 'PAYMENT',
          reference: payment.reference || '',
          description: `Paiement - ${payment.method}`,
          debitMinor: '0',
          creditMinor: payment.amountMinor.toString(),
          balanceMinor: '0' // Computed later
        });
      }
    }

    // Sort and calculate running balances
    for (const group of groupsMap.values()) {
      group.movements.sort((a, b) => a.date.localeCompare(b.date));
      let balance = BigInt(group.openingBalanceMinor);
      for (const m of group.movements) {
        balance += BigInt(m.debitMinor) - BigInt(m.creditMinor);
        m.balanceMinor = balance.toString();
      }
      group.closingBalanceMinor = balance.toString();
    }

    return {
      clientName: contact?.displayName || 'Inconnu',
      groups: Array.from(groupsMap.values()),
    };
  }
}
