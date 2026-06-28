export interface DemoFileSpec {
  id: string;
  fileName: string;
  format: 'csv' | 'tsv' | 'xlsx';
  title: string;
  persona: 'elena' | 'marcus' | 'both';
  description: string;
  highlights: string[];
  /** Suggested protocol id key — matched by name substring */
  suggestedProtocol?: string;
}

export const DEMO_FILES: DemoFileSpec[] = [
  {
    id: 'demo_01',
    fileName: 'demo_01_plate_viability_assay.csv',
    format: 'csv',
    title: 'Plate viability screen',
    persona: 'both',
    description: 'Classic 96-well export with treatment naming drift, gene symbol casing, instrument error codes, and a missing replicate.',
    highlights: [
      'Control vs control vs ctrl_r2 vs " CONTROL_REP1"',
      'GAPDH vs gapdh gene symbols',
      'ERROR / LOW_QUALITY / N/A / <LOD in numeric columns',
      'ACTB × Drug B missing Rep 2',
    ],
    suggestedProtocol: '96-well viability',
  },
  {
    id: 'demo_02',
    fileName: 'demo_02_qpcr_gene_expression.csv',
    format: 'csv',
    title: 'qPCR gene expression',
    persona: 'elena',
    description: 'Cell-line naming drift and Undetermined Ct values — routes through judgment-call cards.',
    highlights: [
      'HeLa / hela / HELA casing',
      'Undetermined Ct values',
      'Blank vs space-only cell (judgment call)',
    ],
    suggestedProtocol: 'qPCR',
  },
  {
    id: 'demo_03',
    fileName: 'demo_03_multibatch_consolidated_export.csv',
    format: 'csv',
    title: '5-day batch consolidation',
    persona: 'marcus',
    description: 'Five export days merged — simulates naming drift when different lab members label controls differently.',
    highlights: [
      'Ctrl → control → CTRL → ctrl → Vehicle across batches',
      'Batch column tracks export day',
      'Multi-person naming conventions',
    ],
    suggestedProtocol: 'Multi-batch',
  },
  {
    id: 'demo_04',
    fileName: 'demo_04_multisheet_workbook.xlsx',
    format: 'xlsx',
    title: 'Multi-sheet workbook',
    persona: 'both',
    description: 'Tests sheet-picker UI — Viability_Screen and RNA_QC sheets with separate anomalies.',
    highlights: ['Sheet picker UI', 'Per-sheet anomaly profiles'],
    suggestedProtocol: '96-well viability',
  },
  {
    id: 'demo_05',
    fileName: 'demo_05_instrument_export.tsv',
    format: 'tsv',
    title: 'Instrument TSV export',
    persona: 'marcus',
    description: 'Tab-delimited instrument output with separator trap: "IPTG 1mM" vs "IPTG_1mM".',
    highlights: ['TSV parsing', 'Space vs underscore in inducer labels'],
  },
  {
    id: 'demo_07',
    fileName: 'demo_07_live_demo_dirty.csv',
    format: 'csv',
    title: '⭐ Live demo (dirty handoff)',
    persona: 'both',
    description: 'All-in-one messy file for live presentations — load this for the Elena → Marcus walkthrough.',
    highlights: [
      'Full handoff story in one file',
      'Regex + promote + auto-fix demo',
      'See docs/LIVE_DEMO_SCRIPT.md',
    ],
    suggestedProtocol: '96-well viability',
  },
  {
    id: 'demo_06',
    fileName: 'demo_06_clean_baseline.csv',
    format: 'csv',
    title: 'Clean baseline (zero flags)',
    persona: 'both',
    description: 'Perfectly formatted file — verifies the "Dataset is clean ✓" success state.',
    highlights: ['Zero anomalies', 'Clean export path'],
    suggestedProtocol: '96-well viability',
  },
];
