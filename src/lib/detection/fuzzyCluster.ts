import type { Column } from '../../types/dataset';
import type { AnomalyFlag } from '../../types/anomaly';
import { generateId, normalizeKey } from '../utils';
import { pickCanonicalForm, semanticBucket } from '../suggestions/canonicalSuggestions';

function buildClusterFlag(
  column: Column,
  indices: number[],
  variants: string[],
  detectionNote?: string,
): AnomalyFlag | null {
  if (variants.length <= 1 || indices.length < 2) return null;

  const canonical = pickCanonicalForm(variants);
  return {
    id: generateId('anomaly'),
    type: 'casing_divergence',
    columnName: column.name,
    affectedRowIndices: indices,
    detectionSource: 'heuristic',
    suggestedResolution: canonical,
    resolved: false,
    variantValues: variants,
    canonicalValue: canonical,
    detail: detectionNote === 'separator' ? 'separator_variant' : undefined,
  };
}

/** Same normalizeKey — casing / punctuation differences */
export function fuzzyClusterDetect(column: Column): AnomalyFlag[] {
  if (column.inferredType !== 'categorical' && column.inferredType !== 'unknown') {
    return [];
  }

  const clusters = new Map<string, number[]>();

  column.values.forEach((value, rowIndex) => {
    if (value === null || value === '') return;
    const key = normalizeKey(String(value));
    const existing = clusters.get(key) ?? [];
    existing.push(rowIndex);
    clusters.set(key, existing);
  });

  const flags: AnomalyFlag[] = [];

  clusters.forEach((indices) => {
    const variants = [...new Set(indices.map((i) => String(column.values[i])))];
    const flag = buildClusterFlag(column, indices, variants);
    if (flag) flags.push(flag);
  });

  return flags;
}

/** Cross-key semantic clusters — Ctrl vs Vehicle vs control across batches */
export function semanticClusterDetect(column: Column): AnomalyFlag[] {
  if (column.inferredType !== 'categorical' && column.inferredType !== 'unknown') {
    return [];
  }

  if (!/treatment|condition|group|inducer|compound|cell_line|cell line/i.test(column.name)) {
    return [];
  }

  const buckets = new Map<string, number[]>();

  column.values.forEach((value, rowIndex) => {
    if (value === null || value === '') return;
    const bucket = semanticBucket(String(value));
    const existing = buckets.get(bucket) ?? [];
    existing.push(rowIndex);
    buckets.set(bucket, existing);
  });

  const flags: AnomalyFlag[] = [];

  buckets.forEach((indices, bucket) => {
    const variants = [...new Set(indices.map((i) => String(column.values[i])))];
    const normalizeKeys = new Set(variants.map(normalizeKey));
    if (normalizeKeys.size <= 1) return;

    const flag = buildClusterFlag(column, indices, variants, bucket === '__control__' ? 'batch_drift' : undefined);
    if (flag) {
      flag.suggestedResolution = pickCanonicalForm(variants);
      flag.canonicalValue = flag.suggestedResolution;
      flags.push(flag);
    }
  });

  return flags;
}

export function detectWhitespace(column: Column): AnomalyFlag[] {
  const indices: number[] = [];
  column.values.forEach((value, rowIndex) => {
    if (value === null) return;
    const str = String(value);
    if (str !== str.trim()) indices.push(rowIndex);
  });

  if (!indices.length) return [];

  return [{
    id: generateId('anomaly'),
    type: 'whitespace',
    columnName: column.name,
    affectedRowIndices: indices,
    detectionSource: 'heuristic',
    suggestedResolution: 'trim',
    resolved: false,
    canonicalValue: 'trim',
  }];
}

export function detectMissingValues(column: Column): AnomalyFlag[] {
  const emptyIndices: number[] = [];
  const ambiguousIndices: number[] = [];

  column.values.forEach((value, rowIndex) => {
    if (value === null || value === '') {
      emptyIndices.push(rowIndex);
    } else if (typeof value === 'string' && value.length > 0 && value.trim() === '') {
      ambiguousIndices.push(rowIndex);
    }
  });

  const flags: AnomalyFlag[] = [];

  if (emptyIndices.length) {
    flags.push({
      id: generateId('anomaly'),
      type: 'missing_value',
      columnName: column.name,
      affectedRowIndices: emptyIndices,
      detectionSource: 'heuristic',
      resolved: false,
      detail: 'empty',
    });
  }

  if (ambiguousIndices.length) {
    flags.push({
      id: generateId('anomaly'),
      type: 'missing_value',
      columnName: column.name,
      affectedRowIndices: ambiguousIndices,
      detectionSource: 'heuristic',
      resolved: false,
      detail: 'ambiguous_whitespace',
    });
  }

  return flags;
}

/** Deduplicate overlapping cluster flags — prefer semantic (broader) clusters */
export function mergeClusterFlags(semantic: AnomalyFlag[], fuzzy: AnomalyFlag[]): AnomalyFlag[] {
  const consumedRows = new Set<string>();
  semantic.forEach((f) => {
    f.affectedRowIndices.forEach((i) => consumedRows.add(`${f.columnName}:${i}`));
  });

  const filteredFuzzy = fuzzy.filter(
    (f) => !f.affectedRowIndices.every((i) => consumedRows.has(`${f.columnName}:${i}`)),
  );

  return [...semantic, ...filteredFuzzy];
}
