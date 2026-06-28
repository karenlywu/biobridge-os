import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import type { AnomalyFlag } from '../../types/anomaly';
import { ANOMALY_PLAIN_LANGUAGE, getColumnUnits } from '../../lib/anomalyLabels';
import { generateId } from '../../lib/utils';
import { Button } from '../shared/Button';
import { Chip } from '../shared/Chip';
import { useFlagSuggestion } from './useFlagSuggestion';

interface NumericViolationChipProps {
  flag: AnomalyFlag;
  hideAutoSuggestion?: boolean;
}

export function NumericViolationChip({ flag, hideAutoSuggestion = false }: NumericViolationChipProps) {
  const resolveFlag = useBioBridgeStore((s) => s.resolveFlag);
  const applySuggestion = useBioBridgeStore((s) => s.applySuggestion);
  const startInteraction = useBioBridgeStore((s) => s.startInteraction);
  const dataset = useBioBridgeStore((s) => s.dataset);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const currentActor = useBioBridgeStore((s) => s.currentActor);
  const suggestion = useFlagSuggestion(flag);

  if (flag.resolved || !dataset) return null;

  const protocol = protocols.find((p) => p.id === activeProtocolId);
  const plain = ANOMALY_PLAIN_LANGUAGE.numeric_type_violation;
  const units = protocol ? getColumnUnits(flag.columnName, protocol.columnRules) : undefined;

  const sampleValues = flag.affectedRowIndices
    .slice(0, 5)
    .map((i) => dataset.rows[i]?.[flag.columnName]);

  const impute = (value: string | number | null, reason: string) => {
    startInteraction();
    const now = new Date().toISOString();
    resolveFlag(flag.id, {
      id: generateId('action'),
      type: value === null ? 'exclude_value' : 'impute_value',
      target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
      beforeValues: sampleValues,
      afterValue: value,
      reason,
      actor: currentActor,
      timestampStart: now,
      timestampEnd: now,
    });
  };

  const flagForReview = (reason: string) => {
    startInteraction();
    const now = new Date().toISOString();
    resolveFlag(flag.id, {
      id: generateId('action'),
      type: 'flag_for_review',
      target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
      beforeValues: sampleValues,
      afterValue: 'QC',
      reason,
      actor: currentActor,
      timestampStart: now,
      timestampEnd: now,
    });
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip color="warning">{flag.columnName}</Chip>
        <Chip color="warning">{plain.pillLabel}</Chip>
      </div>
      <p className="mt-2 text-sm font-medium text-amber-900">{plain.cardTitle}</p>
      <p className="text-sm text-amber-800">
        {plain.cardDescription({
          columnName: flag.columnName,
          rowCount: flag.affectedRowIndices.length,
          units,
        })}
      </p>
      <p className="mt-1 text-xs text-amber-700">
        Found: {sampleValues.map(String).join(', ')}
      </p>

      {suggestion && !hideAutoSuggestion && (
        <div className="mt-2 rounded border border-emerald-300 bg-emerald-50/80 p-2">
          <p className="text-sm font-medium text-emerald-900">Recommended: {suggestion.title}</p>
          <p className="text-xs text-emerald-800">{suggestion.description}</p>
          <Button className="mt-2" onClick={() => applySuggestion(suggestion)}>
            Apply suggested fix
          </Button>
        </div>
      )}
      {suggestion && hideAutoSuggestion && suggestion.autoApplicable && (
        <p className="mt-2 text-xs text-emerald-700">
          Auto-fix available in Suggestions above.
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => impute(null, 'Instrument could not get a reading — exclude from analysis')}
        >
          No valid reading — exclude
        </Button>
        <Button variant="secondary" onClick={() => impute(0, 'Treat as zero (below detection limit)')}>
          Below detection — use 0
        </Button>
        <Button
          variant="secondary"
          onClick={() => flagForReview('Needs bench review — added QC_Flag')}
        >
          Flag for follow-up (QC column)
        </Button>
      </div>
    </div>
  );
}
