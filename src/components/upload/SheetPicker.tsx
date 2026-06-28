import type { SheetInfo } from '../../lib/parsing/parseExcel';
import { Button } from '../shared/Button';

interface SheetPickerProps {
  sheets: SheetInfo[];
  onSelect: (sheetName: string) => void;
  onCancel: () => void;
}

export function SheetPicker({ sheets, onSelect, onCancel }: SheetPickerProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">Select a worksheet</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {sheets.map((sheet) => (
          <button
            key={sheet.name}
            type="button"
            onClick={() => onSelect(sheet.name)}
            className="rounded-lg border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <p className="font-medium text-slate-900">{sheet.name}</p>
            <p className="text-xs text-slate-500">{sheet.rowCount} rows</p>
            <table className="mt-2 w-full text-xs text-slate-600">
              <tbody>
                {sheet.preview.slice(0, 3).map((row, i) => (
                  <tr key={i}>
                    {row.slice(0, 4).map((cell, j) => (
                      <td key={j} className="truncate border border-slate-100 px-1 py-0.5">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
