import { useEffect } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { DEFAULT_ACTOR } from '../../lib/utils';
import { Button } from '../shared/Button';

export function PromoteToProtocolPrompt() {
  const pending = useBioBridgeStore((s) => s.pendingPromotion);
  const promoteToProtocol = useBioBridgeStore((s) => s.promoteToProtocol);
  const dismissPromotion = useBioBridgeStore((s) => s.dismissPromotion);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);
  const currentActor = useBioBridgeStore((s) => s.currentActor);

  useEffect(() => {
    if (!pending || activePersonaId !== 'marcus') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissPromotion();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending, activePersonaId, dismissPromotion]);

  if (!pending || !activeProtocolId || activePersonaId !== 'marcus') return null;

  const protocol = protocols.find((p) => p.id === activeProtocolId);
  if (!protocol) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 max-w-md rounded-xl border border-violet-200 bg-white p-4 shadow-lg"
      role="dialog"
      aria-labelledby="promote-prompt-title"
      aria-describedby="promote-prompt-desc"
    >
      <p id="promote-prompt-title" className="text-sm font-medium text-slate-900">
        Save this fix for future uploads?
      </p>
      <p id="promote-prompt-desc" className="mt-1 text-sm text-slate-600">
        Add &apos;{pending.variant}&apos; as a known variant of &apos;{pending.canonical}&apos; in{' '}
        <strong>{protocol.name}</strong> — next time Elena uploads, it auto-normalizes.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          onClick={() =>
            promoteToProtocol(
              pending.variant,
              pending.canonical,
              pending.columnName,
              currentActor || DEFAULT_ACTOR,
            )
          }
        >
          Yes, add to protocol
        </Button>
        <Button variant="ghost" onClick={dismissPromotion}>
          No, just this once
        </Button>
      </div>
    </div>
  );
}
