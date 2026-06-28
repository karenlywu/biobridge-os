let counter = 0;

export function generateId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}`;
}

export function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** True when variants differ only by separators/spaces (e.g. "IPTG 1mM" vs "IPTG_1mM") */
export function isSeparatorVariant(a: string, b: string): boolean {
  return normalizeKey(a) === normalizeKey(b) && a.trim() !== b.trim();
}

export function inferColumnType(values: (string | number | null)[]): 'categorical' | 'numeric' | 'identifier' | 'unknown' {
  const nonNull = values.filter((v) => v !== null && v !== '');
  if (nonNull.length === 0) return 'unknown';

  const numericCount = nonNull.filter((v) => !Number.isNaN(Number(v))).length;
  if (numericCount / nonNull.length >= 0.8) return 'numeric';

  const uniqueRatio = new Set(nonNull.map(String)).size / nonNull.length;
  if (uniqueRatio > 0.9 && nonNull.length > 5) return 'identifier';

  return 'categorical';
}

export function formatAuditTarget(columnName: string, rowIndex: number): string {
  return `Row ${rowIndex + 1}, ${columnName}`;
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const PREVIEW_ROW_LIMIT = 2000;
export const LARGE_FILE_THRESHOLD = 50000;

export const DEFAULT_ACTOR = 'Dr. Elena Vance';
export const PROTOCOL_AUTHOR = 'Marcus Chen';
