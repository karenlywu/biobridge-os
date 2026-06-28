import { useMemo } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import type { AnomalyFlag } from '../../types/anomaly';
import { JudgmentCallCard } from './JudgmentCallCard';
import { MissingReplicateBanner } from './MissingReplicateBanner';
import { ClusterCard } from './ClusterCard';
import { AdvancedModeToggle } from './AdvancedModeToggle';

function ManualFlagListItem({
  flag,
  selected,
  onSelect,
}: {
  flag: AnomalyFlag;
  selected: boolean;
  onSelect: () => void;
}) {
  const label =
    flag.type === 'missing_value'
      ? 'Missing or ambiguous value'
      : flag.type === 'missing_replicate'
        ? 'Missing replicate'
        : 'Label cluster — advanced';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-400 ${
        selected
          ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-300'
          : 'border-slate-200 bg-white hover:border-brand-300'
      }`}
    >
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <p className="mt-0.5 text-xs text-slate-600">
        {flag.columnName} · {flag.affectedRowIndices.length} row
        {flag.affectedRowIndices.length !== 1 ? 's' : ''}
      </p>
    </button>
  );
}

export function ManualReviewPanel({
  selectedFlagId,
  onSelectFlag,
}: {
  selectedFlagId: string | null;
  onSelectFlag: (flagId: string | null) => void;
}) {
  const flags = useBioBridgeStore((s) => s.anomalyFlags);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);
  const advancedModeEnabled = useBioBridgeStore((s) => s.advancedModeEnabled);
  const currentActor = useBioBridgeStore((s) => s.currentActor);
  const resolveFlag = useBioBridgeStore((s) => s.resolveFlag);

  const activeProtocol = protocols.find((p) => p.id === activeProtocolId);
  const unresolved = flags.filter((f) => !f.resolved);

  const judgmentFlags = useMemo(
    () =>
      unresolved.filter(
        (f) => f.type === 'missing_value' && f.detail !== 'ambiguous_whitespace',
      ),
    [unresolved],
  );

  const replicateFlag = unresolved.find((f) => f.type === 'missing_replicate');

  const advancedClusterFlags = useMemo(
    () =>
      advancedModeEnabled
        ? unresolved.filter(
            (f) =>
              f.type === 'casing_divergence' ||
              f.type === 'schema_violation' ||
              f.type === 'whitespace',
          )
        : [],
    [unresolved, advancedModeEnabled],
  );

  const listFlags = useMemo(
    () => [...judgmentFlags, ...advancedClusterFlags],
    [judgmentFlags, advancedClusterFlags],
  );

  const selectedFlag = listFlags.find((f) => f.id === selectedFlagId) ?? null;

  if (
    listFlags.length === 0 &&
    !replicateFlag &&
    unresolved.length === 0
  ) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
          All issues resolved — ready to export.
        </div>
      </div>
    );
  }

  if (listFlags.length === 0 && !replicateFlag) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-500">
          No judgment calls right now — use Quick fixes for automated recommendations, or edit
          cells directly in the grid.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Needs your input ({listFlags.length + (replicateFlag ? 1 : 0)})
        </p>
        {activePersonaId === 'marcus' && <AdvancedModeToggle />}
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto p-3 lg:max-h-[28rem]">
        {replicateFlag && (
          <MissingReplicateBanner
            flag={replicateFlag}
            onDismiss={() =>
              resolveFlag(replicateFlag.id, {
                id: `ack_${replicateFlag.id}`,
                type: 'flag_for_review',
                target: { columnName: replicateFlag.columnName, rowIndices: [] },
                beforeValues: [],
                afterValue: null,
                reason: 'Acknowledged missing replicates',
                actor: currentActor,
                timestampStart: new Date().toISOString(),
                timestampEnd: new Date().toISOString(),
              })
            }
          />
        )}

        {listFlags.map((flag) => (
          <ManualFlagListItem
            key={flag.id}
            flag={flag}
            selected={flag.id === selectedFlagId}
            onSelect={() => onSelectFlag(flag.id === selectedFlagId ? null : flag.id)}
          />
        ))}

        {selectedFlag?.type === 'missing_value' && (
          <JudgmentCallCard flag={selectedFlag} hideAutoSuggestion />
        )}

        {selectedFlag &&
          (selectedFlag.type === 'casing_divergence' ||
            selectedFlag.type === 'schema_violation' ||
            selectedFlag.type === 'whitespace') && (
            <ClusterCard
              flag={selectedFlag}
              protocolName={activeProtocol?.name}
              hideAutoSuggestion
            />
          )}
      </div>
    </div>
  );
}

export function countManualReviewItems(
  flags: AnomalyFlag[],
  advancedMode: boolean,
): number {
  const unresolved = flags.filter((f) => !f.resolved);
  let count = unresolved.filter(
    (f) => f.type === 'missing_value' && f.detail !== 'ambiguous_whitespace',
  ).length;
  if (unresolved.some((f) => f.type === 'missing_replicate')) count += 1;
  if (advancedMode) {
    count += unresolved.filter(
      (f) =>
        f.type === 'casing_divergence' ||
        f.type === 'schema_violation' ||
        f.type === 'whitespace',
    ).length;
  }
  return count;
}
