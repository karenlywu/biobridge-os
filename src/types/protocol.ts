export type ExpectedType = 'categorical' | 'numeric' | 'identifier';

/** Plain-language variant list → canonical (Elena-friendly protocol rules) */
export interface VariantMappingRule {
  /** Alternate spellings that should map to the same canonical value */
  variants: string[];
  mapsTo: string;
  label?: string;
}

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
  /** Grouped spelling variants → canonical; checked before regex rules */
  variantMappingRules?: VariantMappingRule[];
  /** Optional regex rules — comp bio only; checked after mapping rules */
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
