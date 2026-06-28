import { useEffect, useMemo, useState } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import {
  buildSuggestions,
  buildIngestionWarnings,
} from '../../lib/suggestions/buildSuggestions';
import { detectBatchNamingDrift } from '../../lib/suggestions/batchNamingDrift';
import type { CleaningSuggestion } from '../../types/suggestion';
import { Button } from '../shared/Button';
import { Chip } from '../shared/Chip';

const CONFIDENCE_STYLE = {
  high: 'border-emerald-200 bg-emerald-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-slate-200 bg-slate-50',
};

function SuggestionRow({
  suggestion,
  onApply,
}: {
  suggestion: CleaningSuggestion;
  onApply: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${CONFIDENCE_STYLE[suggestion.confidence]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-900">{suggestion.title}</p>
            <Chip color={suggestion.autoApplicable ? 'brand' : 'default'}>
              {suggestion.confidence} confidence
            </Chip>
            {suggestion.autoApplicable && <Chip color="brand">Auto-fix OK</Chip>}
          </div>
          <p className="mt-1 text-xs text-slate-600">{suggestion.description}</p>
          {suggestion.batchContext && (
            <p className="mt-1 text-xs text-violet-700">
              Across batches: {suggestion.batchContext}
            </p>
          )}
        </div>
        <Button onClick={onApply}>Apply</Button>
      </div>
      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {suggestion.alternatives.map((alt) => (
            <Button
              key={alt.label}
              variant="ghost"
              onClick={() =>
                useBioBridgeStore.getState().applySuggestion({ ...suggestion, action: alt.action })
              }
            >
              {alt.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SuggestionsPanel({ embedded = false }: { embedded?: boolean }) {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const flags = useBioBridgeStore((s) => s.anomalyFlags);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const applySuggestion = useBioBridgeStore((s) => s.applySuggestion);
  const applyAllAutoSuggestions = useBioBridgeStore((s) => s.applyAllAutoSuggestions);

  const [isApplying, setIsApplying] = useState(false);
  const [bulkComplete, setBulkComplete] = useState<{ applied: number } | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const successShell = embedded
    ? 'rounded-lg border border-emerald-200 bg-emerald-50/80 p-4'
    : 'rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm';
  const mainShell = embedded
    ? ''
    : 'rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm';

  useEffect(() => {
    setBulkComplete(null);
    setExpanded(true);
    setDismissed(false);
    setIsApplying(false);
  }, [dataset?.id]);

  const { suggestions, autoCount, batchDrift, warnings, unresolved } = useMemo(() => {
    if (!dataset) {
      return { suggestions: [], autoCount: 0, batchDrift: [], warnings: [], unresolved: 0 };
    }
    const protocol = protocols.find((p) => p.id === activeProtocolId) ?? null;
    const built = buildSuggestions({ dataset, flags, protocol });
    const unres = flags.filter((f) => !f.resolved).length;
    return {
      suggestions: built,
      autoCount: built.filter((s) => s.autoApplicable).length,
      batchDrift: detectBatchNamingDrift(dataset),
      warnings: buildIngestionWarnings(dataset),
      unresolved: unres,
    };
  }, [dataset, flags, protocols, activeProtocolId]);

  if (!dataset || dismissed) return null;

  if (unresolved === 0 && !bulkComplete) return null;

  const handleApplyAll = async () => {
    setIsApplying(true);
    setBulkComplete(null);
    await new Promise((r) => setTimeout(r, 0));
    const applied = applyAllAutoSuggestions();
    setIsApplying(false);

    if (applied > 0) {
      setBulkComplete({ applied });
      setExpanded(false);
    }
  };

  const remainingAfterBulk = bulkComplete
    ? flags.filter((f) => !f.resolved).length
    : unresolved;

  if (bulkComplete && !expanded) {
    return (
      <div
        role="status"
        className={successShell}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-emerald-900">
              ✓ Applied {bulkComplete.applied} safe fix{bulkComplete.applied !== 1 ? 'es' : ''}
            </p>
            <p className="mt-0.5 text-sm text-emerald-800">
              {remainingAfterBulk === 0
                ? 'All automatic fixes are complete. Review the cleaning studio or export when ready.'
                : `${remainingAfterBulk} item${remainingAfterBulk !== 1 ? 's' : ''} still need your review in the cleaning studio below.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.length > 0 && (
              <Button variant="secondary" onClick={() => setExpanded(true)}>
                Show remaining suggestions
              </Button>
            )}
            <Button variant="ghost" onClick={() => setDismissed(true)}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (unresolved === 0 && bulkComplete) {
    return (
      <div
        role="status"
        className={successShell}
      >
        <p className="font-semibold text-emerald-900">
          ✓ Applied {bulkComplete.applied} safe fix{bulkComplete.applied !== 1 ? 'es' : ''} — all
          automatic issues resolved
        </p>
        <Button className="mt-2" variant="ghost" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    );
  }

  return (
    <div className={mainShell}>
      {bulkComplete && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          ✓ Applied {bulkComplete.applied} safe fix{bulkComplete.applied !== 1 ? 'es' : ''}.
          {autoCount === 0
            ? ' No more auto-fixes — review items below or in the cleaning studio.'
            : ` ${autoCount} more auto-fix${autoCount !== 1 ? 'es' : ''} available.`}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!embedded && <h3 className="font-semibold text-slate-900">Suggested fixes</h3>}
          <p className={`text-sm text-slate-600 ${embedded ? '' : ''}`}>
            {suggestions.length} recommendation{suggestions.length !== 1 ? 's' : ''} —{' '}
            {autoCount} can be applied automatically
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {autoCount > 0 && (
            <Button onClick={() => void handleApplyAll()} disabled={isApplying}>
              {isApplying ? 'Applying…' : `Apply all safe fixes (${autoCount})`}
            </Button>
          )}
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2">
          {warnings.map((w) => (
            <p key={w} className="text-xs text-amber-900">
              ⚠ {w}
            </p>
          ))}
        </div>
      )}

      {batchDrift.length > 0 && (
        <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
          <p className="text-sm font-medium text-violet-900">Multi-batch naming drift detected</p>
          {batchDrift.map((d) => (
            <p key={d.columnName} className="mt-1 text-xs text-violet-800">
              {d.explanation} Suggested: <strong>{d.suggestedCanonical}</strong>
            </p>
          ))}
        </div>
      )}

      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
        {suggestions.map((s) => (
          <SuggestionRow key={s.id} suggestion={s} onApply={() => applySuggestion(s)} />
        ))}
        {suggestions.length === 0 && (
          <p className="text-sm text-slate-500">
            No automated suggestions — use the cards below for judgment calls.
          </p>
        )}
      </div>
    </div>
  );
}
