import type { ActionType } from './action';
import type { CellValue } from './dataset';

export interface EffortMetrics {
  cpuTimeMs: number;
  estimatedTokenCost: number;
  isTokenCostEstimated: true;
}

export interface AuditEntry {
  actionId: string;
  actionType: ActionType;
  target: string;
  beforeValue: CellValue;
  afterValue: CellValue;
  reason: string;
  actor: string;
  timestampStart: string;
  timestampEnd: string;
  humanInteractionTimeSec: number;
  effort: EffortMetrics;
}
