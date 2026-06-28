import type { AnomalyType } from '../types/anomaly';

/** Biologist-facing copy — no data-engineering jargon */
export interface AnomalyPlainLanguage {
  pillLabel: string;
  cardTitle: string;
  cardDescription: (ctx: AnomalyLabelContext) => string;
  technicalTerm: string;
}

export interface AnomalyLabelContext {
  columnName: string;
  rowCount: number;
  variants?: string[];
  protocolName?: string;
  units?: string;
}

const geneLike = (col: string) =>
  /gene|symbol|protein|target|actb|gapdh/i.test(col);

const treatmentLike = (col: string) =>
  /treatment|condition|group|sample|inducer|compound/i.test(col);

export const ANOMALY_PLAIN_LANGUAGE: Record<AnomalyType, AnomalyPlainLanguage> = {
  casing_divergence: {
    pillLabel: 'Same label, different spelling',
    cardTitle: 'These look like the same thing — spelled differently',
    cardDescription: ({ columnName, rowCount, variants }) => {
      const hint = geneLike(columnName)
        ? 'Same gene/protein written with different capitalization — if left alone, analysis will treat them as separate groups.'
        : treatmentLike(columnName)
          ? 'Same treatment or condition typed different ways — biologically the same, but scripts see them as different.'
          : 'Same category written in multiple ways across the file.';
      return `${hint} Found in ${rowCount} rows${variants?.length ? `: ${variants.slice(0, 4).join(', ')}${variants.length > 4 ? '…' : ''}` : ''}.`;
    },
    technicalTerm: 'Categorical normalization (fuzzy cluster)',
  },
  schema_violation: {
    pillLabel: 'Not in protocol',
    cardTitle: 'Value not recognized by your assay protocol',
    cardDescription: ({ columnName, protocolName, rowCount }) =>
      `"${columnName}" has ${rowCount} value(s) that aren't in ${protocolName ?? 'the active protocol'}. This isn't necessarily wrong — it may be a new variant worth adding.`,
    technicalTerm: 'Schema validation failure',
  },
  numeric_type_violation: {
    pillLabel: 'Number expected, text found',
    cardTitle: 'This cell should be a number — but it isn\'t',
    cardDescription: ({ columnName, units }) =>
      `"${columnName}" has entries like ERROR, N/A, or Undetermined mixed with real numbers${units ? ` (expected: ${units})` : ''}. You'll need to decide: exclude, impute, or keep — that's a bench judgment call.`,
    technicalTerm: 'Schema / dtype validation',
  },
  missing_replicate: {
    pillLabel: 'Missing replicate',
    cardTitle: 'Expected replicates — some are missing',
    cardDescription: ({ rowCount }) =>
      `At least one condition has fewer replicates than expected (${rowCount} affected rows). Error bars and paired tests may fail silently if this isn't addressed.`,
    technicalTerm: 'Replicate count check',
  },
  missing_value: {
    pillLabel: 'Empty cell',
    cardTitle: 'Missing value — needs your call',
    cardDescription: ({ columnName, rowCount }) =>
      `${rowCount} empty or ambiguous cell(s) in "${columnName}". Is this a failed readout, intentional skip, or a space that looks blank?`,
    technicalTerm: 'Null / missing value detection',
  },
  whitespace: {
    pillLabel: 'Hidden spaces',
    cardTitle: 'Invisible extra spaces in labels',
    cardDescription: ({ columnName, rowCount }) =>
      `"${columnName}" has ${rowCount} value(s) with leading or trailing spaces. " Control" and "Control" look identical in Excel but split into separate groups in analysis.`,
    technicalTerm: 'Whitespace normalization',
  },
};

export function getColumnUnits(
  columnName: string,
  protocolRules: { columnName: string; units?: string }[],
): string | undefined {
  return protocolRules.find((r) => r.columnName === columnName)?.units;
}

export function getColumnDescription(
  columnName: string,
  protocolRules: { columnName: string; description?: string }[],
): string | undefined {
  return protocolRules.find((r) => r.columnName === columnName)?.description;
}
