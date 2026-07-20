import { ExportCriteria } from './csv';

export interface ReportPeriod {
  from: string; // YYYY-MM-DD inclus
  to: string;   // YYYY-MM-DD inclus
  timezone: 'Africa/Dakar';
  label: string;
}

export interface ReportContext {
  reportId: string;
  reportType: 'COMMERCIAL' | 'FINANCIAL' | 'RECEIVABLES' | 'CLIENT_STATEMENT';
  generatedAt: string;
  period: ReportPeriod;
  filters: Record<string, string | boolean | string[]>;
  appVersion: string;
  hasIntegrityWarnings: boolean;
}

export interface ExactMoney {
  currency: string;
  currencyScale: number;
  minor: string;
}

export interface CommercialReport {
  context: ReportContext;
  
  // Prospects & Clients
  totalProspects: number;
  newProspects: number;
  activeProspects: number;
  totalClients: number;
  newClients: number;
  conversions: number;
  conversionRatePercentage: number;
  averageConversionDays: number | null;
  
  // Follow-ups
  totalFollowUps: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  completedFollowUps: number;
  
  // Invoices & Payments (Commercial view)
  totalInvoicesIssued: number;
  invoicedByCurrency: ExactMoney[];
  collectedByCurrency: ExactMoney[];
  
  // Products
  productsSold: { designation: string; quantityScaled: string; quantityScale: number }[];
  
  // Commercial Documents
  quotesIssued: number;
  quotesAccepted: number;
  quotesRejected: number;
  quotesExpired: number;
  quotesConverted: number;
  
  proformasIssued: number;
  proformasAccepted: number;
  proformasRejected: number;
  
  deliveryNotesIssued: number;
  deliveryNotesDelivered: number;
  
  // Comparison
  previousPeriod?: Partial<CommercialReport>;
}

export interface FinancialReportGroup {
  currency: string;
  currencyScale: number;
  billedMinor: string;
  collectedMinor: string;
  expensesMinor: string;
  netCashFlowMinor: string; // collected - expenses
  receivableMinor: string;
  overdueMinor: string;
  notYetDueMinor: string;
  treasuryBalanceMinor: string; // Balance at end date
  adjustmentsInMinor: string;
  adjustmentsOutMinor: string;
}

export interface TreasuryBudgetSummary {
  id: string;
  category: string;
  startDate: string;
  endDate: string;
  currency: string;
  currencyScale: number;
  allocatedMinor: string;
  spentMinor: string;
  remainingMinor: string;
}

export interface TreasuryForecastSummary {
  id: string;
  type: 'IN' | 'OUT';
  expectedDate: string;
  currency: string;
  currencyScale: number;
  amountMinor: string;
  status: 'PENDING' | 'REALIZED' | 'CANCELLED';
  description: string;
}

export interface FinancialReport {
  context: ReportContext;
  groups: FinancialReportGroup[];
  activeBudgets: TreasuryBudgetSummary[];
  forecasts30: TreasuryForecastSummary[];
  forecasts60: TreasuryForecastSummary[];
  forecasts90: TreasuryForecastSummary[];
}

export interface ReceivableItem {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  currencyScale: number;
  totalMinor: string;
  paidMinor: string;
  balanceMinor: string;
  daysOverdue: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'CANCELLED' | 'UNCOLLECTIBLE';
}

export interface ReceivablesReportGroup {
  currency: string;
  currencyScale: number;
  totalReceivablesMinor: string;
  notDueMinor: string;
  tranche0_30Minor: string;
  tranche31_60Minor: string;
  tranche61_90Minor: string;
  trancheOver90Minor: string;
  items: ReceivableItem[];
}

export interface ReceivablesReport {
  context: ReportContext;
  asOfDate: string;
  groups: ReceivablesReportGroup[];
}

export interface ClientStatementMovement {
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'REFUND';
  reference: string;
  description: string;
  debitMinor: string; // Invoices increase what the client owes
  creditMinor: string; // Payments decrease what the client owes
  balanceMinor: string; // Running balance
}

export interface ClientStatementGroup {
  currency: string;
  currencyScale: number;
  openingBalanceMinor: string;
  closingBalanceMinor: string;
  movements: ClientStatementMovement[];
}

export interface ClientStatement {
  context: ReportContext;
  clientId: string;
  clientName: string;
  groups: ClientStatementGroup[];
}

export interface ReportRepository {
  fetchDataset(criteria: ExportCriteria): Promise<Record<string, unknown>[]>;
  getCommercialReportData(period: ReportPeriod): Promise<Omit<CommercialReport, 'context'>>;
  getFinancialReportData(period: ReportPeriod): Promise<Omit<FinancialReport, 'context'>>;
  getReceivablesReportData(asOfDate: string): Promise<Omit<ReceivablesReport, 'context'>>;
  getClientStatementData(clientId: string, period: ReportPeriod): Promise<Omit<ClientStatement, 'context'>>;
}
