import { useMemo } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';

export function CostOfCleaningSummary({ embedded = false }: { embedded?: boolean }) {
  const auditTrail = useBioBridgeStore((s) => s.auditTrail);

  const stats = useMemo(() => {
    const totalInteractionSec = auditTrail.reduce(
      (sum, e) => sum + e.humanInteractionTimeSec,
      0,
    );
    const totalCpuMs = auditTrail.reduce((sum, e) => sum + e.effort.cpuTimeMs, 0);
    const totalTokenCost = auditTrail.reduce(
      (sum, e) => sum + e.effort.estimatedTokenCost,
      0,
    );
    const byType = auditTrail.reduce<Record<string, number>>((acc, e) => {
      acc[e.actionType] = (acc[e.actionType] ?? 0) + 1;
      return acc;
    }, {});

    return { totalInteractionSec, totalCpuMs, totalTokenCost, byType, count: auditTrail.length };
  }, [auditTrail]);

  if (!stats.count) return null;

  return (
    <div className={embedded ? '' : 'rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm'}>
      {!embedded && <h3 className="text-sm font-semibold text-slate-800">Cost of Cleaning</h3>}
      <p className={`text-xs text-slate-500 ${embedded ? '' : 'mt-1'}`}>
        Data cleaning is often 50–60% of comp-bio time but invisible in project plans. This makes
        that effort measurable. Token cost is estimated (demo proxy).
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-2xl font-semibold text-slate-900">{stats.count}</p>
          <p className="text-xs text-slate-500">Total actions</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            {stats.totalInteractionSec.toFixed(0)}s
          </p>
          <p className="text-xs text-slate-500">Human interaction</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            {stats.totalCpuMs.toFixed(0)}ms
          </p>
          <p className="text-xs text-slate-500">CPU time</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            ~{stats.totalTokenCost.toFixed(1)}
          </p>
          <p className="text-xs text-slate-500">Est. token cost</p>
        </div>
      </div>
      {Object.keys(stats.byType).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(stats.byType).map(([type, count]) => (
            <span
              key={type}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {type}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
