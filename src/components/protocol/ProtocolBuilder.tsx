import { useState } from 'react';
import { useBioBridgeStore } from '../../store/useBioBridgeStore';
import { generateId, PROTOCOL_AUTHOR } from '../../lib/utils';
import type { ProtocolTemplate } from '../../types/protocol';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import {
  ColumnRuleEditor,
  emptyRule,
  protocolFromForm,
} from './ColumnRuleEditor';

export function ProtocolBuilder() {
  const protocols = useBioBridgeStore((s) => s.protocols);
  const activePersonaId = useBioBridgeStore((s) => s.activePersonaId);
  const saveProtocol = useBioBridgeStore((s) => s.saveProtocol);
  const cloneProtocol = useBioBridgeStore((s) => s.cloneProtocol);
  const deleteProtocol = useBioBridgeStore((s) => s.deleteProtocol);
  const dataset = useBioBridgeStore((s) => s.dataset);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editing, setEditing] = useState<ProtocolTemplate | null>(null);
  const [name, setName] = useState('');
  const [rules, setRules] = useState([emptyRule()]);

  const availableColumns = dataset?.columns.map((c) => c.name) ?? [];
  const isMarcus = activePersonaId === 'marcus';

  const openList = () => {
    setMode('list');
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setName('');
    setRules([emptyRule()]);
    setMode('edit');
  };

  const openEdit = (protocol: ProtocolTemplate) => {
    setEditing(protocol);
    setName(protocol.name);
    setRules(
      protocol.columnRules.length
        ? protocol.columnRules.map((r) => ({
            ...r,
            allowedValues: r.allowedValues ? [...r.allowedValues] : undefined,
            knownVariants: r.knownVariants ? { ...r.knownVariants } : undefined,
            variantRegexRules: r.variantRegexRules?.map((vr) => ({ ...vr })),
          }))
        : [emptyRule()],
    );
    setMode('edit');
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const protocol = protocolFromForm(
      editing,
      name.trim(),
      rules.filter((r) => r.columnName.trim()),
      PROTOCOL_AUTHOR,
    );
    if (!editing) protocol.id = generateId('protocol');
    saveProtocol(protocol);
    setMode('list');
    setEditing(null);
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={openList}
        title={
          isMarcus
            ? 'Create and edit assay protocol templates'
            : 'Assay rules defined by Marcus — view and select'
        }
      >
        {isMarcus ? 'Manage protocols' : 'View protocols'}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          mode === 'list'
            ? 'Protocol Templates'
            : editing
              ? `Edit: ${editing.name}`
              : 'New Protocol Template'
        }
        wide
      >
        {mode === 'list' ? (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Define expected columns, types, and allowed values for assay protocols.
            </p>
            <div className="space-y-2">
              {protocols.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.columnRules.length} rules · by {p.createdBy}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => cloneProtocol(p.id, `${p.name} (copy)`)}
                    >
                      Save as new version
                    </Button>
                    <Button variant="ghost" onClick={() => deleteProtocol(p.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <Button onClick={openNew}>+ New template</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm">
              Template name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="96-well viability screen v1"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>

            {rules.map((rule, index) => (
              <ColumnRuleEditor
                key={index}
                rule={rule}
                availableColumns={availableColumns}
                onChange={(updated) => {
                  const next = [...rules];
                  next[index] = updated;
                  setRules(next);
                }}
                onRemove={() => setRules(rules.filter((_, i) => i !== index))}
              />
            ))}

            <Button variant="secondary" onClick={() => setRules([...rules, emptyRule()])}>
              + Add column rule
            </Button>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button variant="ghost" onClick={() => setMode('list')}>
                Back
              </Button>
              <Button onClick={handleSave}>Save template</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
