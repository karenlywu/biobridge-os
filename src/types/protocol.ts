export type ExpectedType = 'categorical' | 'numeric' | 'identifier';

/** Marcus-facing: regex → canonical mapping (optional advanced protocol rules) */
export interface VariantRegexRule {
  /** JavaScript regex pattern, e.g. ^ctrl(_\\w+)?$ */
  pattern: string;
  /** Canonical allowed value when pattern matches */
  mapsTo: string;
  /** Plain-language note for audit trail / data dictionary */
  label?: string;
}

export interface ColumnRule {
  columnName: string;
  expectedType: ExpectedType;
  allowedValues?: string[];
  knownVariants?: Record<string, string>;
  /** Optional regex rules — comp bio only; checked after exact knownVariants */
  variantRegexRules?: VariantRegexRule[];
  numericRange?: { min?: number; max?: number };
  expectedReplicateCount?: number;
  description?: string;
  units?: string;
  preserveInExport?: boolean;
}

export interface ProtocolTemplate {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  columnRules: ColumnRule[];
}
