import { CommercialReport, FinancialReport, ReceivablesReport, ClientStatement, ReportPeriod, ReportContext, ReportRepository } from '../domain/report';

export class GenerateReportUseCase {
  constructor(
    private readonly repository: ReportRepository,
    private readonly appVersion: string = '0.1.0'
  ) {}

  private createContext(type: 'COMMERCIAL' | 'FINANCIAL' | 'RECEIVABLES' | 'CLIENT_STATEMENT', period: ReportPeriod, filters: Record<string, string | number | boolean> = {}): ReportContext {
    return {
      reportId: crypto.randomUUID(),
      reportType: type,
      generatedAt: new Date().toISOString(),
      period,
      filters,
      appVersion: this.appVersion,
      hasIntegrityWarnings: false, // Set to true if repository detects anomalies
    };
  }

  async generateCommercialReport(period: ReportPeriod): Promise<CommercialReport> {
    const data = await this.repository.getCommercialReportData(period);
    
    return {
      context: this.createContext('COMMERCIAL', period),
      totalProspects: data.totalProspects,
      newProspects: data.newProspects,
      activeProspects: data.activeProspects,
      totalClients: data.totalClients,
      newClients: data.newClients,
      conversions: data.conversions,
      conversionRatePercentage: data.conversionRatePercentage,
      averageConversionDays: data.averageConversionDays,
      
      totalFollowUps: data.totalFollowUps,
      pendingFollowUps: data.pendingFollowUps,
      overdueFollowUps: data.overdueFollowUps,
      completedFollowUps: data.completedFollowUps,
      
      totalInvoicesIssued: data.totalInvoicesIssued,
      invoicedByCurrency: data.invoicedByCurrency,
      collectedByCurrency: data.collectedByCurrency,
      
      productsSold: data.productsSold,
      
      quotesIssued: data.quotesIssued,
      quotesAccepted: data.quotesAccepted,
      quotesRejected: data.quotesRejected,
      quotesExpired: data.quotesExpired,
      quotesConverted: data.quotesConverted,
      
      proformasIssued: data.proformasIssued,
      proformasAccepted: data.proformasAccepted,
      proformasRejected: data.proformasRejected,
      
      deliveryNotesIssued: data.deliveryNotesIssued,
      deliveryNotesDelivered: data.deliveryNotesDelivered,
    };
  }

  async generateFinancialReport(period: ReportPeriod): Promise<FinancialReport> {
    const data = await this.repository.getFinancialReportData(period);
    
    return {
      context: this.createContext('FINANCIAL', period),
      groups: data.groups,
      activeBudgets: data.activeBudgets,
      forecasts30: data.forecasts30,
      forecasts60: data.forecasts60,
      forecasts90: data.forecasts90,
    };
  }

  async generateReceivablesReport(asOfDate: string): Promise<ReceivablesReport> {
    const data = await this.repository.getReceivablesReportData(asOfDate);
    const period: ReportPeriod = { from: '1970-01-01', to: asOfDate, timezone: 'Africa/Dakar', label: `Jusqu'au ${asOfDate}` };
    
    return {
      context: this.createContext('RECEIVABLES', period, { asOfDate }),
      asOfDate,
      groups: data.groups,
    };
  }

  async generateClientStatement(clientId: string, period: ReportPeriod): Promise<ClientStatement> {
    const data = await this.repository.getClientStatementData(clientId, period);
    
    return {
      context: this.createContext('CLIENT_STATEMENT', period, { clientId }),
      clientId,
      clientName: data.clientName,
      groups: data.groups,
    };
  }
}
