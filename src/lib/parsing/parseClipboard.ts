import type { Dataset } from '../../types/dataset';
import { parseCsvText } from './parseCsv';

export function parseClipboardText(text: string): Dataset {
  const delimiter = text.includes('\t') ? '\t' : ',';
  return parseCsvText(text, 'pasted-data.csv', delimiter === '\t' ? '\t' : ',');
}

export function parseClipboardToDataset(text: string): Dataset {
  const dataset = parseClipboardText(text);
  return { ...dataset, sourceFormat: 'pasted', sourceFileName: 'pasted-data' };
}
