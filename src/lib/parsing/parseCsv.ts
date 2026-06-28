import Papa from 'papaparse';
import type { Dataset, SourceFormat } from '../../types/dataset';
import { generateId, inferColumnType } from '../utils';
import { enrichDatasetColumns } from './enrichDataset';

function buildDataset(
  headers: string[],
  matrix: (string | number | null)[][],
  sourceFileName: string,
  sourceFormat: SourceFormat,
): Dataset {
  const rows = matrix.map((row) => {
    const record: Record<string, string | number | null> = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? null;
    });
    return record;
  });

  const columns = headers.map((name) => {
    const values = rows.map((row) => row[name] ?? null);
    return {
      name,
      inferredType: inferColumnType(values),
      values,
    };
  });

  return {
    id: generateId('dataset'),
    sourceFileName,
    sourceFormat,
    columns,
    rows,
    rowCount: rows.length,
    activeProtocolId: null,
  };
}

export function parseCsvText(
  text: string,
  sourceFileName: string,
  delimiter?: string,
): Dataset {
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
    delimiter: delimiter ?? undefined,
  });

  if (!result.data.length) {
    throw new Error('CSV file is empty');
  }

  const [headerRow, ...dataRows] = result.data;
  const headers = headerRow.map((h) => String(h).trim());
  const matrix = dataRows.map((row) =>
    headers.map((_, i) => {
      const cell = row[i];
      if (cell === undefined || cell === '') return null;
      const num = Number(cell);
      return Number.isNaN(num) ? String(cell) : num;
    }),
  );

  const format: SourceFormat = delimiter === '\t' ? 'tsv' : 'csv';
  return enrichDatasetColumns(
    buildDataset(headers, matrix, sourceFileName, format),
  );
}

export async function parseCsvFile(file: File): Promise<Dataset> {
  const text = await file.text();
  const delimiter = file.name.endsWith('.tsv') ? '\t' : undefined;
  return parseCsvText(text, file.name, delimiter);
}
