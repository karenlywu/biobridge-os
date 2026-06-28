import { useMemo } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { generateHandoffReport } from '../../lib/handoff/generateHandoffReport';
import { Button } from '../shared/Button';
import { downloadTextFile } from '../../lib/utils';

export function HandoffReportPanel() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const auditTrail = useBioBridgeStore((s) => s.auditTrail);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);

  const report = useMemo(() => {
    if (!dataset) return '';
    const protocol = protocols.find((p) => p.id === activeProtocolId) ?? null;
    return generateHandoffReport(dataset, auditTrail, protocol);
  }, [dataset, auditTrail, protocols, activeProtocolId]);

  if (!dataset || !auditTrail.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Handoff report for bench scientist</h3>
          <p className="text-xs text-slate-500">
            Plain-language summary of every change — send this back with your results so Elena sees
            what happened to her data.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            downloadTextFile(report, 'biobridge_handoff_report.txt', 'text/plain')
          }
        >
          Download handoff report
        </Button>
      </div>
      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
        {report}
      </pre>
    </div>
  );
}
