import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { auditTrailToCsv } from '../../lib/audit/auditLogger';
import { Button } from '../shared/Button';
import { downloadTextFile } from '../../lib/utils';

export function AuditTrailPanel({ embedded = false }: { embedded?: boolean }) {
  const auditTrail = useBioBridgeStore((s) => s.auditTrail);

  return (
    <div
      className={
        embedded ? 'overflow-hidden bg-white' : 'rounded-xl border border-slate-200 bg-white shadow-sm'
      }
    >
      <div
        className={`flex items-center border-b border-slate-200 px-4 py-2 ${embedded ? 'justify-end' : 'justify-between'}`}
      >
        {!embedded && <h3 className="text-sm font-semibold text-slate-800">Audit Trail</h3>}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              downloadTextFile(
                JSON.stringify(auditTrail, null, 2),
                'audit_trail.json',
                'application/json',
              )
            }
          >
            Export JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              downloadTextFile(auditTrailToCsv(auditTrail), 'audit_trail.csv', 'text/csv')
            }
          >
            Export CSV
          </Button>
        </div>
      </div>
      <div className="max-h-64 overflow-auto">
        {auditTrail.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No actions recorded yet.</p>
        ) : (
          <table className="min-w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <th className="px-3 py-2 font-medium text-slate-600">#</th>
                <th className="px-3 py-2 font-medium text-slate-600">Type</th>
                <th className="px-3 py-2 font-medium text-slate-600">Target</th>
                <th className="px-3 py-2 font-medium text-slate-600">Before → After</th>
                <th className="px-3 py-2 font-medium text-slate-600">Actor</th>
                <th className="px-3 py-2 font-medium text-slate-600">Time (s)</th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map((entry, i) => (
                <tr key={entry.actionId} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{entry.actionType}</td>
                  <td className="px-3 py-2 text-slate-700">{entry.target}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {String(entry.beforeValue ?? '—')} → {String(entry.afterValue ?? '—')}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{entry.actor}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {entry.humanInteractionTimeSec.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
