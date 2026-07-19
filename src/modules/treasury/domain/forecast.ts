export type TreasuryForecastStatus = 'ACTIVE' | 'ARCHIVED';
export type TreasuryForecastType = 'INFLOW' | 'OUTFLOW';

export interface TreasuryForecastItemRecord {
  id: string;
  type: TreasuryForecastType;
  expectedDate: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  label: string;
  note?: string;
  status: TreasuryForecastStatus;
  createdAt: string;
  updatedAt: string;
}

export function calculateCashForecast(
  currentBalanceMinor: number,
  forecastItems: TreasuryForecastItemRecord[],
  currency: string,
  currencyScale: number,
  asOfDate: string,
  targetDate: string
): number {
  let forecastBalance = BigInt(currentBalanceMinor);

  for (const item of forecastItems) {
    if (item.status !== 'ACTIVE') continue;
    if (item.currency !== currency || item.currencyScale !== currencyScale) continue;
    if (item.expectedDate < asOfDate || item.expectedDate > targetDate) continue;

    if (item.type === 'INFLOW') {
      forecastBalance += BigInt(item.amountMinor);
    } else if (item.type === 'OUTFLOW') {
      forecastBalance -= BigInt(item.amountMinor);
    }
  }

  const MAX_MONEY_MINOR = 9_000_000_000_000_000;
  if (forecastBalance > BigInt(MAX_MONEY_MINOR) || forecastBalance < BigInt(-MAX_MONEY_MINOR)) {
    throw new Error('Le solde prévisionnel dépasse la plage monétaire sûre.');
  }

  return Number(forecastBalance);
}
