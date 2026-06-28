import type { AnomalyType } from '../../types/anomaly';
import { ANOMALY_PLAIN_LANGUAGE } from '../../lib/anomalyLabels';
import { Chip } from '../shared/Chip';

interface AnomalyPillBarProps {
  counts: Record<AnomalyType, number>;
  activeFilter: AnomalyType | 'all';
  onFilter: (filter: AnomalyType | 'all') => void;
  showTechnical?: boolean;
}

function pillLabel(type: AnomalyType, showTechnical: boolean): string {
  const plain = ANOMALY_PLAIN_LANGUAGE[type];
  if (!showTechnical) return plain.pillLabel;
  return `${plain.pillLabel} · ${plain.technicalTerm}`;
}

export function AnomalyPillBar({
  counts,
  activeFilter,
  onFilter,
  showTechnical = false,
}: AnomalyPillBarProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter issues">
      <button
        type="button"
        onClick={() => onFilter('all')}
        aria-pressed={activeFilter === 'all'}
        className={`rounded-full px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
          activeFilter === 'all'
            ? 'bg-brand-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        All ({total})
      </button>
      {(Object.keys(ANOMALY_PLAIN_LANGUAGE) as AnomalyType[]).map((type) =>
        counts[type] > 0 ? (
          <button
            key={type}
            type="button"
            onClick={() => onFilter(type)}
            aria-pressed={activeFilter === type}
            className={`focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              activeFilter === type ? 'ring-2 ring-brand-500 ring-offset-1 rounded-full' : ''
            }`}
          >
            <Chip color={type === 'schema_violation' ? 'schema' : 'default'}>
              {pillLabel(type, showTechnical)} ({counts[type]})
            </Chip>
          </button>
        ) : null,
      )}
    </div>
  );
}
