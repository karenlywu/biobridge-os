import type { Dataset } from '../../types/dataset';
import type { ProtocolTemplate } from '../../types/protocol';
import type { AnomalyFlag } from '../../types/anomaly';
import type { CleaningAction } from '../../types/action';
import { schemaValidate, applySilentNormalizations } from './schemaValidate';
import {
  fuzzyClusterDetect,
  semanticClusterDetect,
  mergeClusterFlags,
  detectWhitespace,
  detectMissingValues,
} from './fuzzyCluster';
import { typeViolationDetect } from './typeViolations';
import { replicateCheck } from './replicateCheck';
import { generateId, DEFAULT_ACTOR } from '../utils';

function heuristicDetectColumn(column: import('../../types/dataset').Column): AnomalyFlag[] {
  const semantic = semanticClusterDetect(column);
  const fuzzy = fuzzyClusterDetect(column);
  const clusters = mergeClusterFlags(semantic, fuzzy);
  return [
    ...clusters,
    ...typeViolationDetect(column),
    ...detectWhitespace(column),
    ...detectMissingValues(column),
  ];
}

export interface DetectResult {
  flags: AnomalyFlag[];
  silentActions: CleaningAction[];
}

export function detectAnomalies(
  dataset: Dataset,
  activeProtocol: ProtocolTemplate | null,
): DetectResult {
  let flags: AnomalyFlag[] = [];
  const silentActions: CleaningAction[] = [];

  for (const column of dataset.columns) {
    const rule = activeProtocol?.columnRules.find((r) => r.columnName === column.name);

    if (rule && activeProtocol) {
      const { flags: schemaFlags, silentNormalizations } = schemaValidate(column, rule);
      flags = flags.concat(schemaFlags);

      if (silentNormalizations.length) {
        applySilentNormalizations(column, dataset.rows, silentNormalizations);
        silentNormalizations.forEach(({ rowIndex, from, to, viaRegex }) => {
          silentActions.push({
            id: generateId('action'),
            type: 'merge_cluster',
            target: { columnName: column.name, rowIndices: [rowIndex] },
            beforeValues: [from],
            afterValue: to,
            reason: viaRegex
              ? `Auto-normalized via Protocol regex /${viaRegex}/i`
              : `Auto-normalized via Protocol "${activeProtocol.name}"`,
            actor: DEFAULT_ACTOR,
            timestampStart: new Date().toISOString(),
            timestampEnd: new Date().toISOString(),
            protocolName: activeProtocol.name,
            variantKey: from,
            regexPattern: viaRegex,
          });
        });
      }

      // Still run whitespace/missing on schema-governed columns
      flags = flags.concat(detectWhitespace(column));
      flags = flags.concat(detectMissingValues(column));

      if (rule.expectedType === 'numeric') {
        flags = flags.concat(typeViolationDetect(column));
      }
    } else {
      flags = flags.concat(heuristicDetectColumn(column));
    }
  }

  flags = flags.concat(replicateCheck(dataset, activeProtocol));
  return { flags, silentActions };
}
