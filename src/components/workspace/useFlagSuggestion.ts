import { useMemo } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { buildSuggestions } from '../../lib/suggestions/buildSuggestions';
import type { AnomalyFlag } from '../../types/anomaly';

export function useFlagSuggestion(flag: AnomalyFlag) {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const flags = useBioBridgeStore((s) => s.anomalyFlags);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);

  return useMemo(() => {
    if (!dataset || flag.resolved) return null;
    const protocol = protocols.find((p) => p.id === activeProtocolId) ?? null;
    return buildSuggestions({ dataset, flags, protocol }).find((s) => s.flagId === flag.id) ?? null;
  }, [dataset, flags, protocols, activeProtocolId, flag.id, flag.resolved]);
}
