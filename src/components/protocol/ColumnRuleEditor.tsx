import type { ColumnRule, ExpectedType, ProtocolTemplate, VariantRegexRule } from '../../types/protocol';
import { Button } from '../shared/Button';
import { Chip } from '../shared/Chip';
import { REGEX_PRESETS, testRegexRules, validateRegexPattern } from '../../lib/protocol/regexRules';
import { generateId } from '../../lib/utils';
import { useState } from 'react';

interface ColumnRuleEditorProps {
  rule: ColumnRule;
  availableColumns: string[];
  onChange: (rule: ColumnRule) => void;
  onRemove: () => void;
  /** When false, regex rules are view-only (Elena view mode). */
  regexEditable?: boolean;
}

function RegexRuleRow({
  rule,
  onChange,
  onRemove,
  editable,
}: {
  rule: VariantRegexRule;
  onChange: (updated: VariantRegexRule) => void;
  onRemove: () => void;
  editable: boolean;
}) {
  const [patternError, setPatternError] = useState<string | null>(null);

  const handlePatternBlur = () => {
    if (!rule.pattern.trim()) {
      setPatternError('Pattern is required');
      return;
    }
    setPatternError(validateRegexPattern(rule.pattern.trim()));
  };

  if (!editable) {
    return (
      <li className="flex flex-wrap items-center gap-2 rounded bg-white p-2 text-xs">
        <code className="text-violet-700">/{rule.pattern}/i</code>
        <span>→</span>
        <Chip color="brand">{rule.mapsTo}</Chip>
        {rule.label && <span className="text-slate-500">({rule.label})</span>}
      </li>
    );
  }

  return (
    <li className="rounded bg-white p-2">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="text-xs text-slate-600">
          Pattern
          <input
            placeholder="^ctrl(_\\w+)?$"
            value={rule.pattern}
            onChange={(e) => {
              setPatternError(null);
              onChange({ ...rule, pattern: e.target.value });
            }}
            onBlur={handlePatternBlur}
            className={`mt-0.5 w-full rounded border px-2 py-1 font-mono text-sm ${
              patternError ? 'border-red-400' : 'border-slate-300'
            }`}
          />
        </label>
        <label className="text-xs text-slate-600">
          Maps to
          <input
            placeholder="Canonical value"
            value={rule.mapsTo}
            onChange={(e) => onChange({ ...rule, mapsTo: e.target.value })}
            className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs text-slate-600">
          Label (optional)
          <input
            placeholder="Plain-language note"
            value={rule.label ?? ''}
            onChange={(e) =>
              onChange({ ...rule, label: e.target.value || undefined })
            }
            className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <div className="flex items-end">
          <Button variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
      {patternError && <p className="mt-1 text-xs text-red-600">{patternError}</p>}
      {rule.pattern.trim() && !patternError && (
        <p className="mt-1 text-[10px] text-slate-400">
          Preview: <code className="text-violet-600">/{rule.pattern.trim()}/i</code> →{' '}
          {rule.mapsTo.trim() || '…'}
        </p>
      )}
    </li>
  );
}

function RegexRulesSection({
  rules,
  onChange,
  sampleValues,
  editable,
}: {
  rules: VariantRegexRule[];
  onChange: (rules: VariantRegexRule[]) => void;
  sampleValues: string[];
  editable: boolean;
}) {
  const [draft, setDraft] = useState<VariantRegexRule>({ pattern: '', mapsTo: '' });
  const [testInput, setTestInput] = useState(sampleValues.slice(0, 5).join(', '));
  const [expanded, setExpanded] = useState(rules.length > 0);

  const addRule = () => {
    const err = validateRegexPattern(draft.pattern);
    if (err) {
      window.alert(err);
      return;
    }
    if (!draft.mapsTo.trim()) {
      window.alert('Maps-to canonical value is required');
      return;
    }
    onChange([...rules, { ...draft, pattern: draft.pattern.trim(), mapsTo: draft.mapsTo.trim() }]);
    setDraft({ pattern: '', mapsTo: '' });
  };

  const tests = testRegexRules(
    rules,
    testInput.split(',').map((s) => s.trim()).filter(Boolean),
  );

  const updateRule = (index: number, updated: VariantRegexRule) => {
    const next = [...rules];
    next[index] = updated;
    onChange(next);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, j) => j !== index));
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-800"
        onClick={() => setExpanded(!expanded)}
      >
        Advanced: regex variant rules (comp bio)
        <span className="text-xs text-slate-500">{expanded ? '▼' : '▶'} Optional</span>
      </button>
      <p className="mt-1 text-xs text-slate-500">
        For Marcus — match label <em>families</em> (e.g. all ctrl* → Control). Elena never sees
        these; prefer known variants when possible.
      </p>

      {expanded && (
        <>
          {rules.length > 0 && (
            <ul className="mt-2 space-y-2">
              {rules.map((r, i) => (
                <RegexRuleRow
                  key={i}
                  rule={r}
                  editable={editable}
                  onChange={(updated) => updateRule(i, updated)}
                  onRemove={() => removeRule(i)}
                />
              ))}
            </ul>
          )}

          {editable && (
            <>
              <div className="mt-2 flex flex-wrap gap-1">
                {REGEX_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant="ghost"
                    onClick={() => onChange([...rules, p.rule])}
                  >
                    + {p.label}
                  </Button>
                ))}
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <input
                  placeholder="Regex pattern"
                  value={draft.pattern}
                  onChange={(e) => setDraft({ ...draft, pattern: e.target.value })}
                  className="rounded border border-slate-300 px-2 py-1 text-sm font-mono"
                />
                <input
                  placeholder="Maps to (canonical)"
                  value={draft.mapsTo}
                  onChange={(e) => setDraft({ ...draft, mapsTo: e.target.value })}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <input
                  placeholder="Label (optional)"
                  value={draft.label ?? ''}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value || undefined })}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                />
              </div>
              <Button className="mt-2" variant="secondary" onClick={addRule}>
                Add regex rule
              </Button>
            </>
          )}

          {!editable && rules.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">No regex rules on this column.</p>
          )}

          <div className="mt-3">
            <label className="text-xs text-slate-600">
              Test against sample values (comma-separated)
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
            {tests.length > 0 && (
              <table className="mt-1 w-full text-xs">
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.value}>
                      <td className="py-0.5 font-mono">{t.value}</td>
                      <td className="px-2">→</td>
                      <td>{t.mapsTo ?? '— no match —'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ColumnRuleEditor({
  rule,
  availableColumns,
  onChange,
  onRemove,
  regexEditable = true,
}: ColumnRuleEditorProps) {
  const sampleValues = rule.allowedValues ?? ['control', 'ctrl_r2', 'drug_a'];

  const addAllowedValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onChange({
      ...rule,
      allowedValues: [...(rule.allowedValues ?? []), trimmed],
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-medium text-slate-800">Column rule</h4>
        <Button variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Column name
          <input
            list="column-names"
            value={rule.columnName}
            onChange={(e) => onChange({ ...rule, columnName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <datalist id="column-names">
            {availableColumns.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="block text-sm">
          Expected type
          <select
            value={rule.expectedType}
            onChange={(e) =>
              onChange({ ...rule, expectedType: e.target.value as ExpectedType })
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="categorical">Categorical</option>
            <option value="numeric">Numeric</option>
            <option value="identifier">Identifier</option>
          </select>
        </label>
      </div>

      {rule.expectedType === 'categorical' && (
        <>
          <div className="mt-3">
            <label className="block text-sm text-slate-700">Allowed values</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {(rule.allowedValues ?? []).map((v) => (
                <Chip
                  key={v}
                  onRemove={() =>
                    onChange({
                      ...rule,
                      allowedValues: rule.allowedValues?.filter((x) => x !== v),
                    })
                  }
                >
                  {v}
                </Chip>
              ))}
            </div>
            <input
              placeholder="Type value, press Enter"
              className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addAllowedValue((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>

          <RegexRulesSection
            rules={rule.variantRegexRules ?? []}
            onChange={(variantRegexRules) => onChange({ ...rule, variantRegexRules })}
            sampleValues={sampleValues}
            editable={regexEditable}
          />
        </>
      )}

      {rule.expectedType === 'numeric' && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm">
            Min
            <input
              type="number"
              value={rule.numericRange?.min ?? ''}
              onChange={(e) =>
                onChange({
                  ...rule,
                  numericRange: {
                    ...rule.numericRange,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="text-sm">
            Max
            <input
              type="number"
              value={rule.numericRange?.max ?? ''}
              onChange={(e) =>
                onChange({
                  ...rule,
                  numericRange: {
                    ...rule.numericRange,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Description (data dictionary)
          <input
            value={rule.description ?? ''}
            onChange={(e) => onChange({ ...rule, description: e.target.value || undefined })}
            placeholder="e.g. Cycle threshold from instrument"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
        <label className="block text-sm">
          Units
          <input
            value={rule.units ?? ''}
            onChange={(e) => onChange({ ...rule, units: e.target.value || undefined })}
            placeholder="e.g. µM, Ct, RLU, %"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
      </div>

      <label className="mt-3 block text-sm">
        Expected replicate count (optional)
        <input
          type="number"
          min={1}
          value={rule.expectedReplicateCount ?? ''}
          onChange={(e) =>
            onChange({
              ...rule,
              expectedReplicateCount: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>

      {rule.knownVariants && Object.keys(rule.knownVariants).length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-slate-700">Known variants (from Elena promotions)</p>
          <div className="mt-1 space-y-1">
            {Object.entries(rule.knownVariants).map(([variant, canonical]) => (
              <div key={variant} className="flex items-center gap-2 text-sm">
                <Chip>{variant}</Chip>
                <span className="text-slate-400">→</span>
                <Chip color="brand">{canonical}</Chip>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const next = { ...rule.knownVariants };
                    delete next[variant];
                    onChange({ ...rule, knownVariants: next });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function emptyRule(): ColumnRule {
  return {
    columnName: '',
    expectedType: 'categorical',
    allowedValues: [],
  };
}

export function protocolFromForm(
  existing: ProtocolTemplate | null,
  name: string,
  rules: ColumnRule[],
  createdBy: string,
): ProtocolTemplate {
  return {
    id: existing?.id ?? generateId('protocol'),
    name,
    createdBy: existing?.createdBy ?? createdBy,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    columnRules: rules,
  };
}
