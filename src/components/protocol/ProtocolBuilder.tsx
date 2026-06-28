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
import { validateRegexPattern } from '../../lib/protocol/regexRules';
import {
  groupKnownVariantsIntoRules,
  normalizeMappingRules,
} from '../../lib/protocol/mappingRules';

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
  const [readOnly, setReadOnly] = useState(false);
  const [name, setName] = useState('');
  const [rules, setRules] = useState([emptyRule()]);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);

  const availableColumns = dataset?.columns.map((c) => c.name) ?? [];
  const isMarcus = activePersonaId === 'marcus';

  const openList = () => {
    setMode('list');
    setSaveErrors([]);
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setReadOnly(false);
    setName('');
    setRules([emptyRule()]);
    setSaveErrors([]);
    setMode('edit');
  };

  const openEdit = (protocol: ProtocolTemplate, viewOnly = false) => {
    setEditing(protocol);
    setReadOnly(viewOnly);
    setName(protocol.name);
    setRules(
      protocol.columnRules.length
        ? protocol.columnRules.map((r) => ({
            ...r,
            allowedValues: r.allowedValues ? [...r.allowedValues] : undefined,
            knownVariants: r.knownVariants ? { ...r.knownVariants } : undefined,
            variantMappingRules: r.variantMappingRules?.length
              ? r.variantMappingRules.map((mr) => ({
                  ...mr,
                  variants: [...mr.variants],
                }))
              : r.knownVariants && Object.keys(r.knownVariants).length
                ? groupKnownVariantsIntoRules(r.knownVariants)
                : undefined,
            variantRegexRules: r.variantRegexRules?.map((vr) => ({ ...vr })),
          }))
        : [emptyRule()],
    );
    setSaveErrors([]);
    setMode('edit');
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const errors: string[] = [];
    const filteredRules = rules.filter((r) => r.columnName.trim());
    for (const r of filteredRules) {
      for (const mr of r.variantMappingRules ?? []) {
        if (!mr.mapsTo.trim()) {
          errors.push(`Maps-to value required for mapping rule on "${r.columnName}"`);
        }
        if (!mr.variants.some((v) => v.trim())) {
          errors.push(`At least one variant required for mapping rule on "${r.columnName}"`);
        }
      }
      for (const vr of r.variantRegexRules ?? []) {
        const err = validateRegexPattern(vr.pattern.trim());
        if (err) errors.push(`Invalid regex on "${r.columnName}": ${err}`);
        if (!vr.mapsTo.trim()) {
          errors.push(`Maps-to value required for regex on "${r.columnName}"`);
        }
      }
    }
    if (errors.length) {
      setSaveErrors(errors);
      return;
    }
    setSaveErrors([]);
    const protocol = protocolFromForm(
      editing,
      name.trim(),
      filteredRules.map((r) => ({
        ...r,
        variantMappingRules: normalizeMappingRules(r.variantMappingRules ?? []),
        variantRegexRules: r.variantRegexRules?.map((vr) => ({
          ...vr,
          pattern: vr.pattern.trim(),
          mapsTo: vr.mapsTo.trim(),
          label: vr.label?.trim() || undefined,
        })),
      })),
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
            : 'Assay rules defined by Marcus — view only'
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
            : readOnly
              ? `View: ${editing?.name ?? name}`
              : editing
                ? `Edit: ${editing.name}`
                : 'New Protocol Template'
        }
        wide
      >
        {mode === 'list' ? (
          <>
            <p className="mb-4 text-sm text-slate-600">
              {isMarcus
                ? 'Define expected columns, types, and allowed values for assay protocols.'
                : 'Marcus defines these rules — review what your upload will be checked against.'}
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
                    <Button
                      variant="secondary"
                      onClick={() => openEdit(p, !isMarcus)}
                    >
                      {isMarcus ? 'Edit' : 'View rules'}
                    </Button>
                    {isMarcus && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => cloneProtocol(p.id, `${p.name} (copy)`)}
                        >
                          Save as new version
                        </Button>
                        <Button variant="ghost" onClick={() => deleteProtocol(p.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              {isMarcus ? <Button onClick={openNew}>+ New template</Button> : <span />}
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
                readOnly={readOnly}
                placeholder="96-well viability screen v1"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
              />
            </label>

            {rules.map((rule, index) => (
              <ColumnRuleEditor
                key={index}
                rule={rule}
                availableColumns={availableColumns}
                readOnly={readOnly}
                regexEditable={isMarcus && !readOnly}
                mappingEditable={isMarcus && !readOnly}
                onChange={(updated) => {
                  const next = [...rules];
                  next[index] = updated;
                  setRules(next);
                }}
                onRemove={() => setRules(rules.filter((_, i) => i !== index))}
              />
            ))}

            {!readOnly && (
              <Button variant="secondary" onClick={() => setRules([...rules, emptyRule()])}>
                + Add column rule
              </Button>
            )}

            {saveErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {saveErrors.map((err) => (
                  <p key={err}>{err}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button variant="ghost" onClick={() => setMode('list')}>
                Back
              </Button>
              {!readOnly && <Button onClick={handleSave}>Save template</Button>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
