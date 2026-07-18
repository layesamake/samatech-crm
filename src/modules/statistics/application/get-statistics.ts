import type { Clock } from '@/modules/follow-ups/domain/follow-up';
import { SystemClock } from '@/modules/follow-ups/domain/follow-up';
import { calculateStatistics, localDateKey, PeriodPreset, resolveStatisticsPeriod, STATISTICS_TIMEZONE, StatisticsReport } from '../domain/statistics';
import { DexieStatisticsReadRepository, StatisticsReadRepository } from '../infrastructure/dexie-statistics-read-repository';

export interface GetStatisticsInput { preset?: PeriodPreset; from?: string; to?: string; includeArchivedProducts?: boolean; }

export class GetStatisticsUseCase {
  constructor(private readonly repository: StatisticsReadRepository = new DexieStatisticsReadRepository(), private readonly clock: Clock = new SystemClock()) {}

  async execute(input: GetStatisticsInput = {}): Promise<StatisticsReport> {
    const today = localDateKey(this.clock.now(), STATISTICS_TIMEZONE);
    if (!today) throw new Error('Impossible de déterminer la date locale');
    const snapshot = await this.repository.loadSnapshot();
    const period = resolveStatisticsPeriod(input.preset ?? 'CURRENT_MONTH', today, STATISTICS_TIMEZONE, input.from, input.to);
    return calculateStatistics(snapshot.data, { period, today, primaryCurrency: snapshot.primaryCurrency, primaryCurrencyScale: snapshot.primaryCurrencyScale, includeArchivedProducts: input.includeArchivedProducts });
  }
}
