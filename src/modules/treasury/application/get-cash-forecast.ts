import { DexieTreasuryRepository } from '../infrastructure/dexie-treasury-repository';
import { calculateCashForecast, TreasuryForecastItemRecord, TreasuryForecastType } from '../domain/forecast';
import { ManageTreasuryAccountsUseCase } from './manage-treasury-accounts';

export interface CreateForecastItemDTO {
  type: TreasuryForecastType;
  expectedDate: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  label: string;
  note?: string;
}

export class GetCashForecastUseCase {
  constructor(
    private readonly repository: DexieTreasuryRepository,
    private readonly accountUseCase: ManageTreasuryAccountsUseCase
  ) {}

  async createForecastItem(dto: CreateForecastItemDTO): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    if (dto.amountMinor <= 0) throw new Error('Le montant prévisionnel doit être strictement positif.');

    const item: TreasuryForecastItemRecord = {
      id,
      type: dto.type,
      expectedDate: dto.expectedDate,
      amountMinor: dto.amountMinor,
      currency: dto.currency,
      currencyScale: dto.currencyScale,
      label: dto.label.trim(),
      note: dto.note,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    await this.repository.saveForecastItem(item);
    return id;
  }

  async getForecast(currency: string, currencyScale: number, targetDate: string): Promise<{
    currentBalanceMinor: number;
    forecastBalanceMinor: number;
    items: TreasuryForecastItemRecord[];
  }> {
    const asOfDate = new Date().toISOString().split('T')[0];
    
    // 1. Agréger le solde de tous les comptes pour la devise donnée
    const accounts = await this.accountUseCase.listAccountsWithBalance();
    let currentBalanceMinor = BigInt(0);
    
    for (const acc of accounts) {
      if (acc.currency === currency && acc.currencyScale === currencyScale) {
        currentBalanceMinor += BigInt(acc.balanceMinor);
      }
    }

    // 2. Récupérer les items prévisionnels
    const allItems = await this.repository.listForecastItems('ACTIVE');
    
    // Filtrer par devise
    const relevantItems = allItems.filter(item => item.currency === currency && item.currencyScale === currencyScale);

    // 3. Calculer la prévision
    const forecastBalance = calculateCashForecast(Number(currentBalanceMinor), relevantItems, currency, currencyScale, asOfDate, targetDate);

    return {
      currentBalanceMinor: Number(currentBalanceMinor),
      forecastBalanceMinor: forecastBalance,
      items: relevantItems.filter(i => i.expectedDate >= asOfDate && i.expectedDate <= targetDate)
    };
  }
}
