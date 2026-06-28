export type WorkspacePanelId =
  | 'upload'
  | 'preflight'
  | 'review-fix'
  | 'ingestion'
  | 'dictionary'
  | 'cost'
  | 'handoff'
  | 'python'
  | 'audit';

/** @deprecated Merged into review-fix — kept for localStorage migration */
export type LegacyWorkspacePanelId = 'suggestions' | 'data-preview' | 'cleaning-studio';

export type WorkspacePhaseId = 'understand' | 'fix' | 'handoff';

export const PANEL_PHASE: Record<WorkspacePanelId, WorkspacePhaseId> = {
  upload: 'understand',
  preflight: 'understand',
  ingestion: 'understand',
  dictionary: 'understand',
  'review-fix': 'fix',
  cost: 'handoff',
  handoff: 'handoff',
  python: 'handoff',
  audit: 'handoff',
};

export const PHASE_LABELS: Record<WorkspacePhaseId, string> = {
  understand: 'Understand',
  fix: 'Fix',
  handoff: 'Hand off',
};

export const DEFAULT_WORKSPACE_PANEL_ORDER: WorkspacePanelId[] = [
  'upload',
  'preflight',
  'review-fix',
  'ingestion',
  'dictionary',
  'cost',
  'handoff',
  'python',
  'audit',
];

export const ELENA_DEFAULT_PANEL_ORDER: WorkspacePanelId[] = [
  'upload',
  'preflight',
  'review-fix',
  'ingestion',
  'dictionary',
  'handoff',
  'cost',
  'python',
  'audit',
];

export const MARCUS_DEFAULT_PANEL_ORDER: WorkspacePanelId[] = [
  'upload',
  'ingestion',
  'preflight',
  'review-fix',
  'dictionary',
  'python',
  'audit',
  'cost',
  'handoff',
];

const LEGACY_PANEL_IDS = new Set(['suggestions', 'data-preview', 'cleaning-studio']);

function storageKey(personaId: string): string {
  return `biobridge-workspace-panel-order-${personaId}`;
}

function defaultOrderForPersona(personaId: string): WorkspacePanelId[] {
  if (personaId === 'marcus') return [...MARCUS_DEFAULT_PANEL_ORDER];
  return [...ELENA_DEFAULT_PANEL_ORDER];
}

function migratePanelId(id: string): WorkspacePanelId | null {
  if (LEGACY_PANEL_IDS.has(id)) return 'review-fix';
  if (DEFAULT_WORKSPACE_PANEL_ORDER.includes(id as WorkspacePanelId)) {
    return id as WorkspacePanelId;
  }
  return null;
}

function normalizeOrder(parsed: unknown): WorkspacePanelId[] | null {
  if (!Array.isArray(parsed)) return null;
  const valid: WorkspacePanelId[] = [];
  for (const id of parsed) {
    const mapped = migratePanelId(String(id));
    if (mapped && !valid.includes(mapped)) valid.push(mapped);
  }
  const missing = DEFAULT_WORKSPACE_PANEL_ORDER.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

export function loadPanelOrder(personaId: string): WorkspacePanelId[] {
  try {
    const raw = localStorage.getItem(storageKey(personaId));
    if (!raw) return defaultOrderForPersona(personaId);
    const normalized = normalizeOrder(JSON.parse(raw));
    return normalized ?? defaultOrderForPersona(personaId);
  } catch {
    return defaultOrderForPersona(personaId);
  }
}

export function savePanelOrder(personaId: string, order: WorkspacePanelId[]): void {
  try {
    localStorage.setItem(storageKey(personaId), JSON.stringify(order));
  } catch {
    /* ignore quota errors in demo */
  }
}

export function reorderPanels(
  order: WorkspacePanelId[],
  fromId: WorkspacePanelId,
  toId: WorkspacePanelId,
): WorkspacePanelId[] {
  if (fromId === toId) return order;
  const next = [...order];
  const fromIndex = next.indexOf(fromId);
  const toIndex = next.indexOf(toId);
  if (fromIndex === -1 || toIndex === -1) return order;
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, fromId);
  return next;
}
