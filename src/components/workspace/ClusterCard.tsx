import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import type { AnomalyFlag } from '../../types/anomaly';
import {
  ANOMALY_PLAIN_LANGUAGE,
  getColumnDescription,
  getColumnUnits,
} from '../../lib/anomalyLabels';
import { generateId } from '../../lib/utils';
import { Button } from '../shared/Button';
import { Chip } from '../shared/Chip';
import { mergeBeforeValues } from '../../lib/promotion';
import { useFlagSuggestion } from './useFlagSuggestion';

interface ClusterCardProps {
  flag: AnomalyFlag;
  protocolName?: string;
}

export function ClusterCard({ flag, protocolName }: ClusterCardProps) {
  const resolveFlag = useBioBridgeStore((s) => s.resolveFlag);
  const applySuggestion = useBioBridgeStore((s) => s.applySuggestion);
  const startInteraction = useBioBridgeStore((s) => s.startInteraction);
  const advancedModeEnabled = useBioBridgeStore((s) => s.advancedModeEnabled);
  const dataset = useBioBridgeStore((s) => s.dataset);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const currentActor = useBioBridgeStore((s) => s.currentActor);
  const suggestion = useFlagSuggestion(flag);

  if (flag.resolved) return null;

  const variants = flag.variantValues ?? [];
  const canonical = flag.canonicalValue ?? flag.suggestedResolution ?? variants[0] ?? '';
  const isSchema = flag.detectionSource === 'schema' && flag.type === 'schema_violation';
  const protocol = protocols.find((p) => p.id === activeProtocolId);
  const plain = ANOMALY_PLAIN_LANGUAGE[flag.type];
  const labelCtx = {
    columnName: flag.columnName,
    rowCount: flag.affectedRowIndices.length,
    variants,
    protocolName,
    units: protocol ? getColumnUnits(flag.columnName, protocol.columnRules) : undefined,
  };

  const handleMerge = (target: string) => {
    startInteraction();
    const now = new Date().toISOString();
    resolveFlag(flag.id, {
      id: generateId('action'),
      type: 'merge_cluster',
      target: { columnName: flag.columnName, rowIndices: flag.affectedRowIndices },
      beforeValues: mergeBeforeValues(flag, target),
      afterValue: target,
      reason: isSchema
        ? `These are the same condition — standardized to "${target}"`
        : `Same label spelled different ways — merged to "${target}"`,
      actor: currentActor,
      timestampStart: now,
      timestampEnd: now,
    });
  };

  const colDesc = protocol ? getColumnDescription(flag.columnName, protocol.columnRules) : undefined;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-900">{flag.columnName}</span>
        {isSchema && protocolName && (
          <Chip color="schema">Not in {protocolName}</Chip>
        )}
        {!isSchema && <Chip color="warning">{plain.pillLabel}</Chip>}
        {suggestion?.autoApplicable && <Chip color="brand">Suggested fix ready</Chip>}
      </div>

      <p className="mb-1 text-sm font-medium text-slate-800">{plain.cardTitle}</p>
      <p className="mb-3 text-sm text-slate-600">{plain.cardDescription(labelCtx)}</p>
      {colDesc && <p className="mb-2 text-xs text-slate-500">{colDesc}</p>}

      {suggestion && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-900">Recommended: {suggestion.title}</p>
          <p className="text-xs text-emerald-800">{suggestion.description}</p>
          <Button className="mt-2" onClick={() => applySuggestion(suggestion)}>
            Apply suggested fix
          </Button>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1">
        {variants.map((v) => (
          <Chip key={v}>&quot;{v}&quot;</Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {!suggestion && flag.type === 'whitespace' && dataset && (
          <Button
            onClick={() => {
              startInteraction();
              const now = new Date().toISOString();
              const beforeValues = flag.affectedRowIndices.map(
                (i) => dataset.rows[i]?.[flag.columnName] ?? null,
              );
              resolveFlag(flag.id, {
                id: generateId('action'),
                type: 'merge_cluster',
                target: {
                  columnName: flag.columnName,
                  rowIndices: flag.affectedRowIndices,
                },
                beforeValues,
                afterValue: null,
                reason: 'Removed invisible extra spaces',
                actor: currentActor,
                timestampStart: now,
                timestampEnd: now,
              });
            }}
          >
            Remove extra spaces
          </Button>
        )}
        {!suggestion && !isSchema && flag.type !== 'whitespace' && canonical && (
          <Button onClick={() => handleMerge(canonical)}>
            They&apos;re the same — use &quot;{canonical}&quot;
          </Button>
        )}
        {isSchema && protocol && !suggestion && (
          <>
            {(protocol.columnRules.find((r) => r.columnName === flag.columnName)
              ?.allowedValues ?? ['Control', 'Drug A', 'Drug B', 'Drug C']
            ).map((opt) => (
              <Button key={opt} variant="secondary" onClick={() => handleMerge(opt)}>
                Map to {opt}
              </Button>
            ))}
          </>
        )}
        {advancedModeEnabled && (
          <Button
            variant="ghost"
            onClick={() => {
              const pattern = window.prompt('Regex pattern:');
              const replacement = window.prompt('Replacement value:');
              if (pattern && replacement !== null) {
                startInteraction();
                const now = new Date().toISOString();
                resolveFlag(flag.id, {
                  id: generateId('action'),
                  type: 'regex_transform',
                  target: {
                    columnName: flag.columnName,
                    rowIndices: flag.affectedRowIndices,
                  },
                  beforeValues: variants.map(String),
                  afterValue: replacement,
                  reason: pattern,
                  actor: currentActor,
                  timestampStart: now,
                  timestampEnd: now,
                });
              }
            }}
          >
            Custom regex…
          </Button>
        )}
      </div>
      <p className="mt-2 text-[10px] text-slate-400">
        Technical: {plain.technicalTerm}
      </p>
    </div>
  );
}
