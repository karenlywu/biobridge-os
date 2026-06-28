import { useMemo, useState } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { AnomalyPillBar } from './AnomalyPillBar';
import { ClusterCard } from './ClusterCard';
import { NumericViolationChip } from './NumericViolationChip';
import { JudgmentCallCard } from './JudgmentCallCard';
import { MissingReplicateBanner } from './MissingReplicateBanner';
import { AdvancedModeToggle } from './AdvancedModeToggle';
import type { AnomalyType } from '../../types/anomaly';

export function CleaningStudio() {
  const anomalyFlags = useBioBridgeStore((s) => s.anomalyFlags);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);
  const currentActor = useBioBridgeStore((s) => s.currentActor);
  const resolveFlag = useBioBridgeStore((s) => s.resolveFlag);
  const [filter, setFilter] = useState<AnomalyType | 'all'>('all');
  const [showTechnical, setShowTechnical] = useState(false);

  const activeProtocol = protocols.find((p) => p.id === activeProtocolId);
  const unresolved = anomalyFlags.filter((f) => !f.resolved);

  const counts = useMemo(() => {
    const c: Record<AnomalyType, number> = {
      casing_divergence: 0,
      numeric_type_violation: 0,
      missing_replicate: 0,
      missing_value: 0,
      whitespace: 0,
      schema_violation: 0,
    };
    unresolved.forEach((f) => {
      c[f.type] += 1;
    });
    return c;
  }, [unresolved]);

  const filtered = filter === 'all' ? unresolved : unresolved.filter((f) => f.type === filter);
  const replicateFlag = unresolved.find((f) => f.type === 'missing_replicate');
  const cardFlags = filtered.filter((f) => f.type !== 'missing_replicate');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnomalyPillBar
          counts={counts}
          activeFilter={filter}
          onFilter={setFilter}
          showTechnical={showTechnical}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={showTechnical}
              onChange={() => setShowTechnical(!showTechnical)}
              className="rounded border-slate-300"
            />
            Show technical terms
          </label>
          {activePersonaId === 'marcus' && <AdvancedModeToggle />}
        </div>
      </div>

      {unresolved.length === 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
          All issues resolved — ready to export.
        </div>
      )}

      {replicateFlag && (filter === 'all' || filter === 'missing_replicate') && (
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

      <div className="space-y-3">
        {cardFlags.map((flag) => {
          if (flag.type === 'numeric_type_violation') {
            return <NumericViolationChip key={flag.id} flag={flag} hideAutoSuggestion />;
          }
          if (flag.type === 'missing_value') {
            return <JudgmentCallCard key={flag.id} flag={flag} hideAutoSuggestion />;
          }
          if (
            flag.type === 'casing_divergence' ||
            flag.type === 'schema_violation' ||
            flag.type === 'whitespace'
          ) {
            return (
              <ClusterCard
                key={flag.id}
                flag={flag}
                protocolName={activeProtocol?.name}
                hideAutoSuggestion
              />
            );
          }
          return null;
        })}
        {unresolved.length > 0 && cardFlags.length === 0 && filter !== 'missing_replicate' && (
          <p className="text-sm text-slate-500">No issues match this filter.</p>
        )}
        {filter === 'missing_replicate' && !replicateFlag && unresolved.length > 0 && (
          <p className="text-sm text-slate-500">No missing replicate issues in this dataset.</p>
        )}
      </div>
    </div>
  );
}
