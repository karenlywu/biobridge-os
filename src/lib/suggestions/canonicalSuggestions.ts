import { normalizeKey } from '../utils';

/** Semantic buckets for wet-lab naming chaos */
const CONTROL_KEYS = new Set([
  'control',
  'ctrl',
  'vehicle',
  'untreated',
  'mock',
  'dmso',
  'baseline',
  'negative',
  'wt',
  'wildtype',
  'wild_type',
  'no_treatment',
  'nt',
]);

const CONTROL_PREFIXES = ['ctrl', 'control', 'vehicle'];

export function isControlLike(value: string): boolean {
  const k = normalizeKey(value);
  if (CONTROL_KEYS.has(k)) return true;
  return CONTROL_PREFIXES.some((p) => k === p || k.startsWith(`${p}_`) || k.startsWith(`${p} `));
}

export function semanticBucket(value: string): string {
  const k = normalizeKey(value);
  if (isControlLike(value)) return '__control__';
  if (/^drug[\s_-]?[a-z0-9]/i.test(value) || k.startsWith('drug')) return '__drug__' + k.replace(/drug[\s_-]?/, '');
  if (k.includes('iptg')) return '__iptg__';
  if (k.includes('inducer') || k.includes('no_inducer') || k.includes('no inducer')) {
    return k.includes('no') ? '__no_inducer__' : '__inducer__';
  }
  return k;
}

/** Preferred display form when merging a cluster */
export function pickCanonicalForm(variants: string[], protocolAllowed?: string[]): string {
  if (protocolAllowed?.length) {
    for (const allowed of protocolAllowed) {
      const match = variants.find((v) => normalizeKey(v) === normalizeKey(allowed));
      if (match) return allowed;
    }
    for (const allowed of protocolAllowed) {
      const fuzzy = variants.find(
        (v) =>
          normalizeKey(v).includes(normalizeKey(allowed)) ||
          normalizeKey(allowed).includes(normalizeKey(v)),
      );
      if (fuzzy) return allowed;
    }
  }

  if (variants.some(isControlLike)) return 'Control';

  const geneLike = variants.every((v) => /^[A-Za-z0-9]+$/.test(v) && v.length <= 12);
  if (geneLike) {
    const upper = variants.find((v) => v === v.toUpperCase() && v.length > 1);
    if (upper) return upper;
    return variants[0].toUpperCase();
  }

  const cellLine = variants.some((v) => /hela/i.test(v));
  if (cellLine) {
    const proper = variants.find((v) => v[0] === 'H' && v.slice(1) === v.slice(1).toLowerCase());
    return proper ?? 'HeLa';
  }

  const freq = new Map<string, number>();
  variants.forEach((v) => freq.set(v, (freq.get(v) ?? 0) + 1));
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);

  const titleCase = sorted.find(([v]) => v[0] === v[0].toUpperCase() && v !== v.toUpperCase());
  if (titleCase) return titleCase[0];

  return sorted[0]?.[0] ?? variants[0];
}

export function fuzzyMatchAllowed(
  variant: string,
  allowedValues: string[],
): string | undefined {
  const vk = normalizeKey(variant);
  for (const allowed of allowedValues) {
    if (normalizeKey(allowed) === vk) return allowed;
  }
  for (const allowed of allowedValues) {
    const ak = normalizeKey(allowed);
    if (vk.includes(ak) || ak.includes(vk)) return allowed;
  }
  if (isControlLike(variant)) {
    const control = allowedValues.find((a) => isControlLike(a));
    if (control) return control;
  }
  return undefined;
}

export function confidenceFromVariants(variants: string[], canonical: string): 'high' | 'medium' | 'low' {
  if (variants.every((v) => normalizeKey(v) === normalizeKey(canonical))) return 'high';
  if (isControlLike(variants[0]!) && variants.every(isControlLike)) return 'high';
  if (variants.length === 2) return 'medium';
  return 'low';
}
