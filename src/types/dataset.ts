export type CellValue = string | number | null;

export type ColumnType = 'categorical' | 'numeric' | 'identifier' | 'unknown';

/** Semantic role inferred from column name — drives preservation & UI hints */
export type ColumnRole =
  | 'data'
  | 'notes'
  | 'qc_flag'
  | 'batch'
  | 'identifier';

export interface Column {
  name: string;
  inferredType: ColumnType;
  values: CellValue[];
  role?: ColumnRole;
}

export type SourceFormat = 'csv' | 'tsv' | 'xlsx' | 'xls' | 'ods' | 'pasted';

export interface Dataset {
  id: string;
  sourceFileName: string;
  sourceFormat: SourceFormat;
  columns: Column[];
  rows: Record<string, CellValue>[];
  rowCount: number;
  activeProtocolId: string | null;
  /** Row indices flagged for QC follow-up during cleaning */
  qcFlaggedRows?: number[];
}
