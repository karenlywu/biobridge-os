import { useCallback, useState } from 'react';
import { useBioBridgeStore } from '../store/useBioBridgeStore';
import { DEMO_FILES } from '../data/demoManifest';
import { parseCsvText } from '../lib/parsing/parseCsv';
import { parseExcelSheet } from '../lib/parsing/parseExcel';

const RAW_IMPORTS: Record<string, () => Promise<{ default: string }>> = {
  demo_01: () => import('../data/sampleDatasets/demo_01_plate_viability_assay.csv?raw'),
  demo_02: () => import('../data/sampleDatasets/demo_02_qpcr_gene_expression.csv?raw'),
  demo_03: () => import('../data/sampleDatasets/demo_03_multibatch_consolidated_export.csv?raw'),
  demo_05: () => import('../data/sampleDatasets/demo_05_instrument_export.tsv?raw'),
  demo_06: () => import('../data/sampleDatasets/demo_06_clean_baseline.csv?raw'),
  demo_07: () => import('../data/sampleDatasets/demo_07_live_demo_dirty.csv?raw'),
};

export function useLoadDemo() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const loadDataset = useBioBridgeStore((s) => s.loadDataset);
  const setActiveProtocol = useBioBridgeStore((s) => s.setActiveProtocol);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const [pendingDemoId, setPendingDemoId] = useState<string | null>(null);

  const loadDemo = useCallback(
    async (demoId: string) => {
      const spec = DEMO_FILES.find((d) => d.id === demoId);
      if (!spec) return;

      if (spec.format === 'xlsx') {
        const url = new URL(
          '../data/sampleDatasets/demo_04_multisheet_workbook.xlsx',
          import.meta.url,
        );
        const buffer = await fetch(url).then((r) => r.arrayBuffer());
        loadDataset(parseExcelSheet(buffer, spec.fileName, 'Viability_Screen'));
      } else {
        const loader = RAW_IMPORTS[demoId];
        if (!loader) return;
        const text = (await loader()).default;
        const delimiter = spec.format === 'tsv' ? '\t' : undefined;
        loadDataset(parseCsvText(text, spec.fileName, delimiter));
      }

      if (spec.suggestedProtocol) {
        const match = protocols.find((p) =>
          p.name.toLowerCase().includes(spec.suggestedProtocol!.toLowerCase().split(' ')[0]!),
        );
        if (match) setActiveProtocol(match.id);
      }
    },
    [loadDataset, protocols, setActiveProtocol],
  );

  const requestDemo = useCallback(
    (demoId: string) => {
      if (dataset) setPendingDemoId(demoId);
      else void loadDemo(demoId);
    },
    [dataset, loadDemo],
  );

  const confirmPending = useCallback(async () => {
    if (pendingDemoId) {
      await loadDemo(pendingDemoId);
      setPendingDemoId(null);
    }
  }, [pendingDemoId, loadDemo]);

  const cancelPending = useCallback(() => setPendingDemoId(null), []);

  return {
    requestDemo,
    loadDemo,
    confirmPending,
    cancelPending,
    pendingDemoId,
    confirmOpen: pendingDemoId !== null,
  };
}
