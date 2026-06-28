import type { AnomalyFlag } from '../types/anomaly';
import type { CleaningAction } from '../types/action';
import type { ProtocolTemplate } from '../types/protocol';
import { normalizeKey } from './utils';
import type { PendingPromotion } from '../types/promotion';

/** Values that differ from the merge target (excludes the canonical form). */
export function novelVariantsFromMerge(
  canonical: string,
  flag: AnomalyFlag,
  action: CleaningAction,
): string[] {
  const pool = [
    ...(flag.variantValues ?? []),
    ...action.beforeValues.map(String),
  ];
  const seen = new Set<string>();
  const novel: string[] = [];

  for (const v of pool) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    const key = normalizeKey(trimmed);
    if (key === normalizeKey(canonical)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    novel.push(trimmed);
  }

  return novel;
}

export function derivePromotionPair(
  flag: AnomalyFlag,
  action: CleaningAction,
  protocol: ProtocolTemplate | null,
): PendingPromotion | null {
  if (action.type !== 'merge_cluster') return null;
  if (flag.detectionSource !== 'schema' || flag.type !== 'schema_violation') return null;

  const canonical = String(action.afterValue);
  const novel = novelVariantsFromMerge(canonical, flag, action);
  const variant = novel[0] ?? flag.variantValues?.[0]?.trim() ?? '';

  if (!variant || normalizeKey(variant) === normalizeKey(canonical)) return null;

  const rule = protocol?.columnRules.find((r) => r.columnName === flag.columnName);
  if (rule?.allowedValues?.some((a) => normalizeKey(a) === normalizeKey(variant))) return null;
  if (rule?.knownVariants && variant in rule.knownVariants) return null;

  return {
    variant,
    canonical,
    columnName: flag.columnName,
    flagId: flag.id,
  };
}

export function mergeBeforeValues(
  flag: AnomalyFlag,
  canonical: string,
): string[] {
  const variants = flag.variantValues ?? [];
  const novel = variants.filter((v) => normalizeKey(String(v)) !== normalizeKey(canonical));
  if (novel.length) return novel.map(String);
  if (variants.length) return [String(variants[0])];
  return [canonical];
}
