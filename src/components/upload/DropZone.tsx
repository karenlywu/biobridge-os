import { useCallback, useRef, useState } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { parseCsvFile } from '../../lib/parsing/parseCsv';
import { parseClipboardToDataset } from '../../lib/parsing/parseClipboard';
import { listSheets, parseExcelSheet, readExcelFile } from '../../lib/parsing/parseExcel';
import type { SheetInfo } from '../../lib/parsing/parseExcel';
import { Button } from '../shared/Button';
import { SheetPicker } from './SheetPicker';
import { DemoGallery } from './DemoGallery';

const ACCEPT = '.csv,.tsv,.xlsx,.xls,.ods';

export function DropZone() {
  const loadDataset = useBioBridgeStore((s) => s.loadDataset);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingExcel, setPendingExcel] = useState<{
    buffer: ArrayBuffer;
    fileName: string;
    sheets: SheetInfo[];
  } | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'csv' || ext === 'tsv') {
          loadDataset(await parseCsvFile(file));
        } else if (['xlsx', 'xls', 'ods'].includes(ext ?? '')) {
          const buffer = await readExcelFile(file);
          const sheets = listSheets(buffer);
          if (sheets.length === 1) {
            loadDataset(parseExcelSheet(buffer, file.name, sheets[0].name));
          } else {
            setPendingExcel({ buffer, fileName: file.name, sheets });
          }
        } else {
          setError('Unsupported file format');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse file');
      }
    },
    [loadDataset],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragOver
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 bg-slate-50 hover:border-brand-400'
        }`}
      >
        <p className="text-lg font-medium text-slate-800">Drop a lab export here</p>
        <p className="mt-1 text-sm text-slate-500">
          CSV, TSV, Excel (.xlsx, .xls, .ods) — or paste from clipboard
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            const text = window.prompt('Paste tabular data (CSV or TSV):');
            if (text) {
              try {
                loadDataset(parseClipboardToDataset(text));
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Parse failed');
              }
            }
          }}
        >
          Paste from clipboard
        </Button>
      </div>

      <DemoGallery />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pendingExcel && (
        <SheetPicker
          sheets={pendingExcel.sheets}
          onSelect={(sheetName) => {
            loadDataset(
              parseExcelSheet(pendingExcel.buffer, pendingExcel.fileName, sheetName),
            );
            setPendingExcel(null);
          }}
          onCancel={() => setPendingExcel(null)}
        />
      )}
    </div>
  );
}
