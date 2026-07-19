import { DexieTreasuryRepository } from '../infrastructure/dexie-treasury-repository';
import { calculateTreasuryBalance, TreasuryAccountRecord, TreasuryAccountType } from '../domain/treasury';
import { db } from '../../../infrastructure/database/db';

export interface CreateAccountDTO {
  name: string;
  type: TreasuryAccountType;
  currency: string;
  currencyScale: number;
  openingBalanceMinor: number;
  openingDate: string;
  note?: string;
}

export interface TreasuryAccountWithBalance extends TreasuryAccountRecord {
  balanceMinor: number;
}

export class ManageTreasuryAccountsUseCase {
  constructor(private readonly repository: DexieTreasuryRepository) {}

  async createAccount(dto: CreateAccountDTO): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    if (dto.openingBalanceMinor < 0) {
      throw new Error('Le solde initial ne peut pas être négatif.');
    }
    
    const account: TreasuryAccountRecord = {
      id,
      name: dto.name.trim(),
      normalizedName: dto.name.trim().toLowerCase().replace(/[^a-z0-9]/g, ''),
      type: dto.type,
      currency: dto.currency,
      currencyScale: dto.currencyScale,
      openingBalanceMinor: dto.openingBalanceMinor,
      openingDate: dto.openingDate,
      note: dto.note,
      createdAt: now,
      updatedAt: now
    };

    if (!account.name) throw new Error('Le nom du compte est obligatoire.');
    await this.repository.saveAccount(account);
    return id;
  }

  async getAccount(id: string): Promise<TreasuryAccountRecord | undefined> {
    return await this.repository.getAccount(id);
  }

  async listAccountsWithBalance(asOfDate?: string): Promise<TreasuryAccountWithBalance[]> {
    const accounts = await this.repository.listAccounts(false);
    const result: TreasuryAccountWithBalance[] = [];
    const targetDate = asOfDate || new Date().toISOString();

    for (const acc of accounts) {
      const rawAllocations = await this.repository.listAllocationsForAccount(acc.id);
      const operations = await this.repository.listOperations(acc.id);

      const allocationsWithAmounts = [];
      for (const a of rawAllocations) {
        if (a.sourceType === 'PAYMENT') {
          const p = await db.payments.get(a.sourceId);
          if (p && p.currency === acc.currency && p.currencyScale === acc.currencyScale) {
            allocationsWithAmounts.push({
              allocation: a,
              sourceAmountMinor: p.amountMinor,
              sourceDate: p.paymentDate
            });
          }
        } else if (a.sourceType === 'EXPENSE') {
          const e = await db.expenses.get(a.sourceId);
          if (e && e.currency === acc.currency && e.currencyScale === acc.currencyScale) {
            allocationsWithAmounts.push({
              allocation: a,
              sourceAmountMinor: e.amountMinor,
              sourceDate: e.expenseDate
            });
          }
        }
      }

      const balance = calculateTreasuryBalance(acc, allocationsWithAmounts, operations, targetDate);
      result.push({ ...acc, balanceMinor: balance });
    }
    
    return result;
  }
}
