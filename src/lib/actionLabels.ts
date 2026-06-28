import type { ActionType } from '../types/action';

const ACTION_LABELS: Record<ActionType, string> = {
  merge_cluster: 'Merged labels',
  impute_value: 'Filled missing value',
  exclude_value: 'Excluded value',
  flag_for_review: 'Flagged for review',
  type_coerce: 'Fixed data type',
  regex_transform: 'Applied pattern fix',
  promote_to_protocol: 'Added to protocol',
};

export function actionTypeLabel(type: ActionType): string {
  return ACTION_LABELS[type] ?? type.replace(/_/g, ' ');
}
