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

const STORAGE_KEY = 'biobridge-workspace-panel-order';

export function loadPanelOrder(): WorkspacePanelId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_WORKSPACE_PANEL_ORDER];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_WORKSPACE_PANEL_ORDER];
    const valid = parsed.filter((id): id is WorkspacePanelId =>
      DEFAULT_WORKSPACE_PANEL_ORDER.includes(id as WorkspacePanelId),
    );
    const missing = DEFAULT_WORKSPACE_PANEL_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return [...DEFAULT_WORKSPACE_PANEL_ORDER];
  }
}

export function savePanelOrder(order: WorkspacePanelId[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
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
