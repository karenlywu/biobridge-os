import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { DEMO_FILES } from '../../data/demoManifest';
import { parseCsvText } from '../../lib/parsing/parseCsv';
import { parseExcelSheet } from '../../lib/parsing/parseExcel';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useState } from 'react';

const RAW_IMPORTS: Record<string, () => Promise<{ default: string }>> = {
  demo_01: () => import('../../data/sampleDatasets/demo_01_plate_viability_assay.csv?raw'),
  demo_02: () => import('../../data/sampleDatasets/demo_02_qpcr_gene_expression.csv?raw'),
  demo_03: () => import('../../data/sampleDatasets/demo_03_multibatch_consolidated_export.csv?raw'),
  demo_05: () => import('../../data/sampleDatasets/demo_05_instrument_export.tsv?raw'),
  demo_06: () => import('../../data/sampleDatasets/demo_06_clean_baseline.csv?raw'),
  demo_07: () => import('../../data/sampleDatasets/demo_07_live_demo_dirty.csv?raw'),
};

export function DemoGallery() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const loadDataset = useBioBridgeStore((s) => s.loadDataset);
  const setActiveProtocol = useBioBridgeStore((s) => s.setActiveProtocol);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const [pendingDemoId, setPendingDemoId] = useState<string | null>(null);

  const loadDemo = async (demoId: string) => {
    const spec = DEMO_FILES.find((d) => d.id === demoId);
    if (!spec) return;

    if (spec.format === 'xlsx') {
      const url = new URL(
        '../../data/sampleDatasets/demo_04_multisheet_workbook.xlsx',
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
  };

  const handleDemoClick = (demoId: string) => {
    if (dataset) setPendingDemoId(demoId);
    else void loadDemo(demoId);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-900">Demo datasets</h3>
      <p className="mt-1 text-sm text-slate-500">
        Built from real handoff pain points — each file targets a specific failure mode.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_FILES.map((demo) => (
          <button
            key={demo.id}
            type="button"
            onClick={() => handleDemoClick(demo.id)}
            className={`rounded-lg border p-3 text-left transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              demo.id === 'demo_07'
                ? 'border-brand-400 bg-brand-50/50 ring-1 ring-brand-200'
                : 'border-slate-200'
            }`}
          >
            <p className="font-medium text-slate-900">{demo.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{demo.fileName}</p>
            <p className="mt-2 line-clamp-2 text-xs text-slate-600">{demo.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {demo.highlights.slice(0, 2).map((h) => (
                <span
                  key={h}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                >
                  {h}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDemoId !== null}
        title="Replace current session?"
        message="Loading a demo dataset will discard your current cleaning progress and audit trail for this session."
        confirmLabel="Load demo"
        variant="danger"
        onConfirm={() => {
          if (pendingDemoId) void loadDemo(pendingDemoId).then(() => setPendingDemoId(null));
        }}
        onCancel={() => setPendingDemoId(null)}
      />
    </div>
  );
}
