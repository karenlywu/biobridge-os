import type { AnomalyFlag } from '../types/anomaly';
import type { CleaningAction } from '../types/action';
import type { Dataset } from '../types/dataset';
import type { ProtocolTemplate } from '../types/protocol';

export type SuggestionConfidence = 'high' | 'medium' | 'low';

export interface CleaningSuggestion {
  id: string;
  flagId: string;
  title: string;
  description: string;
  confidence: SuggestionConfidence;
  /** Safe to apply in bulk without individual review */
  autoApplicable: boolean;
  action: CleaningAction;
  /** Alternative actions if user disagrees */
  alternatives?: Array<{ label: string; action: CleaningAction }>;
  batchContext?: string;
}

export interface SuggestionSummary {
  suggestions: CleaningSuggestion[];
  autoApplicableCount: number;
  highConfidenceCount: number;
  batchDriftGroups: BatchDriftGroup[];
  ingestionWarnings: string[];
}

export interface BatchDriftGroup {
  columnName: string;
  variants: string[];
  suggestedCanonical: string;
  batchBreakdown: Array<{ batch: string; labels: string[] }>;
  explanation: string;
}

export interface BuildSuggestionContext {
  dataset: Dataset;
  flags: AnomalyFlag[];
  protocol: ProtocolTemplate | null;
}
