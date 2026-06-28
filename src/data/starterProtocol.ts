import type { ProtocolTemplate } from '../types/protocol';
import { generateId, PROTOCOL_AUTHOR } from '../lib/utils';

export const starterProtocol: ProtocolTemplate = {
  id: generateId('protocol'),
  name: '96-well viability screen v1',
  createdBy: PROTOCOL_AUTHOR,
  createdAt: '2026-06-01T10:00:00.000Z',
  columnRules: [
    {
      columnName: 'Treatment_Group',
      expectedType: 'categorical',
      allowedValues: ['Control', 'Drug A', 'Drug B', 'Drug C'],
      knownVariants: { control: 'Control', vehicle: 'Control' },
      variantRegexRules: [
        { pattern: '^ctrl(_\\w+)?$', mapsTo: 'Control', label: 'ctrl* abbreviations' },
        { pattern: '^drug[\\s_-]?a', mapsTo: 'Drug A', label: 'Drug A typos' },
      ],
      expectedReplicateCount: 3,
      description: 'Experimental treatment or control condition',
    },
    {
      columnName: 'Gene_Symbol',
      expectedType: 'categorical',
      allowedValues: ['GAPDH', 'ACTB'],
      knownVariants: { gapdh: 'GAPDH', actb: 'ACTB' },
      variantRegexRules: [
        {
          pattern: '^[a-zA-Z0-9]+$',
          mapsTo: '__UPPERCASE__',
          label: 'Gene symbol uppercase',
        },
      ],
      description: 'Target gene for readout',
    },
    {
      columnName: 'Expression_Value',
      expectedType: 'numeric',
      numericRange: { min: 0 },
      description: 'Plate reader luminescence',
      units: 'relative light units (RLU)',
    },
    {
      columnName: 'Viability_%',
      expectedType: 'numeric',
      numericRange: { min: 0, max: 100 },
      description: 'Cell viability percentage',
      units: '%',
    },
    {
      columnName: 'Well_ID',
      expectedType: 'identifier',
      description: '96-well plate position',
    },
    {
      columnName: 'Replicate',
      expectedType: 'numeric',
      numericRange: { min: 1, max: 10 },
      description: 'Biological replicate number',
    },
    {
      columnName: 'Notes',
      expectedType: 'categorical',
      description: 'Bench scientist quality notes — preserved in export',
      preserveInExport: true,
    },
  ],
};

export const qpcrProtocol: ProtocolTemplate = {
  id: generateId('protocol'),
  name: 'qPCR gene expression v1',
  createdBy: PROTOCOL_AUTHOR,
  createdAt: '2026-06-15T10:00:00.000Z',
  columnRules: [
    {
      columnName: 'Cell_Line',
      expectedType: 'categorical',
      allowedValues: ['HeLa'],
      knownVariants: { hela: 'HeLa', HELA: 'HeLa' },
      description: 'Cell line used in experiment',
    },
    {
      columnName: 'Ct_Value',
      expectedType: 'numeric',
      numericRange: { min: 0, max: 40 },
      description: 'Cycle threshold from qPCR instrument',
      units: 'Ct',
    },
    {
      columnName: 'Target_Gene',
      expectedType: 'categorical',
      allowedValues: ['GAPDH', 'ACTB', 'TP53'],
      description: 'Amplification target',
    },
    {
      columnName: 'Notes',
      expectedType: 'categorical',
      preserveInExport: true,
      description: 'Bench notes — never dropped from export',
    },
  ],
};

export const multibatchProtocol: ProtocolTemplate = {
  id: generateId('protocol'),
  name: 'Multi-batch consolidation v1',
  createdBy: PROTOCOL_AUTHOR,
  createdAt: '2026-06-20T10:00:00.000Z',
  columnRules: [
    {
      columnName: 'Treatment_Group',
      expectedType: 'categorical',
      allowedValues: ['Control', 'Drug X'],
      knownVariants: {
        ctrl: 'Control',
        control: 'Control',
        CTRL: 'Control',
        Ctrl: 'Control',
        Vehicle: 'Control',
      },
      expectedReplicateCount: 3,
      description: 'Treatment condition — Control includes Vehicle/Ctrl variants',
    },
    {
      columnName: 'Batch',
      expectedType: 'categorical',
      description: 'Export day / run batch identifier',
    },
    {
      columnName: 'Expression_Value',
      expectedType: 'numeric',
      units: 'normalized ratio',
      description: 'Normalized expression readout',
    },
    {
      columnName: 'Notes',
      expectedType: 'categorical',
      preserveInExport: true,
    },
  ],
};

export const STARTER_PROTOCOLS = [starterProtocol, qpcrProtocol, multibatchProtocol];
