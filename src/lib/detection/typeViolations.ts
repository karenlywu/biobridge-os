import type { Column } from '../../types/dataset';
import type { AnomalyFlag } from '../../types/anomaly';
import { generateId } from '../utils';

const NON_NUMERIC_PATTERNS = [
  'ND', 'N/A', 'NA', '--', '#REF!', 'N.D.', 'N.D',
  'LOW_QUALITY', 'ERROR', 'UNDETERMINED', '<LOD', 'LOD',
  'FAILED', 'SATURATED', 'OVERFLOW',
];

export function typeViolationDetect(column: Column): AnomalyFlag[] {
  if (column.inferredType === 'identifier') return [];

  const indices: number[] = [];
  column.values.forEach((value, rowIndex) => {
    if (value === null || value === '') return;
    if (typeof value === 'number') return;

    const str = String(value).trim();
    if (NON_NUMERIC_PATTERNS.some((p) => str.toUpperCase() === p.toUpperCase())) {
      indices.push(rowIndex);
      return;
    }

    if (column.inferredType === 'numeric' && Number.isNaN(Number(str))) {
      indices.push(rowIndex);
    }
  });

  if (!indices.length) return [];

  return [{
    id: generateId('anomaly'),
    type: 'numeric_type_violation',
    columnName: column.name,
    affectedRowIndices: indices,
    detectionSource: 'heuristic',
    resolved: false,
  }];
}
