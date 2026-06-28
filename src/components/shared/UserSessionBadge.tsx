import { useState, useRef, useEffect } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { getPersona, otherPersonaId, PERSONAS, type PersonaId } from '../../lib/session';
import { Button } from './Button';

export function UserSessionBadge() {
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);
  const setActivePersona = useBioBridgeStore((s) => s.setActivePersona);
  const persona = getPersona(activePersonaId);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const switchTo = (id: PersonaId) => {
    setActivePersona(id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Signed in as ${persona.displayName}. Click to switch demo persona.`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white ${persona.avatarClass}`}
          aria-hidden
        >
          {persona.initials}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-slate-900">{persona.displayName}</p>
          <p className="truncate text-xs text-slate-500">
            {persona.role} · {persona.lab}
          </p>
        </div>
        <span className="hidden rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 sm:inline">
          Signed in
        </span>
        <span className="text-xs text-slate-400" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            Switch demo persona
          </p>
          {(Object.keys(PERSONAS) as PersonaId[]).map((id) => {
            const p = PERSONAS[id];
            const active = id === activePersonaId;
            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => switchTo(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition ${
                  active ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold text-white ${p.avatarClass}`}
                >
                  {p.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{p.displayName}</p>
                  <p className="text-xs text-slate-500">{p.role}</p>
                </div>
                {active && (
                  <span className="text-xs font-medium text-brand-600">Active</span>
                )}
              </button>
            );
          })}
          <div className="mt-2 border-t border-slate-100 px-2 pt-2">
            <Button
              variant="ghost"
              className="w-full justify-center text-xs"
              onClick={() => switchTo(otherPersonaId(activePersonaId))}
            >
              Switch to {getPersona(otherPersonaId(activePersonaId)).shortName}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
