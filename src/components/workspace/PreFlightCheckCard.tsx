import { useMemo } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { ANOMALY_PLAIN_LANGUAGE } from '../../lib/anomalyLabels';
import type { AnomalyType } from '../../types/anomaly';
import { getNotesColumns, getBatchColumn } from '../../lib/parsing/enrichDataset';
import { buildSuggestions } from '../../lib/suggestions/buildSuggestions';

export function PreFlightCheckCard() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const anomalyFlags = useBioBridgeStore((s) => s.anomalyFlags);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);

  const summary = useMemo(() => {
    if (!dataset) return null;
    const unresolved = anomalyFlags.filter((f) => !f.resolved);
    const byType = unresolved.reduce<Partial<Record<AnomalyType, number>>>((acc, f) => {
      acc[f.type] = (acc[f.type] ?? 0) + 1;
      return acc;
    }, {});

    const protocol = protocols.find((p) => p.id === activeProtocolId) ?? null;
    const suggestions = buildSuggestions({ dataset, flags: anomalyFlags, protocol });
    const autoFixCount = suggestions.filter((s) => s.autoApplicable).length;

    return {
      total: unresolved.length,
      byType,
      notesCols: getNotesColumns(dataset),
      batchCol: getBatchColumn(dataset),
      isClean: unresolved.length === 0,
      autoFixCount,
    };
  }, [dataset, anomalyFlags, protocols, activeProtocolId]);

  if (!dataset || !summary) return null;

  const protocol = protocols.find((p) => p.id === activeProtocolId);

  if (summary.isClean) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="font-semibold text-emerald-900">Dataset is clean ✓</p>
        <p className="mt-1 text-sm text-emerald-800">
          No issues detected — safe to export and send to the computational team.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="font-semibold text-amber-900">
        Pre-flight check — {summary.total} issue{summary.total !== 1 ? 's' : ''} before you send
      </p>
      <p className="mt-1 text-sm text-amber-800">
        {activePersonaId === 'elena'
          ? "Fix these now so Marcus doesn't have to Slack you back in three days. Plain-language summary of what we found:"
          : 'Issues Elena would hit on first upload — schema vs heuristic breakdown:'}
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-amber-900">
        {(Object.entries(summary.byType) as [AnomalyType, number][]).map(([type, count]) => (
          <li key={type} className="flex gap-2">
            <span className="font-medium">{count}×</span>
            <span>{ANOMALY_PLAIN_LANGUAGE[type].pillLabel}</span>
          </li>
        ))}
      </ul>
      {summary.notesCols.length > 0 && (
        <p className="mt-3 text-xs text-amber-700">
          Notes column &quot;{summary.notesCols.map((c) => c.name).join(', ')}&quot; will be preserved
          in export — your bench judgments won&apos;t be dropped.
        </p>
      )}
      {summary.batchCol && (
        <p className="mt-1 text-xs text-amber-700">
          Multi-batch file detected ({summary.batchCol.name}) — watch for naming drift across days.
        </p>
      )}
      {protocol && (
        <p className="mt-2 text-xs text-violet-700">
          Checking against protocol: {protocol.name}
        </p>
      )}
      {summary.autoFixCount > 0 && (
        <p className="mt-2 text-sm font-medium text-emerald-800">
          {summary.autoFixCount} fix{summary.autoFixCount !== 1 ? 'es' : ''} can be applied
          automatically — see Suggested fixes below.
        </p>
      )}
    </div>
  );
}
