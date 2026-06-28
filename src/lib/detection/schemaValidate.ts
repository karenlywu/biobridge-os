import type { Column } from '../../types/dataset';
import type { ColumnRule } from '../../types/protocol';
import type { AnomalyFlag } from '../../types/anomaly';
import { fuzzyMatchAllowed } from '../suggestions/canonicalSuggestions';
import { tryRegexVariantMatch } from '../protocol/regexRules';
import { generateId } from '../utils';

export interface SchemaValidateResult {
  flags: AnomalyFlag[];
  /** Row indices silently normalized via knownVariants */
  silentNormalizations: Array<{
    rowIndex: number;
    from: string;
    to: string;
    viaRegex?: string;
  }>;
}

export function schemaValidate(column: Column, rule: ColumnRule): SchemaValidateResult {
  const flags: AnomalyFlag[] = [];
  const silentNormalizations: SchemaValidateResult['silentNormalizations'] = [];

  if (rule.expectedType === 'categorical') {
    const violationsByValue = new Map<string, number[]>();

    column.values.forEach((value, rowIndex) => {
      if (value === null || value === '') return;

      const strValue = String(value).trim();

      if (rule.allowedValues?.includes(strValue)) return;

      if (rule.knownVariants && strValue in rule.knownVariants) {
        silentNormalizations.push({
          rowIndex,
          from: strValue,
          to: rule.knownVariants[strValue],
        });
        return;
      }

      if (rule.variantRegexRules?.length) {
        const regexHit = tryRegexVariantMatch(strValue, rule.variantRegexRules);
        if (regexHit) {
          let canonical = regexHit.mapsTo;
          if (canonical === '__UPPERCASE__') canonical = strValue.toUpperCase();
          silentNormalizations.push({
            rowIndex,
            from: strValue,
            to: canonical,
            viaRegex: regexHit.rule.pattern,
          });
          return;
        }
      }

      const existing = violationsByValue.get(strValue) ?? [];
      existing.push(rowIndex);
      violationsByValue.set(strValue, existing);
    });

    violationsByValue.forEach((indices, variant) => {
      const suggested = rule.allowedValues
        ? fuzzyMatchAllowed(variant, rule.allowedValues)
        : undefined;
      flags.push({
        id: generateId('anomaly'),
        type: 'schema_violation',
        columnName: column.name,
        affectedRowIndices: indices,
        detectionSource: 'schema',
        resolved: false,
        variantValues: [variant],
        canonicalValue: suggested,
        suggestedResolution: suggested,
      });
    });
  }

  if (rule.expectedType === 'numeric' && rule.numericRange) {
    const outOfRange: number[] = [];
    column.values.forEach((value, rowIndex) => {
      if (value === null || value === '') return;
      const num = Number(value);
      if (Number.isNaN(num)) return;
      const { min, max } = rule.numericRange!;
      if ((min !== undefined && num < min) || (max !== undefined && num > max)) {
        outOfRange.push(rowIndex);
      }
    });
    if (outOfRange.length) {
      flags.push({
        id: generateId('anomaly'),
        type: 'numeric_type_violation',
        columnName: column.name,
        affectedRowIndices: outOfRange,
        detectionSource: 'schema',
        resolved: false,
      });
    }
  }

  return { flags, silentNormalizations };
}

export function applySilentNormalizations(
  column: Column,
  rows: Record<string, string | number | null>[],
  normalizations: SchemaValidateResult['silentNormalizations'],
): void {
  normalizations.forEach(({ rowIndex, to }) => {
    column.values[rowIndex] = to;
    const colName = column.name;
    if (rows[rowIndex]) rows[rowIndex][colName] = to;
  });
}
