import { DexieTreasuryRepository } from '../infrastructure/dexie-treasury-repository';
import { TreasuryOperationRecord, TreasuryAdjustmentDirection, validateTransfer } from '../domain/treasury';

export interface ExecuteTransferDTO {
  sourceAccountId: string;
  destinationAccountId: string;
  amountMinor: number;
  operationDate: string;
  label: string;
  reference?: string;
  note?: string;
}

export interface ExecuteAdjustmentDTO {
  accountId: string;
  adjustmentDirection: TreasuryAdjustmentDirection;
  amountMinor: number;
  operationDate: string;
  label: string;
  reference?: string;
  note?: string;
}

export class ManageTreasuryOperationsUseCase {
  constructor(private readonly repository: DexieTreasuryRepository) {}

  async transfer(dto: ExecuteTransferDTO): Promise<string> {
    const sourceAcc = await this.repository.getAccount(dto.sourceAccountId);
    const destAcc = await this.repository.getAccount(dto.destinationAccountId);

    if (!sourceAcc) throw new Error('Compte source introuvable.');
    if (!destAcc) throw new Error('Compte de destination introuvable.');

    validateTransfer(sourceAcc, destAcc, dto.amountMinor, dto.operationDate);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const operation: TreasuryOperationRecord = {
      id,
      kind: 'TRANSFER',
      sourceAccountId: dto.sourceAccountId,
      destinationAccountId: dto.destinationAccountId,
      amountMinor: dto.amountMinor,
      currency: sourceAcc.currency,
      currencyScale: sourceAcc.currencyScale,
      operationDate: dto.operationDate,
      label: dto.label,
      reference: dto.reference,
      note: dto.note,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    await this.repository.saveOperation(operation);
    return id;
  }

  async adjust(dto: ExecuteAdjustmentDTO): Promise<string> {
    const acc = await this.repository.getAccount(dto.accountId);
    if (!acc) throw new Error('Compte introuvable.');
    if (dto.amountMinor <= 0) throw new Error('Le montant de l\'ajustement doit être strictement positif.');

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const operation: TreasuryOperationRecord = {
      id,
      kind: 'ADJUSTMENT',
      accountId: dto.accountId,
      adjustmentDirection: dto.adjustmentDirection,
      amountMinor: dto.amountMinor,
      currency: acc.currency,
      currencyScale: acc.currencyScale,
      operationDate: dto.operationDate,
      label: dto.label,
      reference: dto.reference,
      note: dto.note,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    await this.repository.saveOperation(operation);
    return id;
  }
}
