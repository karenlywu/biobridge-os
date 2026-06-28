export type AnomalyType =
  | 'casing_divergence'
  | 'numeric_type_violation'
  | 'missing_replicate'
  | 'missing_value'
  | 'whitespace'
  | 'schema_violation';

export type DetectionSource = 'schema' | 'heuristic';

export interface AnomalyFlag {
  id: string;
  type: AnomalyType;
  columnName: string;
  affectedRowIndices: number[];
  detectionSource: DetectionSource;
  suggestedResolution?: string;
  resolved: boolean;
  /** Raw variant values grouped in this flag (cluster cards) */
  variantValues?: string[];
  /** Canonical target for merge suggestions */
  canonicalValue?: string;
  /** Sub-classification for judgment-call routing */
  detail?: 'empty' | 'ambiguous_whitespace' | 'separator_variant';
}
