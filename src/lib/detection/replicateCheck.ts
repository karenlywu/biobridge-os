import type { Dataset } from '../../types/dataset';
import type { ProtocolTemplate } from '../../types/protocol';
import type { AnomalyFlag } from '../../types/anomaly';
import { generateId } from '../utils';

function findColumn(dataset: Dataset, patterns: RegExp[]): string | undefined {
  return dataset.columns.find((c) => patterns.some((p) => p.test(c.name)))?.name;
}

function replicateGroupKey(
  row: Record<string, string | number | null>,
  groupCols: string[],
): string {
  return groupCols.map((c) => String(row[c] ?? 'unknown')).join('::');
}

export function replicateCheck(
  dataset: Dataset,
  activeProtocol: ProtocolTemplate | null,
): AnomalyFlag[] {
  const treatmentCol = findColumn(dataset, [
    /treatment/i,
    /condition/i,
    /group/i,
    /compound/i,
  ]);
  const geneCol = findColumn(dataset, [/gene/i, /symbol/i, /target/i]);
  const replicateCol = findColumn(dataset, [/replicate/i, /rep/i]);

  if (!treatmentCol && !geneCol) return [];

  const groupCols = geneCol && treatmentCol ? [geneCol, treatmentCol] : [treatmentCol ?? geneCol!];

  const protocolRule = activeProtocol?.columnRules.find(
    (r) => r.columnName === treatmentCol || r.columnName === geneCol,
  );
  const expectedFromProtocol = protocolRule?.expectedReplicateCount;

  const counts = new Map<string, number>();
  dataset.rows.forEach((row) => {
    const key = replicateGroupKey(row, groupCols);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  let expectedCount: number | null = expectedFromProtocol ?? null;

  if (expectedCount === null && counts.size > 0) {
    const freq = [...counts.values()];
    expectedCount = freq.sort((a, b) =>
      freq.filter((v) => v === b).length - freq.filter((v) => v === a).length,
    )[0];
  }

  if (expectedCount === null || expectedCount <= 1) return [];

  const shortGroups: string[] = [];
  counts.forEach((count, group) => {
    if (count < expectedCount) shortGroups.push(group);
  });

  if (!shortGroups.length) return [];

  const affectedIndices: number[] = [];
  dataset.rows.forEach((row, index) => {
    const key = replicateGroupKey(row, groupCols);
    if (shortGroups.includes(key)) affectedIndices.push(index);
  });

  return [{
    id: generateId('anomaly'),
    type: 'missing_replicate',
    columnName: replicateCol ?? groupCols.join(' + '),
    affectedRowIndices: affectedIndices,
    detectionSource: expectedFromProtocol ? 'schema' : 'heuristic',
    suggestedResolution: `Expected ${expectedCount} replicates per ${groupCols.join(' × ')}`,
    resolved: false,
    variantValues: shortGroups,
  }];
}
