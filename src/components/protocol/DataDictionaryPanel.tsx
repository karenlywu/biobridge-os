import { useBioBridgeStore } from '../../store/useBioBridgeStore';

export function DataDictionaryPanel() {
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const dataset = useBioBridgeStore((s) => s.dataset);

  const protocol = protocols.find((p) => p.id === activeProtocolId);
  if (!protocol || !dataset) return null;

  const rulesWithMeta = protocol.columnRules.filter(
    (r) => r.description || r.units,
  );
  if (!rulesWithMeta.length) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <h3 className="text-sm font-semibold text-blue-900">Data dictionary</h3>
      <p className="mt-0.5 text-xs text-blue-700">
        Column meanings and units from protocol &quot;{protocol.name}&quot; — no more reverse-engineering
        from value ranges.
      </p>
      <dl className="mt-3 space-y-2">
        {rulesWithMeta.map((rule) => (
          <div key={rule.columnName} className="text-sm">
            <dt className="font-medium text-blue-900">{rule.columnName}</dt>
            <dd className="text-blue-800">
              {[rule.description, rule.units ? `Units: ${rule.units}` : null]
                .filter(Boolean)
                .join(' · ')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
