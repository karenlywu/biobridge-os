import type { AnomalyFlag } from '../../types/anomaly';
import type { CleaningAction } from '../../types/action';

export function cellKey(rowIndex: number, columnName: string): string {
  return `${rowIndex}:${columnName}`;
}

export function changedCellsFromHistory(actionHistory: CleaningAction[]): Set<string> {
  const set = new Set<string>();
  actionHistory.forEach((action) => {
    if (action.type === 'promote_to_protocol') return;
    action.target.rowIndices.forEach((rowIndex) => {
      set.add(cellKey(rowIndex, action.target.columnName));
    });
  });
  return set;
}

export function flaggedCellsFromFlags(flags: AnomalyFlag[]): Set<string> {
  const set = new Set<string>();
  flags
    .filter((f) => !f.resolved)
    .forEach((flag) => {
      flag.affectedRowIndices.forEach((rowIndex) => {
        set.add(cellKey(rowIndex, flag.columnName));
      });
    });
  return set;
}

export function affectedRowSet(rowIndices: number[]): Set<number> {
  return new Set(rowIndices);
}
