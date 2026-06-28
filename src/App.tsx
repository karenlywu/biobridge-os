import { useMemo } from 'react';
import { useBioBridgeStore } from './store/useBioBridgeStore';
import { DropZone } from './components/upload/DropZone';
import { ProtocolBuilder } from './components/protocol/ProtocolBuilder';
import { ProtocolSelector } from './components/protocol/ProtocolSelector';
import { PromoteToProtocolPrompt } from './components/protocol/PromoteToProtocolPrompt';
import { Button } from './components/shared/Button';
import { PersonaWelcomeBanner, PersonaUploadHint } from './components/shared/PersonaWelcome';
import { UserSessionBadge } from './components/shared/UserSessionBadge';
import { WorkspacePanels } from './components/workspace/WorkspacePanels';
import { datasetToCsv } from './lib/codegen/generatePythonScript';
import { generateHandoffReport } from './lib/handoff/generateHandoffReport';
import { downloadTextFile } from './lib/utils';

export default function App() {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const auditTrail = useBioBridgeStore((s) => s.auditTrail);
  const anomalyFlags = useBioBridgeStore((s) => s.anomalyFlags);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);

  const unresolvedCount = useMemo(
    () => anomalyFlags.filter((f) => !f.resolved).length,
    [anomalyFlags],
  );

  const canExportHandoff = auditTrail.length > 0;

  return (
    <div className="min-h-svh bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">BioBridge OS</h1>
            <p className="text-sm text-slate-500">
              {activePersonaId === 'elena'
                ? 'Clean your data before you send'
                : 'Protocol-aware pipeline review'}
              {dataset && unresolvedCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {unresolvedCount} issue{unresolvedCount !== 1 ? 's' : ''} open
                </span>
              )}
              {dataset && unresolvedCount === 0 && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  Ready to export
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {dataset && <ProtocolSelector />}
            <ProtocolBuilder />
            {dataset && (
              <>
                <Button
                  variant="secondary"
                  title={
                    unresolvedCount > 0
                      ? `${unresolvedCount} unresolved issue(s) will remain in export`
                      : undefined
                  }
                  onClick={() =>
                    downloadTextFile(
                      datasetToCsv(dataset),
                      `cleaned_${dataset.sourceFileName}`,
                      'text/csv',
                    )
                  }
                >
                  Export cleaned CSV
                </Button>
                <Button
                  variant="secondary"
                  disabled={!canExportHandoff}
                  title={
                    canExportHandoff
                      ? undefined
                      : 'Apply at least one fix to generate a handoff report'
                  }
                  onClick={() => {
                    const protocol =
                      protocols.find((p) => p.id === activeProtocolId) ?? null;
                    downloadTextFile(
                      generateHandoffReport(dataset, auditTrail, protocol),
                      'biobridge_handoff_report.txt',
                      'text/plain',
                    );
                  }}
                >
                  Handoff report
                </Button>
              </>
            )}
            <UserSessionBadge />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {!dataset ? (
          <section>
            <PersonaWelcomeBanner />
            <h2 className="mb-2 text-lg font-semibold text-slate-800">
              {activePersonaId === 'elena' ? 'Upload lab data' : 'Review lab export'}
            </h2>
            <PersonaUploadHint />
            <DropZone />
          </section>
        ) : (
          <WorkspacePanels />
        )}
      </main>

      <PromoteToProtocolPrompt />
    </div>
  );
}
