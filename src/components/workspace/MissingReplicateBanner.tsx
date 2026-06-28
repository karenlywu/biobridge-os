import type { AnomalyFlag } from '../../types/anomaly';
import { ANOMALY_PLAIN_LANGUAGE } from '../../lib/anomalyLabels';
import { Button } from '../shared/Button';

interface MissingReplicateBannerProps {
  flag: AnomalyFlag;
  onDismiss: () => void;
}

export function MissingReplicateBanner({ flag, onDismiss }: MissingReplicateBannerProps) {
  if (flag.resolved) return null;

  const plain = ANOMALY_PLAIN_LANGUAGE.missing_replicate;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
    >
      <div>
        <p className="font-medium text-blue-900">{plain.cardTitle}</p>
        <p className="text-sm text-blue-800">
          {plain.cardDescription({ columnName: flag.columnName, rowCount: flag.affectedRowIndices.length })}
          {' '}
          Affected: {(flag.variantValues ?? []).join('; ') || flag.suggestedResolution}
        </p>
      </div>
      <Button variant="secondary" onClick={onDismiss}>
        Acknowledge and continue
      </Button>
    </div>
  );
}
