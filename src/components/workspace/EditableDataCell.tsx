import { useEffect, useRef, useState } from 'react';
import type { CellValue } from '../../types/dataset';

function formatCell(value: CellValue) {
  if (value === null || value === '') return '—';
  return String(value);
}

export type CellHighlight = 'none' | 'flagged' | 'selected' | 'changed' | 'flash';

const HIGHLIGHT_CLASS: Record<CellHighlight, string> = {
  none: 'text-slate-800 hover:bg-brand-50',
  flagged: 'bg-amber-50 text-amber-950 ring-1 ring-amber-200 hover:bg-amber-100',
  selected: 'bg-brand-100 text-brand-950 ring-2 ring-brand-400',
  changed: 'bg-emerald-50 font-medium text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-100',
  flash: 'bg-emerald-200 text-emerald-950 ring-2 ring-emerald-400 animate-pulse',
};

export function EditableDataCell({
  rowIndex,
  columnName,
  value,
  highlight,
  onSave,
}: {
  rowIndex: number;
  columnName: string;
  value: CellValue;
  highlight: CellHighlight;
  onSave: (rawValue: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    setDraft(value === null ? '' : String(value));
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    onSave(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft('');
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        className="w-full min-w-[4rem] rounded border border-brand-400 bg-white px-1 py-0.5 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
        aria-label={`Edit ${columnName}, row ${rowIndex + 1}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      title="Click to edit"
      className={`block w-full truncate rounded px-1 py-0.5 text-left text-xs transition focus:outline-none focus:ring-1 focus:ring-brand-400 ${HIGHLIGHT_CLASS[highlight]} ${value === null && highlight === 'none' ? 'text-slate-300' : ''}`}
    >
      {formatCell(value)}
    </button>
  );
}
