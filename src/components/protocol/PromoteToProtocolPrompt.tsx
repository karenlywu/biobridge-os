import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { DEFAULT_ACTOR } from '../../lib/utils';
import { Button } from '../shared/Button';

export function PromoteToProtocolPrompt() {
  const pending = useBioBridgeStore((s) => s.pendingPromotion);
  const promoteToProtocol = useBioBridgeStore((s) => s.promoteToProtocol);
  const dismissPromotion = useBioBridgeStore((s) => s.dismissPromotion);
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activeProtocolId = useBioBridgeStore((s) => s.activeProtocolId);
  const currentActor = useBioBridgeStore((s) => s.currentActor);

  if (!pending || !activeProtocolId) return null;

  const protocol = protocols.find((p) => p.id === activeProtocolId);
  if (!protocol) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md rounded-xl border border-violet-200 bg-white p-4 shadow-lg">
      <p className="text-sm text-slate-800">
        Add &apos;{pending.variant}&apos; as a known variant of &apos;{pending.canonical}&apos; in{' '}
        <strong>{protocol.name}</strong> for future uploads?
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
          Yes, add it
        </Button>
        <Button variant="ghost" onClick={dismissPromotion}>
          No, just this once
        </Button>
      </div>
    </div>
  );
}
