import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/data/sampleDatasets/demo_04_multisheet_workbook.xlsx');

const viability = [
  ['Well_ID', 'Gene_Symbol', 'Treatment_Group', 'Replicate', 'Expression_Value'],
  ['A01', 'GAPDH', 'Control', 1, 12.4],
  ['A02', 'gapdh', 'control', 2, 11.9],
  ['A03', 'GAPDH', 'Drug A', 1, 8.2],
  ['A04', 'GAPDH', 'Drug A', 2, 'ERROR'],
];

const rnaQc = [
  ['Sample_ID', 'Cell_Line', 'RIN_Score', 'Notes'],
  ['S01', 'HeLa', 9.2, ''],
  ['S02', 'hela', 'N/A', 'low yield'],
  ['S03', 'HELA', 8.8, ''],
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(viability), 'Viability_Screen');
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rnaQc), 'RNA_QC');
writeFileSync(outPath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
console.log('Wrote', outPath);
