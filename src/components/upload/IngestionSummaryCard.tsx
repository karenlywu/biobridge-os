import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { LARGE_FILE_THRESHOLD } from '../../lib/utils';

export function IngestionSummaryCard() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const setActiveProtocol = useBioBridgeStore((s) => s.setActiveProtocol);
  const anomalyFlags = useBioBridgeStore((s) => s.anomalyFlags);

  if (!dataset) return null;

  const activeProtocol = protocols.find((p) => p.id === activeProtocolId);
  const unresolved = anomalyFlags.filter((f) => !f.resolved).length;
  const schemaFlags = anomalyFlags.filter(
    (f) => !f.resolved && f.detectionSource === 'schema',
  ).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{dataset.sourceFileName}</h3>
          <p className="text-sm text-slate-500">
            {dataset.rowCount.toLocaleString()} rows · {dataset.columns.length} columns ·{' '}
            {dataset.sourceFormat.toUpperCase()}
            {dataset.rowCount > LARGE_FILE_THRESHOLD && ' · preview limited to 2,000 rows'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="protocol-select" className="text-sm text-slate-600">
            Protocol:
          </label>
          <select
            id="protocol-select"
            value={activeProtocolId ?? ''}
            onChange={(e) =>
              setActiveProtocol(e.target.value ? e.target.value : null)
            }
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">None (heuristic only)</option>
            {protocols.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          {unresolved} unresolved flags
        </span>
        {activeProtocol && (
          <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800">
            {schemaFlags} schema violations · {activeProtocol.name}
          </span>
        )}
      </div>
    </div>
  );
}
