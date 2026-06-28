import { useMemo } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { generatePythonScript } from '../../lib/codegen/generatePythonScript';
import { Button } from '../shared/Button';
import { downloadTextFile } from '../../lib/utils';

export function CodePanel({ embedded = false }: { embedded?: boolean }) {
  const dataset = useBioBridgeStore((s) => s.dataset);
  const actionHistory = useBioBridgeStore((s) => s.actionHistory);

  const script = useMemo(
    () => generatePythonScript(dataset, actionHistory),
    [dataset, actionHistory],
  );

  return (
    <div
      className={
        embedded
          ? 'overflow-hidden bg-slate-850'
          : 'overflow-hidden rounded-xl border border-slate-200 bg-slate-850 shadow-sm'
      }
    >
      <div
        className={`flex items-center border-b border-slate-700 px-4 py-2 ${embedded ? 'justify-end' : 'justify-between'}`}
      >
        {!embedded && <h3 className="text-sm font-semibold text-white">Generated Python</h3>}
        <Button
          variant="secondary"
          onClick={() => downloadTextFile(script, 'biobridge_clean.py', 'text/x-python')}
        >
          Download .py
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto p-4 font-mono text-xs leading-relaxed text-emerald-300">
        {script}
      </pre>
    </div>
  );
}
