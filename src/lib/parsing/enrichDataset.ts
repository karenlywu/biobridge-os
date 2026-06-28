import type { Column, Dataset, ColumnRole } from '../../types/dataset';

const NOTES_PATTERNS = /^(notes?|comment|remark|qc_note|bench_note|quality_note)/i;
const QC_PATTERNS = /^(qc_flag|qc|quality_flag|flag|exclude|review)/i;
const BATCH_PATTERNS = /^(batch|run_day|export_day|plate_day|session)/i;

export function inferColumnRole(name: string): ColumnRole {
  if (NOTES_PATTERNS.test(name)) return 'notes';
  if (QC_PATTERNS.test(name)) return 'qc_flag';
  if (BATCH_PATTERNS.test(name)) return 'batch';
  if (/^(well|sample_?id|plate_?id|gene_?symbol|gene)$/i.test(name)) return 'identifier';
  return 'data';
}

export function enrichDatasetColumns(dataset: Dataset): Dataset {
  const columns = dataset.columns.map((col) => ({
    ...col,
    role: col.role ?? inferColumnRole(col.name),
  }));
  return { ...dataset, columns, qcFlaggedRows: dataset.qcFlaggedRows ?? [] };
}

export function getNotesColumns(dataset: Dataset): Column[] {
  return dataset.columns.filter((c) => c.role === 'notes');
}

export function getBatchColumn(dataset: Dataset): Column | undefined {
  return dataset.columns.find((c) => c.role === 'batch');
}

export function getQcColumn(dataset: Dataset): Column | undefined {
  return dataset.columns.find((c) => c.role === 'qc_flag');
}
