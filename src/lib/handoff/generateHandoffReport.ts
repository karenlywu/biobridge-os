import type { AuditEntry } from '../../types/audit';
import type { Dataset } from '../../types/dataset';
import type { ProtocolTemplate } from '../../types/protocol';

const ACTION_PLAIN: Record<string, (e: AuditEntry) => string> = {
  merge_cluster: (e) =>
    `Renamed "${e.beforeValue}" → "${e.afterValue}" in ${e.target} (${e.reason})`,
  impute_value: (e) =>
    `Filled in ${e.target}: set to ${e.afterValue ?? 'blank'} because "${e.reason}"`,
  exclude_value: (e) =>
    `Excluded ${e.target} from numeric analysis (${e.reason})`,
  flag_for_review: (e) =>
    `Flagged ${e.target} for follow-up: ${e.reason}`,
  type_coerce: (e) => `Converted ${e.target} to numeric format`,
  regex_transform: (e) => `Applied custom pattern fix on ${e.target}`,
  promote_to_protocol: (e) =>
    `Added "${e.beforeValue}" as a recognized variant of "${e.afterValue}" for future uploads`,
};

export function generateHandoffReport(
  dataset: Dataset,
  auditTrail: AuditEntry[],
  protocol: ProtocolTemplate | null,
): string {
  const lines: string[] = [
    'BioBridge OS — Data Cleaning Handoff Report',
    '============================================',
    '',
    `Original file: ${dataset.sourceFileName}`,
    `Rows: ${dataset.rowCount}`,
    `Report generated: ${new Date().toLocaleString()}`,
    '',
    '--- Summary for bench scientist ---',
    '',
    `Total cleaning decisions recorded: ${auditTrail.length}`,
    '',
  ];

  if (protocol) {
    lines.push(`Assay protocol used: ${protocol.name}`);
    lines.push('');
    lines.push('Column definitions (data dictionary):');
    protocol.columnRules.forEach((rule) => {
      const parts = [rule.columnName, `type: ${rule.expectedType}`];
      if (rule.description) parts.push(rule.description);
      if (rule.units) parts.push(`units: ${rule.units}`);
      lines.push(`  • ${parts.join(' · ')}`);
    });
    lines.push('');
  }

  const manualActions = auditTrail.filter(
    (e) => e.humanInteractionTimeSec > 0 || e.actionType === 'promote_to_protocol',
  );
  const autoActions = auditTrail.filter(
    (e) => e.humanInteractionTimeSec === 0 && e.actionType !== 'promote_to_protocol',
  );

  if (manualActions.length) {
    lines.push('Changes you made (or approved):');
    manualActions.forEach((e, i) => {
      const plain = ACTION_PLAIN[e.actionType]?.(e) ?? e.reason;
      lines.push(`  ${i + 1}. ${plain}`);
      lines.push(`     By: ${e.actor} · ${new Date(e.timestampEnd).toLocaleString()}`);
    });
    lines.push('');
  }

  if (autoActions.length) {
    lines.push('Auto-normalized (no action needed from you):');
    autoActions.forEach((e, i) => {
      const plain = ACTION_PLAIN[e.actionType]?.(e) ?? e.reason;
      lines.push(`  ${i + 1}. ${plain}`);
    });
    lines.push('');
  }

  const notesCols = dataset.columns.filter((c) => c.role === 'notes');
  if (notesCols.length) {
    lines.push('Notes columns preserved in export:');
    notesCols.forEach((c) => lines.push(`  • ${c.name}`));
    lines.push('');
  }

  if (dataset.qcFlaggedRows?.length) {
    lines.push(`Rows flagged for QC follow-up: ${dataset.qcFlaggedRows.map((r) => r + 1).join(', ')}`);
    lines.push('');
  }

  lines.push('---');
  lines.push(
    'This report accompanies the cleaned dataset and Python script. Every change above is reproducible from the generated code.',
  );

  return lines.join('\n');
}
