import type { VariantRegexRule } from '../../types/protocol';

export function tryRegexVariantMatch(
  value: string,
  rules: VariantRegexRule[],
): { mapsTo: string; rule: VariantRegexRule } | null {
  for (const rule of rules) {
    try {
      const re = new RegExp(rule.pattern, 'i');
      if (re.test(value)) return { mapsTo: rule.mapsTo, rule };
    } catch {
      // invalid pattern — skip
    }
  }
  return null;
}

export function validateRegexPattern(pattern: string): string | null {
  if (!pattern.trim()) return 'Pattern is required';
  try {
    // eslint-disable-next-line no-new
    new RegExp(pattern);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid regex';
  }
}

export function testRegexRules(
  rules: VariantRegexRule[],
  sampleValues: string[],
): Array<{ value: string; mapsTo: string | null; ruleLabel?: string }> {
  return sampleValues.map((value) => {
    const match = tryRegexVariantMatch(value, rules);
    return {
      value,
      mapsTo: match?.mapsTo ?? null,
      ruleLabel: match?.rule.label ?? match?.rule.pattern,
    };
  });
}

/** Built-in examples Marcus can one-click add in Protocol Builder */
export const REGEX_PRESETS: Array<{ label: string; rule: VariantRegexRule }> = [
  {
    label: 'Any ctrl* → Control',
    rule: { pattern: '^ctrl(\\b|_|\\s|$).*', mapsTo: 'Control', label: 'Control abbreviations' },
  },
  {
    label: 'Vehicle / untreated → Control',
    rule: {
      pattern: '^(vehicle|untreated|dmso|mock)$',
      mapsTo: 'Control',
      label: 'Control synonyms',
    },
  },
  {
    label: 'Drug A variants → Drug A',
    rule: {
      pattern: '^drug[\\s_-]?a',
      mapsTo: 'Drug A',
      label: 'Drug A naming',
    },
  },
  {
    label: 'Gene symbol → UPPERCASE',
    rule: {
      pattern: '^[a-zA-Z0-9]+$',
      mapsTo: '__UPPERCASE__',
      label: 'Normalize gene symbols to uppercase',
    },
  },
];
