export type TreasuryAccountType = 'CASH' | 'WAVE' | 'ORANGE_MONEY' | 'BANK' | 'OTHER';

export interface TreasuryAccountRecord {
  id: string;
  name: string;
  normalizedName: string;
  type: TreasuryAccountType;
  currency: string;
  currencyScale: number;
  openingBalanceMinor: number;
  openingDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type TreasurySourceType = 'PAYMENT' | 'EXPENSE';
export type TreasuryAllocationStatus = 'ACTIVE' | 'CANCELLED';

export interface TreasuryAllocationRecord {
  id: string;
  sourceType: TreasurySourceType;
  sourceId: string;
  accountId: string;
  status: TreasuryAllocationStatus;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export type TreasuryOperationKind = 'TRANSFER' | 'ADJUSTMENT';
export type TreasuryAdjustmentDirection = 'IN' | 'OUT';
export type TreasuryOperationStatus = 'ACTIVE' | 'CANCELLED';

export interface TreasuryOperationRecord {
  id: string;
  kind: TreasuryOperationKind;
  operationDate: string;
  amountMinor: number;
  currency: string;
  currencyScale: number;
  sourceAccountId?: string;
  destinationAccountId?: string;
  accountId?: string;
  adjustmentDirection?: TreasuryAdjustmentDirection;
  label: string;
  reference?: string;
  note?: string;
  status: TreasuryOperationStatus;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

const MAX_MONEY_MINOR = 9_000_000_000_000_000;

export function calculateTreasuryBalance(
  account: TreasuryAccountRecord,
  allocations: { allocation: TreasuryAllocationRecord; sourceAmountMinor: number; sourceDate: string }[],
  operations: TreasuryOperationRecord[],
  asOfDate: string
): number {
  let balance = BigInt(account.openingBalanceMinor);

  // Mouvements d'affectation
  for (const item of allocations) {
    if (item.allocation.status !== 'ACTIVE') continue;
    if (item.sourceDate < account.openingDate) continue; // Les mouvements antérieurs à l'ouverture n'affectent pas le solde selon la règle de "début de cette date".
    if (item.sourceDate > asOfDate) continue;

    if (item.allocation.sourceType === 'PAYMENT') {
      balance += BigInt(item.sourceAmountMinor);
    } else if (item.allocation.sourceType === 'EXPENSE') {
      balance -= BigInt(item.sourceAmountMinor);
    }
  }

  // Opérations de trésorerie
  for (const op of operations) {
    if (op.status !== 'ACTIVE') continue;
    if (op.operationDate < account.openingDate) continue;
    if (op.operationDate > asOfDate) continue;

    if (op.kind === 'TRANSFER') {
      if (op.destinationAccountId === account.id) {
        balance += BigInt(op.amountMinor);
      } else if (op.sourceAccountId === account.id) {
        balance -= BigInt(op.amountMinor);
      }
    } else if (op.kind === 'ADJUSTMENT') {
      // Pour les ajustements, "accountId" doit correspondre
      if (op.accountId === account.id) {
        if (op.adjustmentDirection === 'IN') {
          balance += BigInt(op.amountMinor);
        } else if (op.adjustmentDirection === 'OUT') {
          balance -= BigInt(op.amountMinor);
        }
      }
    }
  }

  if (balance > BigInt(MAX_MONEY_MINOR) || balance < BigInt(-MAX_MONEY_MINOR)) {
    throw new Error('Le solde dépasse la plage monétaire sûre.');
  }

  return Number(balance);
}

export function validateTransfer(
  sourceAccount: TreasuryAccountRecord,
  destAccount: TreasuryAccountRecord,
  amountMinor: number,
  operationDate: string
) {
  if (sourceAccount.id === destAccount.id) throw new Error('La source et la destination doivent être différentes.');
  if (sourceAccount.currency !== destAccount.currency || sourceAccount.currencyScale !== destAccount.currencyScale) {
    throw new Error('La devise et l\'échelle de la source et destination doivent correspondre.');
  }
  if (amountMinor <= 0) throw new Error('Le montant du transfert doit être strictement positif.');
  if (operationDate < sourceAccount.openingDate || operationDate < destAccount.openingDate) {
    throw new Error('La date du transfert doit être compatible avec la date d\'ouverture des deux comptes.');
  }
}
