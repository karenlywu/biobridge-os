import type { AnomalyFlag } from '../../types/anomaly';
import type { CleaningAction } from '../../types/action';
import type { BuildSuggestionContext, CleaningSuggestion } from '../../types/suggestion';
import { generateId, DEFAULT_ACTOR, normalizeKey } from '../utils';
import {
  confidenceFromVariants,
  fuzzyMatchAllowed,
  pickCanonicalForm,
} from './canonicalSuggestions';
import { mergeBeforeValues } from '../promotion';
import { detectBatchNamingDrift } from './batchNamingDrift';

const NUMERIC_EXCLUDE = /^(ERROR|FAILED|LOW_QUALITY|SATURATED|OVERFLOW|#REF!)$/i;
const NUMERIC_ZERO = /^(<LOD|LOD|ND|N\.D\.|N\.D)$/i;
const NUMERIC_REVIEW = /^(N\/A|NA|UNDETERMINED|--)$/i;

function nowIso() {
  return new Date().toISOString();
}

function mergeAction(
  flag: AnomalyFlag,
  canonical: string,
  reason: string,
): CleaningAction {
  return {
    id: generateId('action'),
    type: 'merge_cluster',
    target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
    beforeValues: mergeBeforeValues(flag, canonical),
    afterValue: canonical,
    reason,
    actor: DEFAULT_ACTOR,
    timestampStart: nowIso(),
    timestampEnd: nowIso(),
  };
}

function numericSuggestion(flag: AnomalyFlag, dataset: BuildSuggestionContext['dataset']): CleaningSuggestion | null {
  const samples = flag.affectedRowIndices
    .slice(0, 8)
    .map((i) => String(dataset.rows[i]?.[flag.columnName] ?? ''));

  let title = 'Exclude non-numeric values';
  let description = `Replace instrument codes (${samples.slice(0, 3).join(', ')}) with blank for analysis.`;
  let confidence: CleaningSuggestion['confidence'] = 'medium';
  let autoApplicable = false;
  let action: CleaningAction = {
    id: generateId('action'),
    type: 'exclude_value',
    target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
    beforeValues: samples,
    afterValue: null,
    reason: 'Instrument error or failed readout — exclude from numeric analysis',
    actor: DEFAULT_ACTOR,
    timestampStart: nowIso(),
    timestampEnd: nowIso(),
  };

  if (samples.every((s) => NUMERIC_EXCLUDE.test(s.trim()))) {
    confidence = 'high';
    autoApplicable = true;
    title = 'Failed readouts → exclude';
    description = `All flagged values (${samples.join(', ')}) look like instrument failures. Safe to exclude.`;
  } else if (samples.every((s) => NUMERIC_ZERO.test(s.trim()))) {
    confidence = 'high';
    autoApplicable = true;
    title = 'Below detection limit → use 0';
    description = 'Values like <LOD or ND typically mean "below detection" — imputing 0 is a common default.';
    action = {
      ...action,
      type: 'impute_value',
      afterValue: 0,
      reason: 'Below detection limit — imputed as zero',
    };
  } else if (samples.every((s) => NUMERIC_REVIEW.test(s.trim()))) {
    confidence = 'medium';
    title = 'Ambiguous missing → flag for review';
    description = 'Undetermined or N/A values need a bench call — suggest flagging rows in QC_Flag column.';
    action = {
      ...action,
      type: 'flag_for_review',
      afterValue: 'QC',
      reason: 'Ambiguous readout — flagged for bench review',
    };
  }

  return {
    id: generateId('suggestion'),
    flagId: flag.id,
    title,
    description,
    confidence,
    autoApplicable,
    action,
    alternatives: [
      {
        label: 'Exclude (NaN)',
        action: { ...action, id: generateId('action'), type: 'exclude_value', afterValue: null },
      },
      {
        label: 'Impute 0',
        action: { ...action, id: generateId('action'), type: 'impute_value', afterValue: 0 },
      },
    ],
  };
}

function clusterSuggestion(
  flag: AnomalyFlag,
  ctx: BuildSuggestionContext,
): CleaningSuggestion | null {
  const variants = flag.variantValues ?? [];
  if (!variants.length && flag.type !== 'whitespace') return null;

  const rule = ctx.protocol?.columnRules.find((r) => r.columnName === flag.columnName);
  const allowed = rule?.allowedValues;

  if (flag.type === 'whitespace') {
    const beforeValues = flag.affectedRowIndices.map(
      (i) => ctx.dataset.rows[i]?.[flag.columnName] ?? null,
    );
    return {
      id: generateId('suggestion'),
      flagId: flag.id,
      title: 'Remove hidden spaces',
      description: `Trim invisible spaces in ${flag.affectedRowIndices.length} cell(s) — one-click fix.`,
      confidence: 'high',
      autoApplicable: true,
      action: {
        id: generateId('action'),
        type: 'merge_cluster',
        target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
        beforeValues,
        afterValue: null,
        reason: 'Trimmed leading/trailing whitespace',
        actor: DEFAULT_ACTOR,
        timestampStart: nowIso(),
        timestampEnd: nowIso(),
      },
    };
  }

  if (flag.type === 'schema_violation') {
    const variant = variants[0] ?? '';
    const matched = allowed ? fuzzyMatchAllowed(variant, allowed) : undefined;
    const canonical = matched ?? pickCanonicalForm([variant, ...(allowed ?? [])], allowed);
    const confidence = matched ? 'high' : 'medium';
    return {
      id: generateId('suggestion'),
      flagId: flag.id,
      title: matched ? `Map "${variant}" → "${matched}"` : `Standardize "${variant}"`,
      description: matched
        ? `Close match to protocol allowed value "${matched}" — likely the same condition.`
        : `Pick the closest protocol label for "${variant}".`,
      confidence,
      autoApplicable: !!matched,
      action: mergeAction(
        flag,
        canonical,
        matched
          ? `Same condition as protocol value "${matched}"`
          : `Mapped novel value to "${canonical}"`,
      ),
      alternatives: (allowed ?? []).slice(0, 4).map((a) => ({
        label: `Use "${a}"`,
        action: mergeAction(flag, a, `Mapped to protocol value "${a}"`),
      })),
    };
  }

  const canonical =
    flag.canonicalValue ??
    flag.suggestedResolution ??
    pickCanonicalForm(variants, allowed);
  const confidence = confidenceFromVariants(variants, canonical);

  return {
    id: generateId('suggestion'),
    flagId: flag.id,
    title: `Merge to "${canonical}"`,
    description: `${variants.length} spellings (${variants.join(', ')}) → one label. ${confidence === 'high' ? 'High confidence — safe to auto-apply.' : 'Review if unsure.'}`,
    confidence,
    autoApplicable: confidence === 'high',
    action: mergeAction(
      flag,
      canonical,
      `Same label spelled different ways — merged to "${canonical}"`,
    ),
    alternatives: [...new Set(variants.filter((v) => v !== canonical))].slice(0, 3).map((v) => ({
      label: `Use "${v}" instead`,
      action: mergeAction(flag, v, `Merged cluster to "${v}"`),
    })),
  };
}

function batchDriftSuggestions(ctx: BuildSuggestionContext): CleaningSuggestion[] {
  const drifts = detectBatchNamingDrift(ctx.dataset);
  const unresolved = ctx.flags.filter((f) => !f.resolved);
  const suggestions: CleaningSuggestion[] = [];

  drifts.forEach((drift) => {
    const matchingFlag = unresolved.find(
      (f) =>
        f.columnName === drift.columnName &&
        (f.type === 'casing_divergence' || f.type === 'schema_violation'),
    );
    if (!matchingFlag) return;

    const rowIndices: number[] = [];
    ctx.dataset.rows.forEach((row, i) => {
      const val = String(row[drift.columnName] ?? '');
      if (drift.variants.includes(val)) rowIndices.push(i);
    });

    suggestions.push({
      id: generateId('suggestion'),
      flagId: matchingFlag.id,
      title: `Batch consolidation: use "${drift.suggestedCanonical}"`,
      description: drift.explanation,
      confidence: 'high',
      autoApplicable: true,
      batchContext: drift.batchBreakdown.map((b) => `${b.batch}: ${b.labels.join('/')}`).join(' · '),
      action: {
        id: generateId('action'),
        type: 'merge_cluster',
        target: { columnName: drift.columnName, rowIndices },
        beforeValues: drift.variants.filter(
          (v) => normalizeKey(v) !== normalizeKey(drift.suggestedCanonical),
        ),
        afterValue: drift.suggestedCanonical,
        reason: `Multi-batch naming drift — standardized ${drift.variants.join(', ')} to "${drift.suggestedCanonical}"`,
        actor: DEFAULT_ACTOR,
        timestampStart: nowIso(),
        timestampEnd: nowIso(),
      },
    });
  });

  return suggestions;
}

function ambiguousBlankSuggestion(flag: AnomalyFlag): CleaningSuggestion {
  return {
    id: generateId('suggestion'),
    flagId: flag.id,
    title: 'Space-only cell → treat as empty',
    description: 'Cell looks blank but contains a space — recommend clearing it.',
    confidence: 'high',
    autoApplicable: true,
    action: {
      id: generateId('action'),
      type: 'exclude_value',
      target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
      beforeValues: [' '],
      afterValue: null,
      reason: 'Space-only cell cleared — treated as missing',
      actor: DEFAULT_ACTOR,
      timestampStart: nowIso(),
      timestampEnd: nowIso(),
    },
  };
}

export function buildSuggestions(ctx: BuildSuggestionContext): CleaningSuggestion[] {
  const unresolved = ctx.flags.filter((f) => !f.resolved);
  const byFlagId = new Map<string, CleaningSuggestion>();

  batchDriftSuggestions(ctx).forEach((s) => byFlagId.set(s.flagId, s));

  unresolved.forEach((flag) => {
    if (byFlagId.has(flag.id)) return;

    if (
      flag.type === 'casing_divergence' ||
      flag.type === 'schema_violation' ||
      flag.type === 'whitespace'
    ) {
      const s = clusterSuggestion(flag, ctx);
      if (s) byFlagId.set(flag.id, s);
    } else if (flag.type === 'numeric_type_violation') {
      const s = numericSuggestion(flag, ctx.dataset);
      if (s) byFlagId.set(flag.id, s);
    } else if (flag.type === 'missing_value' && flag.detail === 'ambiguous_whitespace') {
      byFlagId.set(flag.id, ambiguousBlankSuggestion(flag));
    }
  });

  return [...byFlagId.values()].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });
}

export function buildIngestionWarnings(dataset: BuildSuggestionContext['dataset']): string[] {
  const warnings: string[] = [];

  const headers = dataset.columns.map((c) => c.name);
  if (headers.some((h) => !h.trim())) {
    warnings.push(
      'Empty column headers detected — possible merged cells or multi-row headers in Excel. Consider re-exporting with a single header row.',
    );
  }
  if (headers.filter((h) => /^unnamed|column\d/i.test(h)).length > 0) {
    warnings.push(
      'Unnamed columns found — typical of merged header cells. pd.read_excel often misaligns these columns.',
    );
  }

  const notes = dataset.columns.filter((c) => c.role === 'notes');
  if (notes.length) {
    warnings.push(
      `Notes column "${notes.map((n) => n.name).join(', ')}" detected — will be preserved in all exports.`,
    );
  }

  return warnings;
}
