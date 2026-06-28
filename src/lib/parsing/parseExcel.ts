import * as XLSX from 'xlsx';
import type { Dataset, SourceFormat } from '../../types/dataset';
import { generateId, inferColumnType } from '../utils';
import { enrichDatasetColumns } from './enrichDataset';

export interface SheetInfo {
  name: string;
  rowCount: number;
  preview: string[][];
}

export function listSheets(file: ArrayBuffer): SheetInfo[] {
  const workbook = XLSX.read(file, { type: 'array' });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      defval: null,
    }) as (string | number | null)[][];
    return {
      name,
      rowCount: Math.max(0, rows.length - 1),
      preview: rows.slice(0, 5).map((r) => r.map((c) => (c === null ? '' : String(c)))),
    };
  });
}

function sourceFormatFromName(fileName: string): SourceFormat {
  if (fileName.endsWith('.xls')) return 'xls';
  if (fileName.endsWith('.ods')) return 'ods';
  return 'xlsx';
}

export function parseExcelSheet(
  file: ArrayBuffer,
  fileName: string,
  sheetName: string,
): Dataset {
  const workbook = XLSX.read(file, { type: 'array' });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  const raw = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
  }) as (string | number | null)[][];

  if (!raw.length) throw new Error('Sheet is empty');

  const [headerRow, ...dataRows] = raw;
  const headers = headerRow.map((h) => String(h ?? '').trim()).filter(Boolean);
  const rows = dataRows.map((row) => {
    const record: Record<string, string | number | null> = {};
    headers.forEach((header, index) => {
      const cell = row[index];
      record[header] = cell === undefined || cell === '' ? null : cell;
    });
    return record;
  });

  const columns = headers.map((name) => {
    const values = rows.map((row) => row[name] ?? null);
    return { name, inferredType: inferColumnType(values), values };
  });

  return enrichDatasetColumns({
    id: generateId('dataset'),
    sourceFileName: fileName,
    sourceFormat: sourceFormatFromName(fileName),
    columns,
    rows,
    rowCount: rows.length,
    activeProtocolId: null,
  });
}

export async function readExcelFile(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}
