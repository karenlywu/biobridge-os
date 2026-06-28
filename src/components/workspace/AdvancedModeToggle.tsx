import { useBioBridgeStore } from '../../store/useBioBridgeStore';

export function AdvancedModeToggle() {
  const enabled = useBioBridgeStore((s) => s.advancedModeEnabled);
  const toggle = useBioBridgeStore((s) => s.toggleAdvancedMode);

  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
      <input
        type="checkbox"
        checked={enabled}
        onChange={toggle}
        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      Advanced Mode (regex transforms)
    </label>
  );
}
