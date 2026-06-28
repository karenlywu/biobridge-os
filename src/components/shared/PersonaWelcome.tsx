import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { getPersona } from '../../lib/session';

export function PersonaWelcomeBanner() {
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);
  const persona = getPersona(activePersonaId);

  if (activePersonaId === 'elena') {
    return (
      <div className="mb-4 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
        <p className="text-sm text-brand-900">
          Welcome back, <strong>{persona.shortName}</strong> — upload your plate export here and
          we&apos;ll flag issues in plain language before Marcus sees it.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
      <p className="text-sm text-violet-900">
        Welcome, <strong>{persona.shortName}</strong> — review incoming lab exports, tune protocol
        templates, and verify the generated Python pipeline.
      </p>
    </div>
  );
}

export function PersonaUploadHint() {
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);

  if (activePersonaId === 'elena') {
    return (
      <p className="mb-4 text-sm text-slate-600">
        Marcus set up the assay protocol for you — we&apos;ll check your file against it
        automatically. Issues are explained in everyday language, not data-engineering jargon.{' '}
        <span className="text-brand-600">
          Live demo: load ⭐ Live demo (dirty handoff) from the gallery below.
        </span>
      </p>
    );
  }

  return (
    <p className="mb-4 text-sm text-slate-600">
      Load a file Elena would send — compare flag counts with and without an active protocol, edit
      regex rules under <strong>Manage Protocols</strong>, and inspect the audit trail + script.{' '}
      <span className="text-violet-700">
        Try ⭐ Live demo (dirty handoff) with <strong>96-well viability screen v1</strong> selected.
      </span>
    </p>
  );
}
