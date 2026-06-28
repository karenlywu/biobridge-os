import type { Dataset } from '../../types/dataset';
import type { CleaningAction } from '../../types/action';

/** Restore dataset cells to the values captured in action.beforeValues */
export function restoreActionOnDataset(dataset: Dataset, action: CleaningAction): Dataset {
  const newRows = dataset.rows.map((row) => ({ ...row }));
  const newColumns = dataset.columns.map((col) => ({
    ...col,
    values: [...col.values],
  }));

  action.target.rowIndices.forEach((rowIndex, i) => {
    const col = action.target.columnName;
    const value = action.beforeValues[i] ?? action.beforeValues[0] ?? null;
    const colObj = newColumns.find((c) => c.name === col);
    if (colObj) colObj.values[rowIndex] = value;
    if (newRows[rowIndex]) newRows[rowIndex][col] = value;
  });

  return { ...dataset, rows: newRows, columns: newColumns };
}

export interface UndoRecord {
  action: CleaningAction;
  resolvedFlagId?: string;
  promoteVariant?: { variant: string; columnName: string };
}
