import type { Dataset } from '../../types/dataset';
import type { BatchDriftGroup } from '../../types/suggestion';
import { normalizeKey } from '../utils';
import {
  isControlLike,
  pickCanonicalForm,
  semanticBucket,
} from './canonicalSuggestions';

function findTreatmentColumn(dataset: Dataset): string | undefined {
  return dataset.columns.find((c) =>
    /treatment|condition|group|inducer|compound/i.test(c.name),
  )?.name;
}

function findBatchColumn(dataset: Dataset): string | undefined {
  return dataset.columns.find((c) => c.role === 'batch' || /batch|run_day|export_day|day/i.test(c.name))
    ?.name;
}

/** Cross-batch semantic drift: Ctrl on Day1, Vehicle on Day5 — same biology, different labels */
export function detectBatchNamingDrift(dataset: Dataset): BatchDriftGroup[] {
  const treatmentCol = findTreatmentColumn(dataset);
  const batchCol = findBatchColumn(dataset);
  if (!treatmentCol || !batchCol) return [];

  const semanticGroups = new Map<string, Map<string, Set<string>>>();

  dataset.rows.forEach((row) => {
    const treatment = String(row[treatmentCol] ?? '');
    const batch = String(row[batchCol] ?? 'unknown');
    if (!treatment.trim()) return;

    const bucket = semanticBucket(treatment);
    if (!semanticGroups.has(bucket)) semanticGroups.set(bucket, new Map());
    const batchMap = semanticGroups.get(bucket)!;
    if (!batchMap.has(batch)) batchMap.set(batch, new Set());
    batchMap.get(batch)!.add(treatment);
  });

  const groups: BatchDriftGroup[] = [];

  semanticGroups.forEach((batchMap, bucket) => {
    const allVariants = [...new Set([...batchMap.values()].flatMap((s) => [...s]))];
    if (allVariants.length <= 1) return;

    const normalizeKeys = new Set(allVariants.map(normalizeKey));
    if (normalizeKeys.size <= 1) return;

    const suggestedCanonical = pickCanonicalForm(allVariants);
    const batchBreakdown = [...batchMap.entries()].map(([batch, labels]) => ({
      batch,
      labels: [...labels],
    }));

    const isControlDrift = bucket === '__control__' || allVariants.every(isControlLike);

    groups.push({
      columnName: treatmentCol,
      variants: allVariants,
      suggestedCanonical,
      batchBreakdown,
      explanation: isControlDrift
        ? `Different lab members labeled the control differently across batches (${allVariants.join(', ')}). Recommend standardizing to "${suggestedCanonical}".`
        : `The same condition was spelled ${allVariants.length} different ways across export days. One label will prevent silent groupby splits.`,
    });
  });

  return groups;
}

export function detectCrossBatchCasingFlags(
  dataset: Dataset,
  treatmentCol: string,
): Map<string, string[]> {
  const batchCol = findBatchColumn(dataset);
  if (!batchCol) return new Map();

  const bySemantic = new Map<string, Set<string>>();
  dataset.rows.forEach((row) => {
    const t = String(row[treatmentCol] ?? '');
    if (!t) return;
    const bucket = semanticBucket(t);
    if (!bySemantic.has(bucket)) bySemantic.set(bucket, new Set());
    bySemantic.get(bucket)!.add(t);
  });

  const result = new Map<string, string[]>();
  bySemantic.forEach((variants, bucket) => {
    if (variants.size > 1) result.set(bucket, [...variants]);
  });
  return result;
}
