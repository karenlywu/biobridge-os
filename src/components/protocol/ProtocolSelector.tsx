import { useState } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';

export function ProtocolSelector() {
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const setActiveProtocol = useBioBridgeStore((s) => s.setActiveProtocol);
  const [notice, setNotice] = useState<string | null>(null);

  const handleChange = (protocolId: string | null) => {
    setActiveProtocol(protocolId);
    queueMicrotask(() => {
      const count = useBioBridgeStore
        .getState()
        .anomalyFlags.filter((f) => !f.resolved).length;
      const name = protocolId
        ? protocols.find((p) => p.id === protocolId)?.name ?? 'protocol'
        : 'heuristic checks only';
      setNotice(
        `Re-ran checks against ${name} — ${count} issue${count !== 1 ? 's' : ''} open`,
      );
      window.setTimeout(() => setNotice(null), 4000);
    });
  };

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-2">
        <label htmlFor="header-protocol-select" className="text-sm text-slate-600">
          Protocol
        </label>
        <select
          id="header-protocol-select"
          value={activeProtocolId ?? ''}
          onChange={(e) => handleChange(e.target.value ? e.target.value : null)}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">None (heuristic only)</option>
          {protocols.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {notice && (
        <p className="text-xs text-violet-700" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
