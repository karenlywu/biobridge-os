import { useMemo, useState } from 'react';
import { useBioBridgeStore } from './store/useBioBridgeStore';
import { DropZone } from './components/upload/DropZone';
import { IngestionSummaryCard } from './components/upload/IngestionSummaryCard';
import { DataPreviewTable } from './components/workspace/DataPreviewTable';
import { AnomalyPillBar } from './components/workspace/AnomalyPillBar';
import { ClusterCard } from './components/workspace/ClusterCard';
import { NumericViolationChip } from './components/workspace/NumericViolationChip';
import { JudgmentCallCard } from './components/workspace/JudgmentCallCard';
import { MissingReplicateBanner } from './components/workspace/MissingReplicateBanner';
import { PreFlightCheckCard } from './components/workspace/PreFlightCheckCard';
import { SuggestionsPanel } from './components/workspace/SuggestionsPanel';
import { ProtocolBuilder } from './components/protocol/ProtocolBuilder';
import { DataDictionaryPanel } from './components/protocol/DataDictionaryPanel';
import { PromoteToProtocolPrompt } from './components/protocol/PromoteToProtocolPrompt';
import { CodePanel } from './components/codepanel/CodePanel';
import { AuditTrailPanel } from './components/audittrail/AuditTrailPanel';
import { CostOfCleaningSummary } from './components/audittrail/CostOfCleaningSummary';
import { HandoffReportPanel } from './components/audittrail/HandoffReportPanel';
import { Button } from './components/shared/Button';
import { CollapsibleSection } from './components/shared/CollapsibleSection';
import { AdvancedModeToggle } from './components/workspace/AdvancedModeToggle';
import { PersonaWelcomeBanner, PersonaUploadHint } from './components/shared/PersonaWelcome';
import { UserSessionBadge } from './components/shared/UserSessionBadge';
import type { AnomalyType } from './types/anomaly';
import { datasetToCsv } from './lib/codegen/generatePythonScript';
import { generateHandoffReport } from './lib/handoff/generateHandoffReport';
import { downloadTextFile } from './lib/utils';

function CleaningStudio() {
  const anomalyFlags = useBioBridgeStore((s) => s.anomalyFlags);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);
  const currentActor = useBioBridgeStore((s) => s.currentActor);
  const resolveFlag = useBioBridgeStore((s) => s.resolveFlag);
  const [filter, setFilter] = useState<AnomalyType | 'all'>('all');
  const [showTechnical, setShowTechnical] = useState(false);

  const activeProtocol = protocols.find((p) => p.id === activeProtocolId);
  const unresolved = anomalyFlags.filter((f) => !f.resolved);

  const counts = useMemo(() => {
    const c: Record<AnomalyType, number> = {
      casing_divergence: 0,
      numeric_type_violation: 0,
      missing_replicate: 0,
      missing_value: 0,
      whitespace: 0,
      schema_violation: 0,
    };
    unresolved.forEach((f) => {
      c[f.type] += 1;
    });
    return c;
  }, [unresolved]);

  const filtered = filter === 'all' ? unresolved : unresolved.filter((f) => f.type === filter);
  const replicateFlag = unresolved.find((f) => f.type === 'missing_replicate');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AnomalyPillBar
          counts={counts}
          activeFilter={filter}
          onFilter={setFilter}
          showTechnical={showTechnical}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={showTechnical}
              onChange={() => setShowTechnical(!showTechnical)}
              className="rounded border-slate-300"
            />
            Show technical terms
          </label>
          {activePersonaId === 'marcus' && <AdvancedModeToggle />}
        </div>
      </div>

      {replicateFlag && (
        <MissingReplicateBanner
          flag={replicateFlag}
          onDismiss={() =>
            resolveFlag(replicateFlag.id, {
              id: `ack_${replicateFlag.id}`,
              type: 'flag_for_review',
              target: { columnName: replicateFlag.columnName, rowIndices: [] },
              beforeValues: [],
              afterValue: null,
              reason: 'Acknowledged missing replicates',
              actor: currentActor,
              timestampStart: new Date().toISOString(),
              timestampEnd: new Date().toISOString(),
            })
          }
        />
      )}

      <div className="space-y-3">
        {filtered.map((flag) => {
          if (flag.type === 'numeric_type_violation') {
            return <NumericViolationChip key={flag.id} flag={flag} />;
          }
          if (flag.type === 'missing_value') {
            return <JudgmentCallCard key={flag.id} flag={flag} />;
          }
          if (
            flag.type === 'casing_divergence' ||
            flag.type === 'schema_violation' ||
            flag.type === 'whitespace'
          ) {
            return (
              <ClusterCard
                key={flag.id}
                flag={flag}
                protocolName={activeProtocol?.name}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

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

  const activeProtocol = protocols.find((p) => p.id === activeProtocolId);
  const showDataDictionary = Boolean(
    dataset &&
      activeProtocol?.columnRules.some((r) => r.description || r.units),
  );
  const showCostSummary = auditTrail.length > 0;
  const showHandoffReport = Boolean(dataset && auditTrail.length > 0);

  return (
    <div className="min-h-svh bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">BioBridge OS</h1>
            <p className="text-sm text-slate-500">
              {activePersonaId === 'elena'
                ? 'Clean your data before you send · Demo mode'
                : 'Protocol-aware pipeline review · Demo mode'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ProtocolBuilder />
            {dataset && (
              <>
                <Button
                  variant="secondary"
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

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 lg:px-6">
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
          <>
            <CollapsibleSection
              title={activePersonaId === 'elena' ? 'Upload lab data' : 'Review lab export'}
              subtitle={dataset.sourceFileName}
              defaultOpen={false}
            >
              <p className="mb-3 text-sm text-slate-600">
                Load a different file or demo dataset — your current session will be replaced.
              </p>
              <DropZone />
            </CollapsibleSection>

            <CollapsibleSection title="Pre-flight check" defaultOpen variant="flush">
              <PreFlightCheckCard />
            </CollapsibleSection>

            <CollapsibleSection
              title="Suggestions"
              subtitle="Auto-fixes and recommended actions"
              defaultOpen
              variant="flush"
              visible={unresolvedCount > 0}
            >
              <SuggestionsPanel />
            </CollapsibleSection>

            <CollapsibleSection
              title="Ingestion summary"
              subtitle={`${dataset.rowCount.toLocaleString()} rows · ${dataset.columns.length} columns`}
              defaultOpen
              variant="flush"
            >
              <IngestionSummaryCard />
            </CollapsibleSection>

            <CollapsibleSection
              title="Data dictionary"
              subtitle={activeProtocol?.name}
              defaultOpen={false}
              variant="flush"
              visible={showDataDictionary}
            >
              <DataDictionaryPanel />
            </CollapsibleSection>

            <div className="grid gap-4 lg:grid-cols-2">
              <CollapsibleSection title="Data preview" defaultOpen variant="flush">
                <DataPreviewTable />
              </CollapsibleSection>
              <CollapsibleSection title="Cleaning studio" defaultOpen variant="flush">
                <CleaningStudio />
              </CollapsibleSection>
            </div>

            <CollapsibleSection
              title="Cost of cleaning"
              subtitle="Human time and effort metrics"
              defaultOpen={false}
              variant="flush"
              visible={showCostSummary}
            >
              <CostOfCleaningSummary />
            </CollapsibleSection>

            <CollapsibleSection
              title="Handoff report"
              subtitle="Plain-language summary for the bench scientist"
              defaultOpen={false}
              variant="flush"
              visible={showHandoffReport}
            >
              <HandoffReportPanel />
            </CollapsibleSection>

            <div className="grid gap-4 lg:grid-cols-2">
              <CollapsibleSection title="Generated Python" defaultOpen={false} variant="flush">
                <CodePanel />
              </CollapsibleSection>
              <CollapsibleSection title="Audit trail" defaultOpen={false} variant="flush">
                <AuditTrailPanel />
              </CollapsibleSection>
            </div>
          </>
        )}
      </main>

      <PromoteToProtocolPrompt />
    </div>
  );
}
