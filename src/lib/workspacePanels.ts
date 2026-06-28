export type WorkspacePanelId =
  | 'upload'
  | 'preflight'
  | 'suggestions'
  | 'ingestion'
  | 'dictionary'
  | 'data-preview'
  | 'cleaning-studio'
  | 'cost'
  | 'handoff'
  | 'python'
  | 'audit';

export type WorkspacePhaseId = 'understand' | 'fix' | 'handoff';

export const PANEL_PHASE: Record<WorkspacePanelId, WorkspacePhaseId> = {
  upload: 'understand',
  preflight: 'understand',
  ingestion: 'understand',
  dictionary: 'understand',
  suggestions: 'fix',
  'data-preview': 'fix',
  'cleaning-studio': 'fix',
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
  'suggestions',
  'ingestion',
  'dictionary',
  'data-preview',
  'cleaning-studio',
  'cost',
  'handoff',
  'python',
  'audit',
];

export const ELENA_DEFAULT_PANEL_ORDER: WorkspacePanelId[] = [
  'upload',
  'preflight',
  'suggestions',
  'cleaning-studio',
  'ingestion',
  'data-preview',
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
  'data-preview',
  'cleaning-studio',
  'suggestions',
  'dictionary',
  'python',
  'audit',
  'cost',
  'handoff',
];

function storageKey(personaId: string): string {
  return `biobridge-workspace-panel-order-${personaId}`;
}

function defaultOrderForPersona(personaId: string): WorkspacePanelId[] {
  if (personaId === 'marcus') return [...MARCUS_DEFAULT_PANEL_ORDER];
  return [...ELENA_DEFAULT_PANEL_ORDER];
}

function normalizeOrder(parsed: unknown): WorkspacePanelId[] | null {
  if (!Array.isArray(parsed)) return null;
  const valid = parsed.filter((id): id is WorkspacePanelId =>
    DEFAULT_WORKSPACE_PANEL_ORDER.includes(id as WorkspacePanelId),
  );
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
