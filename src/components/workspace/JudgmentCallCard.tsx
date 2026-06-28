import { useState } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import type { AnomalyFlag } from '../../types/anomaly';
import { ANOMALY_PLAIN_LANGUAGE } from '../../lib/anomalyLabels';
import { generateId } from '../../lib/utils';
import { Button } from '../shared/Button';
import { useFlagSuggestion } from './useFlagSuggestion';

const JUDGMENT_OPTIONS = [
  { id: 'no-reading', label: 'Instrument could not get a reading', value: null as string | number | null, type: 'exclude_value' as const },
  { id: 'contaminated', label: 'Sample was contaminated — exclude', value: null, type: 'exclude_value' as const },
  { id: 'edge-case', label: 'Valid edge case — keep as-is', value: '', type: 'impute_value' as const },
  { id: 'blank', label: 'Intentionally left blank', value: '', type: 'impute_value' as const },
  { id: 'follow-up', label: 'Flag row for follow-up (adds QC_Flag on export)', value: 'QC', type: 'flag_for_review' as const },
  { id: 'ack', label: 'Acknowledge and continue — no change needed', value: null, type: 'flag_for_review' as const },
];

interface JudgmentCallCardProps {
  flag: AnomalyFlag;
  hideAutoSuggestion?: boolean;
}

export function JudgmentCallCard({ flag, hideAutoSuggestion = false }: JudgmentCallCardProps) {
  const resolveFlag = useBioBridgeStore((s) => s.resolveFlag);
  const applySuggestion = useBioBridgeStore((s) => s.applySuggestion);
  const startInteraction = useBioBridgeStore((s) => s.startInteraction);
  const suggestion = useFlagSuggestion(flag);
  const currentActor = useBioBridgeStore((s) => s.currentActor);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (flag.resolved || flag.type !== 'missing_value') return null;

  const isAmbiguous = flag.detail === 'ambiguous_whitespace';
  const plain = ANOMALY_PLAIN_LANGUAGE.missing_value;
  const selected = JUDGMENT_OPTIONS.find((o) => o.id === selectedId);

  const applySelected = () => {
    if (!selected) return;
    startInteraction();
    const now = new Date().toISOString();
    resolveFlag(flag.id, {
      id: generateId('action'),
      type: selected.type,
      target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
      beforeValues: [isAmbiguous ? ' ' : null],
      afterValue: selected.value,
      reason: selected.label,
      actor: currentActor,
      timestampStart: now,
      timestampEnd: now,
    });
    setSelectedId(null);
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

      {suggestion && !hideAutoSuggestion && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-900">Recommended: {suggestion.title}</p>
          <p className="text-xs text-emerald-800">{suggestion.description}</p>
          <Button className="mt-2" onClick={() => applySuggestion(suggestion)}>
            Apply suggested fix
          </Button>
        </div>
      )}
      {suggestion && hideAutoSuggestion && suggestion.autoApplicable && (
        <p className="mt-3 text-xs text-emerald-700">Auto-fix available in Suggestions above.</p>
      )}

      <fieldset className="mt-3 space-y-2">
        <legend className="sr-only">Resolution options</legend>
        {JUDGMENT_OPTIONS.map((option) => (
          <label key={option.id} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={`judgment-${flag.id}`}
              checked={selectedId === option.id}
              onChange={() => setSelectedId(option.id)}
              className="text-brand-600 focus:ring-brand-500"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <Button className="mt-3" disabled={!selectedId} onClick={applySelected}>
        Confirm selection
      </Button>
    </div>
  );
}
