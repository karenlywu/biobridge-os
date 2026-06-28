import type { CellValue } from './dataset';

export type ActionType =
  | 'merge_cluster'
  | 'impute_value'
  | 'exclude_value'
  | 'flag_for_review'
  | 'type_coerce'
  | 'regex_transform'
  | 'promote_to_protocol';

export interface CleaningAction {
  id: string;
  type: ActionType;
  target: { columnName: string; rowIndices: number[] };
  beforeValues: CellValue[];
  afterValue: CellValue;
  reason: string;
  actor: string;
  timestampStart: string;
  timestampEnd: string;
  /** Set when action came from schema auto-normalization */
  protocolName?: string;
  variantKey?: string;
  /** Protocol regex rule pattern when auto-normalized via regex */
  regexPattern?: string;
}
