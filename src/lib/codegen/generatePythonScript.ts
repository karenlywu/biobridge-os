import type { CleaningAction } from '../../types/action';
import type { Dataset } from '../../types/dataset';

function pyValue(value: string | number | null): string {
  if (value === null) return 'np.nan';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "\\'")}'`;
}

export function generatePythonScript(
  dataset: Dataset | null,
  actions: CleaningAction[],
): string {
  if (!dataset) {
    return `# BioBridge OS — no dataset loaded\nimport pandas as pd\nimport numpy as np\n`;
  }

  const lines: string[] = [
    '# BioBridge OS — auto-generated cleaning script',
    `# Source: ${dataset.sourceFileName}`,
    `# Generated: ${new Date().toISOString()}`,
    '',
    'import pandas as pd',
    'import numpy as np',
    '',
    `# Load original file (${dataset.rowCount} rows)`,
    `df = pd.read_csv('${dataset.sourceFileName}')`,
    '',
  ];

  actions.forEach((action, index) => {
    const auditNum = String(index + 1).padStart(3, '0');
    const col = action.target.columnName;

    if (action.protocolName && action.variantKey) {
      if (action.regexPattern) {
        lines.push(`# [Audit #${auditNum}] Auto-normalized via Protocol "${action.protocolName}" (regex)`);
        lines.push(`# Pattern: /${action.regexPattern}/i matched '${action.variantKey}' -> '${action.afterValue}'`);
      } else {
        lines.push(`# [Audit #${auditNum}] Auto-normalized via Protocol "${action.protocolName}"`);
        lines.push(`# Known variant: '${action.variantKey}' -> '${action.afterValue}' (no manual review needed)`);
      }
      lines.push(`df['${col}'] = df['${col}'].replace({${pyValue(action.variantKey)}: ${pyValue(action.afterValue)}})`);
    } else if (action.type === 'merge_cluster') {
      const variants = [...new Set(action.beforeValues.map(String))];
      variants.forEach((v) => {
        lines.push(`# [Audit #${auditNum}] ${action.actor} — ${action.reason} — ${action.timestampEnd.slice(0, 16).replace('T', ' ')}`);
        lines.push(`df['${col}'] = df['${col}'].replace({${pyValue(v)}: ${pyValue(action.afterValue)}})`);
      });
    } else if (action.type === 'impute_value') {
      action.target.rowIndices.forEach((ri) => {
        lines.push(`# [Audit #${auditNum}] ${action.actor} flagged as "${action.reason}" — ${action.timestampEnd.slice(0, 16).replace('T', ' ')}`);
        lines.push(`df.loc[${ri}, '${col}'] = ${pyValue(action.afterValue)}`);
      });
    } else if (action.type === 'exclude_value') {
      action.target.rowIndices.forEach((ri) => {
        lines.push(`# [Audit #${auditNum}] ${action.actor} — ${action.reason}`);
        lines.push(`df.loc[${ri}, '${col}'] = np.nan`);
      });
    } else if (action.type === 'regex_transform') {
      lines.push(`# [Audit #${auditNum}] ${action.actor} — regex transform: ${action.reason}`);
      lines.push(`df['${col}'] = df['${col}'].astype(str).str.replace(r'${action.reason}', ${pyValue(action.afterValue)}, regex=True)`);
    } else if (action.type === 'promote_to_protocol') {
      lines.push(`# [Audit #${auditNum}] ${action.actor} promoted variant to protocol`);
      lines.push(`# '${action.beforeValues[0]}' -> '${action.afterValue}' in column '${col}'`);
    } else if (action.type === 'type_coerce') {
      lines.push(`# [Audit #${auditNum}] ${action.actor} — type coercion`);
      lines.push(`df['${col}'] = pd.to_numeric(df['${col}'], errors='coerce')`);
    } else {
      lines.push(`# [Audit #${auditNum}] ${action.actor} — ${action.reason}`);
    }
    lines.push('');
  });

  lines.push('# Export cleaned dataset');
  lines.push("df.to_csv('cleaned_output.csv', index=False)");
  lines.push("print(f'Cleaned {len(df)} rows')");

  return lines.join('\n');
}

export function datasetToCsv(dataset: Dataset): string {
  const headers = dataset.columns.map((c) => c.name);
  const hasQc = (dataset.qcFlaggedRows?.length ?? 0) > 0;
  const exportHeaders = hasQc ? [...headers, 'QC_Flag'] : headers;

  const rows = dataset.rows.map((row, rowIndex) => {
    const cells = headers.map((h) => {
      const v = row[h];
      if (v === null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    });
    if (hasQc) {
      cells.push(dataset.qcFlaggedRows!.includes(rowIndex) ? 'TRUE' : 'FALSE');
    }
    return cells.join(',');
  });

  return [exportHeaders.join(','), ...rows].join('\n');
}
