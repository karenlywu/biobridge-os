import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { DropZone } from '../upload/DropZone';
import { IngestionSummaryCard } from '../upload/IngestionSummaryCard';
import { PreFlightCheckCard } from './PreFlightCheckCard';
import { ReviewFixPanel } from './ReviewFixPanel';
import { DataDictionaryPanel } from '../protocol/DataDictionaryPanel';
import { CodePanel } from '../codepanel/CodePanel';
import { AuditTrailPanel } from '../audittrail/AuditTrailPanel';
import { CostOfCleaningSummary } from '../audittrail/CostOfCleaningSummary';
import { HandoffReportPanel } from '../audittrail/HandoffReportPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Button } from '../shared/Button';
import {
  ELENA_DEFAULT_PANEL_ORDER,
  loadPanelOrder,
  MARCUS_DEFAULT_PANEL_ORDER,
  PANEL_PHASE,
  PHASE_LABELS,
  reorderPanels,
  savePanelOrder,
  type WorkspacePanelId,
  type WorkspacePhaseId,
} from '../../lib/workspacePanels';

export function WorkspacePanels() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const auditTrail = useBioBridgeStore((s) => s.auditTrail);
  const anomalyFlags = useBioBridgeStore((s) => s.anomalyFlags);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);

  const [panelOrder, setPanelOrder] = useState<WorkspacePanelId[]>(() =>
    loadPanelOrder(activePersonaId),
  );
  const [draggingId, setDraggingId] = useState<WorkspacePanelId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<WorkspacePanelId | null>(null);

  useEffect(() => {
    setPanelOrder(loadPanelOrder(activePersonaId));
  }, [activePersonaId]);

  const unresolvedCount = useMemo(
    () => anomalyFlags.filter((f) => !f.resolved).length,
    [anomalyFlags],
  );

  const activeProtocol = protocols.find((p) => p.id === activeProtocolId);

  const visibility = useMemo(
    (): Record<WorkspacePanelId, boolean> => ({
      upload: true,
      preflight: true,
      'review-fix': true,
      ingestion: true,
      dictionary: Boolean(
        activeProtocol?.columnRules.some((r) => r.description || r.units),
      ),
      cost: auditTrail.length > 0,
      handoff: auditTrail.length > 0,
      python: true,
      audit: true,
    }),
    [activeProtocol, auditTrail.length],
  );

  const panelMeta = useMemo(
    (): Record<
      WorkspacePanelId,
      { title: string; subtitle?: string; defaultOpen: boolean }
    > => ({
      upload: {
        title: activePersonaId === 'elena' ? 'Upload lab data' : 'Review lab export',
        subtitle: dataset?.sourceFileName,
        defaultOpen: false,
      },
      preflight: { title: 'Pre-flight check', defaultOpen: true },
      'review-fix': {
        title: 'Review & fix',
        subtitle:
          unresolvedCount > 0
            ? `${unresolvedCount} open issue${unresolvedCount !== 1 ? 's' : ''} · quick fixes & judgment calls`
            : 'Edit data inline · audit trail updates live',
        defaultOpen: true,
      },
      ingestion: {
        title: 'Ingestion summary',
        subtitle: dataset
          ? `${dataset.rowCount.toLocaleString()} rows · ${dataset.columns.length} columns`
          : undefined,
        defaultOpen: true,
      },
      dictionary: {
        title: 'Data dictionary',
        subtitle: activeProtocol?.name,
        defaultOpen: false,
      },
      cost: {
        title: 'Cost of cleaning',
        subtitle: 'Human time and effort metrics',
        defaultOpen: false,
      },
      handoff: {
        title: 'Handoff report',
        subtitle: 'Plain-language summary for the bench scientist',
        defaultOpen: false,
      },
      python: { title: 'Generated Python', defaultOpen: false },
      audit: { title: 'Audit trail', defaultOpen: false },
    }),
    [activePersonaId, dataset, activeProtocol?.name, unresolvedCount],
  );

  const commitOrder = useCallback(
    (next: WorkspacePanelId[]) => {
      setPanelOrder(next);
      savePanelOrder(activePersonaId, next);
    },
    [activePersonaId],
  );

  const handleDragStart = (id: WorkspacePanelId) => (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (id: WorkspacePanelId) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingId && draggingId !== id) setDropTargetId(id);
  };

  const handleDrop = (id: WorkspacePanelId) => (e: DragEvent) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain') as WorkspacePanelId;
    if (fromId && fromId !== id) {
      commitOrder(reorderPanels(panelOrder, fromId, id));
    }
    setDraggingId(null);
    setDropTargetId(null);
  };

  const resetOrder = () => {
    const defaults =
      activePersonaId === 'marcus'
        ? [...MARCUS_DEFAULT_PANEL_ORDER]
        : [...ELENA_DEFAULT_PANEL_ORDER];
    commitOrder(defaults);
  };

  const renderPanelContent = (id: WorkspacePanelId) => {
    switch (id) {
      case 'upload':
        return (
          <>
            <p className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
              Load a different file or demo dataset — your current session will be replaced.
            </p>
            <div className="p-4">
              <DropZone />
            </div>
          </>
        );
      case 'preflight':
        return (
          <div className="p-4">
            <PreFlightCheckCard embedded />
          </div>
        );
      case 'review-fix':
        return <ReviewFixPanel />;
      case 'ingestion':
        return (
          <div className="p-4">
            <IngestionSummaryCard embedded />
          </div>
        );
      case 'dictionary':
        return (
          <div className="p-4">
            <DataDictionaryPanel embedded />
          </div>
        );
      case 'cost':
        return (
          <div className="p-4">
            <CostOfCleaningSummary embedded />
          </div>
        );
      case 'handoff':
        return (
          <div className="p-4">
            <HandoffReportPanel embedded />
          </div>
        );
      case 'python':
        return <CodePanel embedded />;
      case 'audit':
        return <AuditTrailPanel embedded />;
      default:
        return null;
    }
  };

  if (!dataset) return null;

  let lastPhase: WorkspacePhaseId | null = null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
        <span>Drag the grip on any panel to reorder your workspace.</span>
        <Button variant="ghost" className="text-xs" onClick={resetOrder}>
          Reset layout
        </Button>
      </div>

      {panelOrder.map((id) => {
        if (!visibility[id]) return null;
        const meta = panelMeta[id];
        const phase = PANEL_PHASE[id];
        const showPhaseHeader = phase !== lastPhase;
        lastPhase = phase;

        return (
          <div key={id}>
            {showPhaseHeader && (
              <div className="mb-2 mt-1 flex items-center gap-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {PHASE_LABELS[phase]}
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            )}
            <CollapsibleSection
              panelId={id}
              title={meta.title}
              subtitle={meta.subtitle}
              defaultOpen={meta.defaultOpen}
              draggable
              isDragging={draggingId === id}
              isDropTarget={dropTargetId === id}
              onDragStart={handleDragStart(id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver(id)}
              onDrop={handleDrop(id)}
            >
              {renderPanelContent(id)}
            </CollapsibleSection>
          </div>
        );
      })}
    </div>
  );
}
