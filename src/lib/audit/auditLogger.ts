import type { CleaningAction } from '../../types/action';
import type { AuditEntry } from '../../types/audit';
import { formatAuditTarget } from '../utils';

export function createAuditEntry(
  action: CleaningAction,
  humanInteractionTimeSec: number,
  cpuTimeMs: number,
): AuditEntry {
  const rowIndex = action.target.rowIndices[0] ?? 0;
  const target =
    action.type === 'promote_to_protocol'
      ? `${action.reason.split('"')[1] ?? action.target.columnName}`
      : formatAuditTarget(action.target.columnName, rowIndex);

  return {
    actionId: action.id,
    actionType: action.type,
    target,
    beforeValue: action.beforeValues[0] ?? null,
    afterValue: action.afterValue,
    reason: action.reason,
    actor: action.actor,
    timestampStart: action.timestampStart,
    timestampEnd: action.timestampEnd,
    humanInteractionTimeSec,
    effort: {
      cpuTimeMs,
      estimatedTokenCost: Math.round(cpuTimeMs * 0.002 + humanInteractionTimeSec * 0.05),
      isTokenCostEstimated: true,
    },
  };
}

export function auditTrailToCsv(entries: AuditEntry[]): string {
  const headers = [
    'actionId',
    'actionType',
    'target',
    'beforeValue',
    'afterValue',
    'reason',
    'actor',
    'timestampStart',
    'timestampEnd',
    'humanInteractionTimeSec',
    'cpuTimeMs',
    'estimatedTokenCost',
  ];
  const rows = entries.map((e) =>
    [
      e.actionId,
      e.actionType,
      e.target,
      String(e.beforeValue ?? ''),
      String(e.afterValue ?? ''),
      e.reason,
      e.actor,
      e.timestampStart,
      e.timestampEnd,
      e.humanInteractionTimeSec,
      e.effort.cpuTimeMs,
      e.effort.estimatedTokenCost,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}
