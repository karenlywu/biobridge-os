import { DEMO_FILES } from '../../data/demoManifest';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useLoadDemo } from '../../hooks/useLoadDemo';

export function DemoGallery() {
  const { requestDemo, confirmPending, cancelPending, confirmOpen } = useLoadDemo();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-900">Demo datasets</h3>
      <p className="mt-1 text-sm text-slate-500">
        Built from real handoff pain points — each file targets a specific failure mode.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_FILES.map((demo) => (
          <button
            key={demo.id}
            type="button"
            onClick={() => requestDemo(demo.id)}
            className="rounded-lg border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <p className="font-medium text-slate-900">{demo.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{demo.fileName}</p>
            <p className="mt-2 line-clamp-2 text-xs text-slate-600">{demo.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {demo.highlights.slice(0, 2).map((h) => (
                <span
                  key={h}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                >
                  {h}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Replace current session?"
        message="Loading a demo dataset will discard your current cleaning progress and audit trail for this session."
        confirmLabel="Load demo"
        variant="danger"
        onConfirm={() => void confirmPending()}
        onCancel={cancelPending}
      />
    </div>
  );
}
