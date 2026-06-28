import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { LARGE_FILE_THRESHOLD } from '../../lib/utils';

export function IngestionSummaryCard({ embedded = false }: { embedded?: boolean }) {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const anomalyFlags = useBioBridgeStore((s) => s.anomalyFlags);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);

  if (!dataset) return null;

  const activeProtocol = protocols.find((p) => p.id === activeProtocolId);
  const unresolved = anomalyFlags.filter((f) => !f.resolved).length;
  const protocolIssues = anomalyFlags.filter(
    (f) => !f.resolved && f.detectionSource === 'schema',
  ).length;
  const isElena = activePersonaId === 'elena';

  return (
    <div className={embedded ? '' : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{dataset.sourceFileName}</h3>
          <p className="text-sm text-slate-500">
            {dataset.rowCount.toLocaleString()} rows · {dataset.columns.length} columns ·{' '}
            {dataset.sourceFormat.toUpperCase()}
            {dataset.rowCount > LARGE_FILE_THRESHOLD && ' · preview limited to 2,000 rows'}
          </p>
          {activeProtocol && (
            <p className="mt-1 text-xs text-violet-700">Checking against: {activeProtocol.name}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          {unresolved} {isElena ? 'issues to fix' : 'unresolved flags'}
        </span>
        {activeProtocol && protocolIssues > 0 && (
          <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800">
            {protocolIssues}{' '}
            {isElena ? "don't match protocol" : 'schema violations'}
          </span>
        )}
      </div>
    </div>
  );
}
