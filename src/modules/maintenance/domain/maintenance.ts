export type SystemHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export type DatabaseClassification =
  | 'referenced'
  | 'archived-referenced'
  | 'orphan-historical'
  | 'orphan-partial-restore'
  | 'orphan-recoverable'
  | 'legacy'
  | 'unknown';

export interface DatabaseInfo {
  name: string;
  classification: DatabaseClassification;
  isDeletable: boolean;
  businessId?: string;
  deletionReason?: string;
}

export interface MaintenanceLog {
  id: string;
  action: 'DIAGNOSTIC' | 'DELETE' | 'RECOVER';
  databaseName?: string;
  timestamp: string;
  result: 'SUCCESS' | 'ERROR';
  details?: string;
}

export interface StorageEstimate {
  usageBytes: number;
  quotaBytes: number;
  available: boolean;
}

export interface DiagnosticResult {
  status: SystemHealthStatus;
  activeCount: number;
  archivedCount: number;
  accessibleDatabases: string[];
  missingDatabases: string[];
  orphanDatabases: DatabaseInfo[];
  isRestoreInterrupted: boolean;
  isIndexedDBSupported: boolean;
}
