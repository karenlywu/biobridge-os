import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { PREVIEW_ROW_LIMIT, LARGE_FILE_THRESHOLD } from '../../lib/utils';

export function DataPreviewTable({ embedded = false }: { embedded?: boolean }) {
  const dataset = useBioBridgeStore((s) => s.dataset);

  if (!dataset) return null;

  const displayRows =
    dataset.rowCount > LARGE_FILE_THRESHOLD
      ? dataset.rows.slice(0, PREVIEW_ROW_LIMIT)
      : dataset.rows;

  return (
    <div
      className={
        embedded ? 'overflow-hidden' : 'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
      }
    >
      {!embedded && (
        <div className="border-b border-slate-200 px-4 py-2">
          <h3 className="text-sm font-semibold text-slate-800">Data preview</h3>
          {dataset.rowCount > LARGE_FILE_THRESHOLD && (
            <p className="text-xs text-amber-700">
              Showing first {PREVIEW_ROW_LIMIT.toLocaleString()} of{' '}
              {dataset.rowCount.toLocaleString()} rows
            </p>
          )}
        </div>
      )}
      {embedded && dataset.rowCount > LARGE_FILE_THRESHOLD && (
        <p className="border-b border-slate-100 px-4 py-2 text-xs text-amber-700">
          Showing first {PREVIEW_ROW_LIMIT.toLocaleString()} of{' '}
          {dataset.rowCount.toLocaleString()} rows
        </p>
      )}
      <div className="max-h-64 overflow-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-3 py-2 font-medium text-slate-500">#</th>
              {dataset.columns.map((col) => (
                <th key={col.name} className="px-3 py-2 font-medium text-slate-700">
                  {col.name}
                  <span className="ml-1 text-slate-400">({col.inferredType})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                {dataset.columns.map((col) => (
                  <td key={col.name} className="max-w-[120px] truncate px-3 py-1.5 text-slate-800">
                    {row[col.name] === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      String(row[col.name])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
