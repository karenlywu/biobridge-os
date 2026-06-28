import { useCallback, useState } from 'react';
import { useBioBridgeStore } from '../store/useBioBridgeStore';
import type { Dataset } from '../types/dataset';

export function useDatasetLoadConfirm() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const loadDataset = useBioBridgeStore((s) => s.loadDataset);
  const [pending, setPending] = useState<Dataset | null>(null);

  const requestLoad = useCallback(
    (next: Dataset) => {
      if (!dataset) {
        loadDataset(next);
        return;
      }
      setPending(next);
    },
    [dataset, loadDataset],
  );

  const confirmLoad = useCallback(() => {
    if (pending) {
      loadDataset(pending);
      setPending(null);
    }
  }, [pending, loadDataset]);

  const cancelLoad = useCallback(() => setPending(null), []);

  return {
    requestLoad,
    confirmLoad,
    cancelLoad,
    pendingLoad: pending,
    confirmOpen: pending !== null,
  };
}
