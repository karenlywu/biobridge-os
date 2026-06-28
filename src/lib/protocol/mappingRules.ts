import type { VariantMappingRule } from '../../types/protocol';
import { normalizeKey } from '../utils';

export function tryMappingRuleMatch(
  value: string,
  rules: VariantMappingRule[],
): { mapsTo: string; rule: VariantMappingRule } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const key = normalizeKey(trimmed);

  for (const rule of rules) {
    const hit = rule.variants.some(
      (v) => v === trimmed || normalizeKey(v) === key,
    );
    if (hit) return { mapsTo: rule.mapsTo, rule };
  }

  return null;
}

export function isVariantCoveredByMappingRules(
  variant: string,
  rules: VariantMappingRule[] | undefined,
): boolean {
  if (!rules?.length) return false;
  return tryMappingRuleMatch(variant, rules) !== null;
}

/** Group flat knownVariants into mapping rules (for loading legacy protocols). */
export function groupKnownVariantsIntoRules(
  knownVariants: Record<string, string>,
): VariantMappingRule[] {
  const byCanonical = new Map<string, string[]>();

  for (const [variant, canonical] of Object.entries(knownVariants)) {
    const list = byCanonical.get(canonical) ?? [];
    list.push(variant);
    byCanonical.set(canonical, list);
  }

  return Array.from(byCanonical.entries()).map(([mapsTo, variants]) => ({
    variants,
    mapsTo,
  }));
}

export function parseVariantList(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of input.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const key = normalizeKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export function normalizeMappingRules(
  rules: VariantMappingRule[],
): VariantMappingRule[] {
  return rules
    .map((rule) => ({
      ...rule,
      mapsTo: rule.mapsTo.trim(),
      label: rule.label?.trim() || undefined,
      variants: parseVariantList(rule.variants.join(', ')),
    }))
    .filter((rule) => rule.mapsTo && rule.variants.length > 0);
}
