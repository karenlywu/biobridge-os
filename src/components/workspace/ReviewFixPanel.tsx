import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import {
  buildSuggestions,
  buildIngestionWarnings,
} from '../../lib/suggestions/buildSuggestions';
import { detectBatchNamingDrift } from '../../lib/suggestions/batchNamingDrift';
import type { CleaningSuggestion } from '../../types/suggestion';
import {
  affectedRowSet,
  cellKey,
  changedCellsFromHistory,
  flaggedCellsFromFlags,
} from '../../lib/reviewFix/cellHighlight';
import { PREVIEW_ROW_LIMIT, LARGE_FILE_THRESHOLD } from '../../lib/utils';
import { Button } from '../shared/Button';
import { Chip } from '../shared/Chip';
import { EditableDataCell, type CellHighlight } from './EditableDataCell';
import { ManualReviewPanel, countManualReviewItems } from './ManualReviewPanel';

type ReviewTab = 'quick' | 'manual';

const CONFIDENCE_STYLE = {
  high: 'border-emerald-200 bg-emerald-50/80',
  medium: 'border-amber-200 bg-amber-50/80',
  low: 'border-slate-200 bg-white',
};

function SuggestionQueueItem({
  suggestion,
  selected,
  onSelect,
  onApply,
}: {
  suggestion: CleaningSuggestion;
  selected: boolean;
  onSelect: () => void;
  onApply: () => void;
}) {
  const rowCount = suggestion.action.target.rowIndices.length;
  const preview =
    suggestion.action.beforeValues.slice(0, 2).map(String).join(', ') +
    (suggestion.action.beforeValues.length > 2 ? '…' : '');

  return (
    <div
      className={`rounded-lg border p-3 transition ${CONFIDENCE_STYLE[suggestion.confidence]} ${
        selected ? 'ring-2 ring-brand-400' : 'hover:border-brand-300'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left focus:outline-none"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-slate-900">{suggestion.title}</p>
          {suggestion.autoApplicable && (
            <Chip color="brand">Auto-fix</Chip>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-600 line-clamp-2">{suggestion.description}</p>
        <p className="mt-1 font-mono text-[10px] text-slate-500">
          {suggestion.action.target.columnName} · {rowCount} row{rowCount !== 1 ? 's' : ''}
          {preview ? ` · ${preview}` : ''}
        </p>
      </button>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button className="text-xs" onClick={onApply}>
          Apply
        </Button>
        {suggestion.alternatives?.slice(0, 2).map((alt) => (
          <Button
            key={alt.label}
            variant="ghost"
            className="text-xs"
            onClick={() =>
              useBioBridgeStore.getState().applySuggestion({ ...suggestion, action: alt.action })
            }
          >
            {alt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function cellHighlightFor(
  rowIndex: number,
  columnName: string,
  flashCells: Set<string>,
  changedCells: Set<string>,
  selectedCells: Set<string>,
  flaggedCells: Set<string>,
): CellHighlight {
  const key = cellKey(rowIndex, columnName);
  if (flashCells.has(key)) return 'flash';
  if (selectedCells.has(key)) return 'selected';
  if (changedCells.has(key)) return 'changed';
  if (flaggedCells.has(key)) return 'flagged';
  return 'none';
}

export function ReviewFixPanel() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const flags = useBioBridgeStore((s) => s.anomalyFlags);
  const actionHistory = useBioBridgeStore((s) => s.actionHistory);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const applySuggestion = useBioBridgeStore((s) => s.applySuggestion);
  const applyAllAutoSuggestions = useBioBridgeStore((s) => s.applyAllAutoSuggestions);
  const updateCellValue = useBioBridgeStore((s) => s.updateCellValue);
  const undoStack = useBioBridgeStore((s) => s.undoStack);
  const undoLastChange = useBioBridgeStore((s) => s.undoLastChange);
  const advancedModeEnabled = useBioBridgeStore((s) => s.advancedModeEnabled);

  const [activeTab, setActiveTab] = useState<ReviewTab>('quick');
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [selectedManualFlagId, setSelectedManualFlagId] = useState<string | null>(null);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [bulkComplete, setBulkComplete] = useState<{ applied: number } | null>(null);
  const [undoNotice, setUndoNotice] = useState<string | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const { suggestions, autoCount, batchDrift, warnings, unresolved } = useMemo(() => {
    if (!dataset) {
      return { suggestions: [], autoCount: 0, batchDrift: [], warnings: [], unresolved: 0 };
    }
    const protocol = protocols.find((p) => p.id === activeProtocolId) ?? null;
    const built = buildSuggestions({ dataset, flags, protocol });
    return {
      suggestions: built,
      autoCount: built.filter((s) => s.autoApplicable).length,
      batchDrift: detectBatchNamingDrift(dataset),
      warnings: buildIngestionWarnings(dataset),
      unresolved: flags.filter((f) => !f.resolved).length,
    };
  }, [dataset, flags, protocols, activeProtocolId]);

  const changedCells = useMemo(
    () => changedCellsFromHistory(actionHistory),
    [actionHistory],
  );
  const flaggedCells = useMemo(() => flaggedCellsFromFlags(flags), [flags]);

  const selectedSuggestion = useMemo(
    () => suggestions.find((s) => s.id === selectedSuggestionId) ?? null,
    [suggestions, selectedSuggestionId],
  );

  const selectedManualFlag = useMemo(
    () => flags.find((f) => f.id === selectedManualFlagId) ?? null,
    [flags, selectedManualFlagId],
  );

  const manualCount = useMemo(
    () => countManualReviewItems(flags, advancedModeEnabled),
    [flags, advancedModeEnabled],
  );

  const selectedCells = useMemo(() => {
    if (activeTab === 'quick' && selectedSuggestion) {
      const { columnName, rowIndices } = selectedSuggestion.action.target;
      return new Set(rowIndices.map((ri) => cellKey(ri, columnName)));
    }
    if (activeTab === 'manual' && selectedManualFlag) {
      return new Set(
        selectedManualFlag.affectedRowIndices.map((ri) =>
          cellKey(ri, selectedManualFlag.columnName),
        ),
      );
    }
    return new Set<string>();
  }, [activeTab, selectedSuggestion, selectedManualFlag]);

  const selectedRows = useMemo(() => {
    if (activeTab === 'quick' && selectedSuggestion) {
      return affectedRowSet(selectedSuggestion.action.target.rowIndices);
    }
    if (activeTab === 'manual' && selectedManualFlag) {
      return affectedRowSet(selectedManualFlag.affectedRowIndices);
    }
    return new Set<number>();
  }, [activeTab, selectedSuggestion, selectedManualFlag]);

  const flaggedRows = useMemo(() => {
    const rows = new Set<number>();
    flags.filter((f) => !f.resolved).forEach((f) => {
      f.affectedRowIndices.forEach((ri) => rows.add(ri));
    });
    return rows;
  }, [flags]);

  useEffect(() => {
    setSelectedSuggestionId(null);
    setSelectedManualFlagId(null);
    setActiveTab('quick');
    setBulkComplete(null);
    setShowFlaggedOnly(false);
    setFlashCells(new Set());
  }, [dataset?.id]);

  useEffect(() => {
    if (suggestions.length === 0) {
      setSelectedSuggestionId(null);
      return;
    }
    if (!selectedSuggestionId || !suggestions.some((s) => s.id === selectedSuggestionId)) {
      setSelectedSuggestionId(suggestions[0]!.id);
    }
  }, [suggestions, selectedSuggestionId]);

  useEffect(() => {
    if (activeTab !== 'quick') return;
    if (!selectedSuggestion?.action.target.rowIndices.length) return;
    const first = Math.min(...selectedSuggestion.action.target.rowIndices);
    rowRefs.current.get(first)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeTab, selectedSuggestionId, selectedSuggestion]);

  useEffect(() => {
    if (activeTab !== 'manual' || !selectedManualFlag?.affectedRowIndices.length) return;
    const first = Math.min(...selectedManualFlag.affectedRowIndices);
    rowRefs.current.get(first)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeTab, selectedManualFlagId, selectedManualFlag]);

  if (!dataset) return null;

  const allRows =
    dataset.rowCount > LARGE_FILE_THRESHOLD
      ? dataset.rows.slice(0, PREVIEW_ROW_LIMIT)
      : dataset.rows;

  const displayRows = showFlaggedOnly
    ? allRows
        .map((row, index) => ({ row, index }))
        .filter(({ index }) => flaggedRows.has(index) || selectedRows.has(index))
    : allRows.map((row, index) => ({ row, index }));

  const highlightColumn =
    activeTab === 'quick'
      ? (selectedSuggestion?.action.target.columnName ?? null)
      : (selectedManualFlag?.columnName ?? null);

  const flashSuggestionCells = (suggestion: CleaningSuggestion) => {
    const keys = suggestion.action.target.rowIndices.map((ri) =>
      cellKey(ri, suggestion.action.target.columnName),
    );
    setFlashCells(new Set(keys));
    window.setTimeout(() => setFlashCells(new Set()), 1200);
  };

  const applyOne = (suggestion: CleaningSuggestion) => {
    applySuggestion(suggestion);
    flashSuggestionCells(suggestion);
    const idx = suggestions.findIndex((s) => s.id === suggestion.id);
    const next = suggestions[idx + 1];
    setSelectedSuggestionId(next?.id ?? null);
  };

  const handleUndo = useCallback(() => {
    const record = undoLastChange();
    if (!record) return;
    const keys = record.action.target.rowIndices.map((ri) =>
      cellKey(ri, record.action.target.columnName),
    );
    if (keys.length) {
      setFlashCells(new Set(keys));
      window.setTimeout(() => setFlashCells(new Set()), 1200);
    }
    setUndoNotice(`Undid: ${record.action.reason}`);
    window.setTimeout(() => setUndoNotice(null), 3500);
  }, [undoLastChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo]);

  const handleApplyAll = async () => {
    setIsApplying(true);
    setBulkComplete(null);
    await new Promise((r) => setTimeout(r, 0));
    const applied = applyAllAutoSuggestions();
    setIsApplying(false);
    if (applied > 0) {
      setBulkComplete({ applied });
      setSelectedSuggestionId(suggestions[0]?.id ?? null);
      if (countManualReviewItems(flags, advancedModeEnabled) > 0) {
        setActiveTab('manual');
      }
    }
  };

  const remainingAfterBulk = bulkComplete
    ? flags.filter((f) => !f.resolved).length
    : unresolved;

  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Review & fix</p>
            <p className="text-xs text-slate-600">
              Select a fix to highlight affected cells · click any cell to edit ·{' '}
              <kbd className="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">
                ⌘Z
              </kbd>{' '}
              to undo
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              disabled={undoStack.length === 0}
              title={undoStack.length ? `Undo: ${undoStack[undoStack.length - 1]!.action.reason}` : undefined}
              onClick={handleUndo}
            >
              Undo
            </Button>
            {autoCount > 0 && activeTab === 'quick' && (
              <Button onClick={() => void handleApplyAll()} disabled={isApplying}>
                {isApplying ? 'Applying…' : `Apply all safe fixes (${autoCount})`}
              </Button>
            )}
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showFlaggedOnly}
                onChange={(e) => setShowFlaggedOnly(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Flagged rows only
            </label>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">
            {unresolved} open issue{unresolved !== 1 ? 's' : ''}
          </span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
            {autoCount} auto-fixable
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <span className="inline-block h-2 w-2 rounded-sm bg-amber-200 ring-1 ring-amber-300" />
            flagged
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <span className="inline-block h-2 w-2 rounded-sm bg-brand-200 ring-2 ring-brand-400" />
            selected fix
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-100 ring-1 ring-emerald-300" />
            fixed
          </span>
        </div>

        {undoNotice && (
          <div
            role="status"
            className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            ↩ {undoNotice}
          </div>
        )}

        {bulkComplete && (
          <div
            role="status"
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          >
            ✓ Applied {bulkComplete.applied} safe fix{bulkComplete.applied !== 1 ? 'es' : ''}.
            {remainingAfterBulk === 0
              ? ' All automatic issues resolved — check Needs your input or export.'
              : ` ${remainingAfterBulk} item${remainingAfterBulk !== 1 ? 's' : ''} still need review.`}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {warnings.map((w) => (
              <p key={w} className="text-xs text-amber-800">
                ⚠ {w}
              </p>
            ))}
          </div>
        )}
      </div>

      <div
        className="flex border-b border-slate-200 bg-white px-4"
        role="tablist"
        aria-label="Review mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quick'}
          onClick={() => setActiveTab('quick')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'quick'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Quick fixes ({suggestions.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'manual'}
          onClick={() => setActiveTab('manual')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            activeTab === 'manual'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Needs your input ({manualCount})
        </button>
      </div>

      <div className="grid min-h-[22rem] lg:grid-cols-[minmax(240px,320px)_1fr]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          {activeTab === 'quick' ? (
            <>
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Fix queue
                </p>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto p-3 lg:max-h-[28rem]">
                {suggestions.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {unresolved === 0
                      ? 'No open fixes — edit cells directly or export when ready.'
                      : 'No automated suggestions — check Needs your input.'}
                  </p>
                ) : (
                  suggestions.map((s) => (
                    <SuggestionQueueItem
                      key={s.id}
                      suggestion={s}
                      selected={s.id === selectedSuggestionId}
                      onSelect={() => {
                        setSelectedSuggestionId(s.id);
                        setSelectedManualFlagId(null);
                      }}
                      onApply={() => applyOne(s)}
                    />
                  ))
                )}

                {batchDrift.length > 0 && (
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-2">
                    <p className="text-xs font-medium text-violet-900">Batch naming drift</p>
                    {batchDrift.map((d) => (
                      <p key={d.columnName} className="mt-1 text-[10px] text-violet-800">
                        {d.columnName}: suggest <strong>{d.suggestedCanonical}</strong>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <ManualReviewPanel
              selectedFlagId={selectedManualFlagId}
              onSelectFlag={(id) => {
                setSelectedManualFlagId(id);
                setSelectedSuggestionId(null);
              }}
            />
          )}
        </aside>

        <div className="min-w-0">
          {dataset.rowCount > LARGE_FILE_THRESHOLD && (
            <p className="border-b border-slate-100 px-4 py-2 text-xs text-amber-700">
              Showing first {PREVIEW_ROW_LIMIT.toLocaleString()} of{' '}
              {dataset.rowCount.toLocaleString()} rows
            </p>
          )}
          <div className="max-h-[28rem] overflow-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-500">#</th>
                  {dataset.columns.map((col) => (
                    <th
                      key={col.name}
                      className={`px-3 py-2 font-medium ${
                        col.name === highlightColumn
                          ? 'bg-brand-50 text-brand-900'
                          : 'text-slate-700'
                      }`}
                    >
                      {col.name}
                      <span className="ml-1 font-normal text-slate-400">({col.inferredType})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={dataset.columns.length + 1}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No flagged rows match the current filter.
                    </td>
                  </tr>
                ) : (
                  displayRows.map(({ row, index: rowIndex }) => {
                    const rowFlagged = flaggedRows.has(rowIndex);
                    const rowSelected = selectedRows.has(rowIndex);
                    return (
                      <tr
                        key={`${dataset.id}-row-${rowIndex}`}
                        ref={(el) => {
                          if (el) rowRefs.current.set(rowIndex, el);
                          else rowRefs.current.delete(rowIndex);
                        }}
                        className={`border-t border-slate-100 ${
                          rowSelected
                            ? 'bg-brand-50/40'
                            : rowFlagged
                              ? 'bg-amber-50/30'
                              : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-3 py-1.5 text-slate-400">{rowIndex + 1}</td>
                        {dataset.columns.map((col) => (
                          <td key={col.name} className="max-w-[140px] px-2 py-1">
                            <EditableDataCell
                              rowIndex={rowIndex}
                              columnName={col.name}
                              value={row[col.name] ?? null}
                              highlight={cellHighlightFor(
                                rowIndex,
                                col.name,
                                flashCells,
                                changedCells,
                                selectedCells,
                                flaggedCells,
                              )}
                              onSave={(raw) => updateCellValue(rowIndex, col.name, raw)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
