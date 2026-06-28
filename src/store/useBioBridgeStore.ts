import { create } from 'zustand';
import type { Dataset } from '../types/dataset';
import type { ProtocolTemplate } from '../types/protocol';
import type { AnomalyFlag } from '../types/anomaly';
import type { CleaningAction } from '../types/action';
import type { AuditEntry } from '../types/audit';
import { detectAnomalies } from '../lib/detection/detectAnomalies';
import { createAuditEntry } from '../lib/audit/auditLogger';
import type { PersonaId } from '../lib/session';
import { DEFAULT_PERSONA_ID, getPersona } from '../lib/session';
import type { CleaningSuggestion } from '../types/suggestion';
import { buildSuggestions } from '../lib/suggestions/buildSuggestions';
import { derivePromotionPair } from '../lib/promotion';
import { STARTER_PROTOCOLS } from '../data/starterProtocol';
import { generateId } from '../lib/utils';

import type { PendingPromotion } from '../types/promotion';

export type { PendingPromotion };

interface BioBridgeState {
  dataset: Dataset | null;
  protocols: ProtocolTemplate[];
  activeProtocolId: string | null;
  anomalyFlags: AnomalyFlag[];
  actionHistory: CleaningAction[];
  auditTrail: AuditEntry[];
  advancedModeEnabled: boolean;
  activePersonaId: PersonaId;
  currentActor: string;
  pendingPromotion: PendingPromotion | null;
  lastInteractionStart: number | null;

  loadDataset: (dataset: Dataset) => void;
  setActiveProtocol: (protocolId: string | null) => void;
  commitAction: (action: CleaningAction, humanInteractionTimeSec?: number) => void;
  promoteToProtocol: (variant: string, canonical: string, columnName: string, actor: string) => void;
  dismissPromotion: () => void;
  resolveFlag: (flagId: string, action: CleaningAction) => void;
  toggleAdvancedMode: () => void;
  setActivePersona: (personaId: PersonaId) => void;
  saveProtocol: (protocol: ProtocolTemplate) => void;
  cloneProtocol: (protocolId: string, newName: string) => void;
  deleteProtocol: (protocolId: string) => void;
  startInteraction: () => void;
  rerunDetection: () => void;
  applySuggestion: (suggestion: CleaningSuggestion) => void;
  applyAllAutoSuggestions: () => number;
}

function getActiveProtocol(
  protocols: ProtocolTemplate[],
  activeProtocolId: string | null,
): ProtocolTemplate | null {
  if (!activeProtocolId) return null;
  return protocols.find((p) => p.id === activeProtocolId) ?? null;
}

function applyActionToDataset(dataset: Dataset, action: CleaningAction): Dataset {
  const newRows = dataset.rows.map((row) => ({ ...row }));
  const newColumns = dataset.columns.map((col) => ({
    ...col,
    values: [...col.values],
  }));

  action.target.rowIndices.forEach((rowIndex, i) => {
    const col = action.target.columnName;
    const value =
      action.reason.includes('whitespace') ||
      action.reason.includes('Trimmed') ||
      action.reason.includes('spaces')
        ? String(action.beforeValues[i] ?? action.beforeValues[0] ?? '').trim()
        : action.afterValue;
    const colObj = newColumns.find((c) => c.name === col);
    if (colObj) colObj.values[rowIndex] = value;
    if (newRows[rowIndex]) newRows[rowIndex][col] = value;
  });

  return { ...dataset, rows: newRows, columns: newColumns };
}

export const useBioBridgeStore = create<BioBridgeState>((set, get) => ({
  dataset: null,
  protocols: STARTER_PROTOCOLS,
  activeProtocolId: STARTER_PROTOCOLS[0].id,
  anomalyFlags: [],
  actionHistory: [],
  auditTrail: [],
  advancedModeEnabled: false,
  activePersonaId: DEFAULT_PERSONA_ID,
  currentActor: getPersona(DEFAULT_PERSONA_ID).displayName,
  pendingPromotion: null,
  lastInteractionStart: null,

  loadDataset: (dataset) => {
    const { protocols, activeProtocolId } = get();
    const protocol = getActiveProtocol(protocols, activeProtocolId);
    const loaded = { ...dataset, activeProtocolId };
    const { flags, silentActions } = detectAnomalies(loaded, protocol);
    const auditEntries = silentActions.map((a) => createAuditEntry(a, 0, 1));

    set({
      dataset: loaded,
      anomalyFlags: flags,
      actionHistory: silentActions,
      auditTrail: auditEntries,
      pendingPromotion: null,
    });
  },

  setActiveProtocol: (protocolId) => {
    const { dataset, protocols } = get();
    if (!dataset) {
      set({ activeProtocolId: protocolId });
      return;
    }
    const protocol = getActiveProtocol(protocols, protocolId);
    const updated = { ...dataset, activeProtocolId: protocolId };
    const { flags, silentActions } = detectAnomalies(updated, protocol);
    set({
      activeProtocolId: protocolId,
      dataset: updated,
      anomalyFlags: flags,
      actionHistory: silentActions,
      auditTrail: silentActions.map((a) => createAuditEntry(a, 0, 1)),
      pendingPromotion: null,
    });
  },

  commitAction: (action, humanInteractionTimeSec = 0) => {
    const start = performance.now();
    const { dataset } = get();
    if (!dataset) return;

    const updated = applyActionToDataset(dataset, action);
    const cpuTimeMs = performance.now() - start;
    const audit = createAuditEntry(action, humanInteractionTimeSec, cpuTimeMs);

    let qcFlaggedRows = dataset.qcFlaggedRows ?? [];
    if (action.type === 'flag_for_review') {
      qcFlaggedRows = [
        ...new Set([...qcFlaggedRows, ...action.target.rowIndices]),
      ];
    }

    set((state) => ({
      dataset: { ...updated, qcFlaggedRows },
      actionHistory: [...state.actionHistory, action],
      auditTrail: [...state.auditTrail, audit],
    }));
  },

  promoteToProtocol: (variant, canonical, columnName, actor) => {
    const { protocols, activeProtocolId } = get();
    if (!activeProtocolId) return;

    const start = performance.now();
    const now = new Date().toISOString();
    const action: CleaningAction = {
      id: generateId('action'),
      type: 'promote_to_protocol',
      target: { columnName, rowIndices: [] },
      beforeValues: [variant],
      afterValue: canonical,
      reason: `Added "${variant}" as known variant of "${canonical}" in protocol`,
      actor,
      timestampStart: now,
      timestampEnd: now,
    };

    const updatedProtocols = protocols.map((p) => {
      if (p.id !== activeProtocolId) return p;
      return {
        ...p,
        columnRules: p.columnRules.map((rule) => {
          if (rule.columnName !== columnName) return rule;
          return {
            ...rule,
            knownVariants: { ...rule.knownVariants, [variant]: canonical },
          };
        }),
      };
    });

    const cpuTimeMs = performance.now() - start;
    const audit = createAuditEntry(action, 2, cpuTimeMs);

    set((state) => ({
      protocols: updatedProtocols,
      actionHistory: [...state.actionHistory, action],
      auditTrail: [...state.auditTrail, audit],
      pendingPromotion: null,
    }));

    get().rerunDetection();
  },

  dismissPromotion: () => set({ pendingPromotion: null }),

  resolveFlag: (flagId, action) => {
    const { anomalyFlags, commitAction, lastInteractionStart } = get();
    const flag = anomalyFlags.find((f) => f.id === flagId);
    const interactionSec = lastInteractionStart
      ? (Date.now() - lastInteractionStart) / 1000
      : 3;

    commitAction(action, interactionSec);

    const updatedFlags = anomalyFlags.map((f) =>
      f.id === flagId ? { ...f, resolved: true } : f,
    );

    let pendingPromotion = get().pendingPromotion;
    if (flag && action.type === 'merge_cluster') {
      const protocol = getActiveProtocol(get().protocols, get().activeProtocolId);
      pendingPromotion = derivePromotionPair(flag, action, protocol) ?? pendingPromotion;
    }

    set({
      anomalyFlags: updatedFlags,
      pendingPromotion,
      lastInteractionStart: null,
    });
  },

  toggleAdvancedMode: () =>
    set((s) => ({ advancedModeEnabled: !s.advancedModeEnabled })),

  setActivePersona: (personaId) => {
    const persona = getPersona(personaId);
    set({
      activePersonaId: personaId,
      currentActor: persona.displayName,
      ...(personaId === 'elena' ? { advancedModeEnabled: false } : {}),
    });
  },

  saveProtocol: (protocol) =>
    set((state) => {
      const exists = state.protocols.some((p) => p.id === protocol.id);
      return {
        protocols: exists
          ? state.protocols.map((p) => (p.id === protocol.id ? protocol : p))
          : [...state.protocols, protocol],
      };
    }),

  cloneProtocol: (protocolId, newName) => {
    const original = get().protocols.find((p) => p.id === protocolId);
    if (!original) return;
    const clone: ProtocolTemplate = {
      ...original,
      id: generateId('protocol'),
      name: newName,
      createdAt: new Date().toISOString(),
      columnRules: original.columnRules.map((r) => ({
        ...r,
        knownVariants: r.knownVariants ? { ...r.knownVariants } : undefined,
        variantMappingRules: r.variantMappingRules?.map((mr) => ({
          ...mr,
          variants: [...mr.variants],
        })),
        variantRegexRules: r.variantRegexRules?.map((vr) => ({ ...vr })),
        allowedValues: r.allowedValues ? [...r.allowedValues] : undefined,
      })),
    };
    set((state) => ({ protocols: [...state.protocols, clone] }));
  },

  deleteProtocol: (protocolId) =>
    set((state) => ({
      protocols: state.protocols.filter((p) => p.id !== protocolId),
      activeProtocolId:
        state.activeProtocolId === protocolId ? null : state.activeProtocolId,
    })),

  startInteraction: () => set({ lastInteractionStart: Date.now() }),

  rerunDetection: () => {
    const { dataset, protocols, activeProtocolId, actionHistory } = get();
    if (!dataset) return;
    const protocol = getActiveProtocol(protocols, activeProtocolId);
    const { flags, silentActions } = detectAnomalies(dataset, protocol);
    const newSilent = silentActions.filter(
      (sa) => !actionHistory.some((a) => a.id === sa.id),
    );
    const newAudits = newSilent.map((a) => createAuditEntry(a, 0, 1));
    set((state) => ({
      anomalyFlags: flags.map((f) => {
        const wasResolved = state.anomalyFlags.find(
          (af) => af.id === f.id && af.resolved,
        );
        return wasResolved ? { ...f, resolved: true } : f;
      }),
      actionHistory: [...state.actionHistory, ...newSilent],
      auditTrail: [...state.auditTrail, ...newAudits],
    }));
  },

  applySuggestion: (suggestion) => {
    get().startInteraction();
    get().resolveFlag(suggestion.flagId, suggestion.action);
  },

  applyAllAutoSuggestions: () => {
    const { dataset, anomalyFlags, protocols, activeProtocolId } = get();
    if (!dataset) return 0;

    const protocol = getActiveProtocol(protocols, activeProtocolId);
    const suggestions = buildSuggestions({ dataset, flags: anomalyFlags, protocol });
    const auto = suggestions.filter((s) => s.autoApplicable);
    const unresolvedIds = new Set(
      anomalyFlags.filter((f) => !f.resolved).map((f) => f.id),
    );

    let applied = 0;
    auto.forEach((s) => {
      if (!unresolvedIds.has(s.flagId)) return;
      get().applySuggestion(s);
      unresolvedIds.delete(s.flagId);
      applied += 1;
    });

    if (applied > 0) {
      const { dataset: updatedDataset } = get();
      if (updatedDataset) {
        const { flags } = detectAnomalies(updatedDataset, protocol);
        set({ anomalyFlags: flags });
      }
    }
    return applied;
  },
}));
