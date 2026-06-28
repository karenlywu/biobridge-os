import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import type { AnomalyFlag } from '../../types/anomaly';
import { ANOMALY_PLAIN_LANGUAGE } from '../../lib/anomalyLabels';
import { generateId, DEFAULT_ACTOR } from '../../lib/utils';
import { Button } from '../shared/Button';
import { useFlagSuggestion } from './useFlagSuggestion';

const JUDGMENT_OPTIONS = [
  { label: 'Instrument could not get a reading', value: null as string | number | null },
  { label: 'Sample was contaminated — exclude', value: null },
  { label: 'Valid edge case — keep as-is', value: '' },
  { label: 'Intentionally left blank', value: '' },
];

interface JudgmentCallCardProps {
  flag: AnomalyFlag;
}

export function JudgmentCallCard({ flag }: JudgmentCallCardProps) {
  const resolveFlag = useBioBridgeStore((s) => s.resolveFlag);
  const applySuggestion = useBioBridgeStore((s) => s.applySuggestion);
  const startInteraction = useBioBridgeStore((s) => s.startInteraction);
  const suggestion = useFlagSuggestion(flag);

  if (flag.resolved || flag.type !== 'missing_value') return null;

  const isAmbiguous = flag.detail === 'ambiguous_whitespace';
  const plain = ANOMALY_PLAIN_LANGUAGE.missing_value;

  const resolve = (
    reason: string,
    afterValue: string | number | null,
    type: 'impute_value' | 'exclude_value' | 'flag_for_review' = 'impute_value',
  ) => {
    startInteraction();
    const now = new Date().toISOString();
    resolveFlag(flag.id, {
      id: generateId('action'),
      type,
      target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
      beforeValues: [isAmbiguous ? ' ' : null],
      afterValue,
      reason,
      actor: DEFAULT_ACTOR,
      timestampStart: now,
      timestampEnd: now,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="font-semibold text-slate-900">{plain.cardTitle}</h4>
      <p className="mt-1 text-sm text-slate-600">
        {isAmbiguous
          ? `This cell looks empty but contains only a space — Excel won't show it. ${flag.affectedRowIndices.length} cell(s) in "${flag.columnName}" need your judgment.`
          : plain.cardDescription({
              columnName: flag.columnName,
              rowCount: flag.affectedRowIndices.length,
            })}
      </p>

      {suggestion && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-900">Recommended: {suggestion.title}</p>
          <p className="text-xs text-emerald-800">{suggestion.description}</p>
          <Button className="mt-2" onClick={() => applySuggestion(suggestion)}>
            Apply suggested fix
          </Button>
        </div>
      )}

      <fieldset className="mt-3 space-y-2">
        <legend className="sr-only">Resolution options</legend>
        {JUDGMENT_OPTIONS.map((option) => (
          <label key={option.label} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={`judgment-${flag.id}`}
              className="text-brand-600 focus:ring-brand-500"
              onChange={() =>
                resolve(
                  option.label,
                  option.value,
                  option.value === null ? 'exclude_value' : 'impute_value',
                )
              }
            />
            {option.label}
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name={`judgment-${flag.id}`}
            className="text-brand-600 focus:ring-brand-500"
            onChange={() => resolve('Flagged for follow-up', 'QC', 'flag_for_review')}
          />
          Flag row for follow-up (adds QC_Flag on export)
        </label>
      </fieldset>
      <Button
        className="mt-3"
        variant="secondary"
        onClick={() => resolve('Acknowledged — no change needed', null, 'flag_for_review')}
      >
        Acknowledge and continue
      </Button>
    </div>
  );
}
