import { useCallback, useRef, useState } from 'react';
import { parseCsvFile } from '../../lib/parsing/parseCsv';
import { parseClipboardToDataset } from '../../lib/parsing/parseClipboard';
import { listSheets, parseExcelSheet, readExcelFile } from '../../lib/parsing/parseExcel';
import type { SheetInfo } from '../../lib/parsing/parseExcel';
import { Button } from '../shared/Button';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Modal } from '../shared/Modal';
import { SheetPicker } from './SheetPicker';
import { DemoGallery } from './DemoGallery';
import { useDatasetLoadConfirm } from '../../hooks/useDatasetLoadConfirm';

const ACCEPT = '.csv,.tsv,.xlsx,.xls,.ods';

export function DropZone() {
  const { requestLoad, confirmLoad, cancelLoad, confirmOpen } = useDatasetLoadConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
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
          requestLoad(await parseCsvFile(file));
        } else if (['xlsx', 'xls', 'ods'].includes(ext ?? '')) {
          const buffer = await readExcelFile(file);
          const sheets = listSheets(buffer);
          if (sheets.length === 1) {
            requestLoad(parseExcelSheet(buffer, file.name, sheets[0].name));
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
    [requestLoad],
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

  const submitPaste = () => {
    try {
      requestLoad(parseClipboardToDataset(pasteText));
      setPasteOpen(false);
      setPasteText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse failed');
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload lab export file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
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
        <Button variant="secondary" onClick={() => setPasteOpen(true)}>
          Paste from clipboard
        </Button>
      </div>

      <DemoGallery />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pendingExcel && (
        <SheetPicker
          sheets={pendingExcel.sheets}
          onSelect={(sheetName) => {
            requestLoad(
              parseExcelSheet(pendingExcel.buffer, pendingExcel.fileName, sheetName),
            );
            setPendingExcel(null);
          }}
          onCancel={() => setPendingExcel(null)}
        />
      )}

      <Modal open={pasteOpen} onClose={() => setPasteOpen(false)} title="Paste tabular data">
        <p className="mb-3 text-sm text-slate-600">
          Paste CSV or TSV content from Excel, Google Sheets, or your instrument export.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Well_ID,Treatment_Group,Expression_Value&#10;A01,Control,1.23"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPasteOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submitPaste} disabled={!pasteText.trim()}>
            Load data
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Replace current session?"
        message="Loading a new file will discard your current cleaning progress and audit trail for this session."
        confirmLabel="Replace session"
        variant="danger"
        onConfirm={confirmLoad}
        onCancel={cancelLoad}
      />
    </div>
  );
}
