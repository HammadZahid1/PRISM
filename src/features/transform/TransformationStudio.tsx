import { useMemo, useState } from 'react';
import { Check, Eye, Sparkles, WandSparkles } from 'lucide-react';
import type { ColumnType, Dataset } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { Button } from '@/components/ui/Button';
import { Badge, Field, Select, TextInput, Toggle } from '@/components/ui/Primitives';
import { EmptyState, Notice } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { Modal } from '@/components/ui/Modal';
import {
  addCalculatedColumn,
  categorizeColumn,
  convertColumnType,
  deleteRows,
  fillMissing,
  normalizeColumn,
  removeColumns,
  removeDuplicates,
  renameColumn,
  replaceValues,
  standardizeColumn,
} from '@/lib/data/transform';
import { compileExpression } from '@/lib/data/expression';
import { toDisplay } from '@/lib/utils';

type Operation =
  | 'rename'
  | 'remove_column'
  | 'delete_rows'
  | 'duplicates'
  | 'missing'
  | 'convert'
  | 'calculated'
  | 'normalize'
  | 'standardize'
  | 'replace'
  | 'categorize';

const OPERATIONS: { id: Operation; label: string; detail: string }[] = [
  { id: 'rename', label: 'Rename column', detail: 'Change a column display name' },
  { id: 'remove_column', label: 'Remove column', detail: 'Drop one or more fields' },
  { id: 'delete_rows', label: 'Delete rows', detail: 'Remove selected row indices' },
  { id: 'duplicates', label: 'Remove duplicates', detail: 'Keep the first unique record' },
  { id: 'missing', label: 'Handle missing values', detail: 'Fill or drop empty cells' },
  { id: 'convert', label: 'Convert column type', detail: 'Number, text, date or boolean' },
  { id: 'calculated', label: 'Calculated column', detail: 'Safe arithmetic expressions' },
  { id: 'normalize', label: 'Normalize numeric', detail: 'Scale values to 0–1' },
  { id: 'standardize', label: 'Standardize numeric', detail: 'Z-score transformation' },
  { id: 'replace', label: 'Replace values', detail: 'Exact text or number match' },
  { id: 'categorize', label: 'Create categories', detail: 'Bin a numeric field' },
];

interface Params {
  columnId: string;
  column2Id: string;
  name: string;
  expression: string;
  find: string;
  replacement: string;
  strategy: 'mean' | 'median' | 'zero' | 'drop' | 'label';
  type: ColumnType;
  bins: number;
  rows: string;
  selectedOnly: boolean;
}

const defaultParams = (dataset: Dataset): Params => ({
  columnId: dataset.columns[0]?.id ?? '',
  column2Id: dataset.columns[1]?.id ?? dataset.columns[0]?.id ?? '',
  name: 'derived_value',
  expression: `${dataset.columns[0]?.id ?? 'value'} * 1`,
  find: '',
  replacement: '',
  strategy: 'mean',
  type: 'number',
  bins: 4,
  rows: '',
  selectedOnly: false,
});

export function TransformationStudio() {
  const { dataset, allRows } = useVisibleRows();
  const updateDataset = useAppStore((state) => state.updateDataset);
  const notify = useAppStore((state) => state.notify);
  const [operation, setOperation] = useState<Operation>('rename');
  const [params, setParams] = useState<Params>(() => defaultParams(dataset ?? emptyDataset()));
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (values: Partial<Params>) => {
    setParams((current) => ({ ...current, ...values }));
    setError(null);
  };

  const result = useMemo(() => {
    if (!dataset) return null;
    try {
      switch (operation) {
        case 'rename': return renameColumn(dataset, params.columnId, params.name);
        case 'remove_column': return removeColumns(dataset, [params.columnId]);
        case 'delete_rows': {
          const indices = params.rows
            .split(/[,\s]+/)
            .map((value) => Number(value.trim()) - 1)
            .filter((value) => Number.isInteger(value) && value >= 0);
          return deleteRows(dataset, indices);
        }
        case 'duplicates': return removeDuplicates(
          dataset,
          params.selectedOnly ? [params.columnId] : dataset.columns.map((column) => column.id),
        );
        case 'missing': return fillMissing(dataset, params.columnId, params.strategy);
        case 'convert': return convertColumnType(dataset, params.columnId, params.type);
        case 'calculated': return addCalculatedColumn(dataset, params.name, params.expression);
        case 'normalize': return normalizeColumn(dataset, params.columnId);
        case 'standardize': return standardizeColumn(dataset, params.columnId);
        case 'replace': return replaceValues(dataset, params.columnId, params.find, params.replacement);
        case 'categorize': return categorizeColumn(dataset, params.columnId, params.bins);
        default: return dataset;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transformation could not be applied.');
      return null;
    }
  }, [dataset, operation, params]);

  const expressionValid = useMemo(() => {
    if (operation !== 'calculated' || !dataset) return true;
    try {
      compileExpression(params.expression, dataset.columns.map((column) => column.id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid expression.');
      return false;
    }
  }, [operation, params.expression, dataset]);

  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon={<WandSparkles size={20} />} title="No dataset to transform" description="Load data first to rename columns, add calculated fields or clean values." />
      </div>
    );
  }

  const columnOptions = dataset.columns.map((column) => (
    <option key={column.id} value={column.id}>{column.name}</option>
  ));

  const apply = () => {
    if (!result || error || !expressionValid) return;
    updateDataset(result, `Transformation: ${OPERATIONS.find((item) => item.id === operation)?.label}`);
    setShowPreview(false);
    notify('Transformation applied', OPERATIONS.find((item) => item.id === operation)?.label, 'success');
  };

  return (
    <div className="flex h-full min-h-0 gap-3 p-4">
      <aside className="hidden w-56 shrink-0 lg:block">
        <Panel title="Operations" subtitle="Local transformations" icon={<WandSparkles size={14} />} className="h-full" bodyClassName="overflow-y-auto p-2">
          <div className="space-y-0.5">
            {OPERATIONS.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setOperation(item.id)}
                className={`w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                  operation === item.id ? 'bg-[var(--accent-cyan)]/[0.09]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <span className={`block text-[11px] font-medium ${operation === item.id ? 'text-[var(--accent-cyan)]' : 'text-[#b8c2cf]'}`}>
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[9px] text-[#6c7685]">{item.detail}</span>
              </button>
            ))}
          </div>
        </Panel>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="label mb-1">Transformation studio</div>
            <h1 className="text-sm font-semibold text-[#e9edf3]">
              {OPERATIONS.find((item) => item.id === operation)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={<Eye size={13} />} onClick={() => setShowPreview(true)} disabled={!result}>Preview</Button>
            <Button variant="primary" icon={<Check size={13} />} onClick={apply} disabled={!result || !expressionValid || !!error}>Apply</Button>
          </div>
        </div>

        <Panel title="Configure operation" subtitle="Changes are previewed before they are applied" icon={<Sparkles size={14} />}>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Operation">
                <Select value={operation} onChange={(event) => setOperation(event.target.value as Operation)}>
                  {OPERATIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </Select>
              </Field>
            </div>

            {!['calculated'].includes(operation) && (
              <Field label={operation === 'delete_rows' ? 'Duplicate detection field' : 'Column'}>
                <Select value={params.columnId} onChange={(event) => patch({ columnId: event.target.value })}>{columnOptions}</Select>
              </Field>
            )}

            {operation === 'rename' && (
              <Field label="New name"><TextInput value={params.name} onChange={(event) => patch({ name: event.target.value })} /></Field>
            )}
            {operation === 'calculated' && (
              <>
                <Field label="New column name"><TextInput value={params.name} onChange={(event) => patch({ name: event.target.value })} /></Field>
                <div className="sm:col-span-2">
                  <Field label="Expression" hint="Supports + - * / parentheses, comparisons, if(), min(), max(), abs(), round() and [column names].">
                    <TextInput className="mono" value={params.expression} onChange={(event) => patch({ expression: event.target.value })} />
                  </Field>
                </div>
              </>
            )}
            {operation === 'missing' && (
              <Field label="Strategy">
                <Select value={params.strategy} onChange={(event) => patch({ strategy: event.target.value as Params['strategy'] })}>
                  <option value="mean">Fill with mean</option>
                  <option value="median">Fill with median</option>
                  <option value="zero">Fill with zero</option>
                  <option value="label">Fill with “Unknown”</option>
                  <option value="drop">Drop rows with missing values</option>
                </Select>
              </Field>
            )}
            {operation === 'convert' && (
              <Field label="Target type">
                <Select value={params.type} onChange={(event) => patch({ type: event.target.value as ColumnType })}>
                  {(['number', 'string', 'date', 'boolean'] as ColumnType[]).map((type) => <option key={type} value={type}>{type}</option>)}
                </Select>
              </Field>
            )}
            {operation === 'replace' && (
              <>
                <Field label="Find"><TextInput value={params.find} onChange={(event) => patch({ find: event.target.value })} /></Field>
                <Field label="Replace with"><TextInput value={params.replacement} onChange={(event) => patch({ replacement: event.target.value })} /></Field>
              </>
            )}
            {operation === 'categorize' && (
              <Field label={`Bins · ${params.bins}`}>
                <input type="range" min={2} max={12} value={params.bins} onChange={(event) => patch({ bins: Number(event.target.value) })} className="w-full" />
              </Field>
            )}
            {operation === 'delete_rows' && (
              <div className="sm:col-span-2">
                <Field label="Row numbers" hint="Comma or space separated, 1-based. Example: 3, 8, 21">
                  <TextInput value={params.rows} onChange={(event) => patch({ rows: event.target.value })} />
                </Field>
              </div>
            )}
            <div className="sm:col-span-2 flex items-center gap-2">
              <Toggle
                checked={params.selectedOnly}
                onChange={(selectedOnly) => patch({ selectedOnly })}
                label="Restrict duplicate check to this column"
                description="Applies to duplicate removal."
              />
            </div>
          </div>

          {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
        </Panel>

        <Panel title="Current dataset" subtitle="Source state before transformation" icon={<Sparkles size={14} />}>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">{dataset.rows.length.toLocaleString()} rows</Badge>
            <Badge>{dataset.columns.length} columns</Badge>
            <Badge tone="neutral">{allRows.length} visible rows</Badge>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-white/[0.06]">
            <div className="max-h-48 overflow-auto">
              <table className="w-full border-collapse text-left text-[10px]">
                <thead className="sticky top-0 bg-[#14171c] text-[#8a94a3]">
                  <tr>{dataset.columns.slice(0, 8).map((column) => <th key={column.id} className="px-2 py-1.5 font-medium">{column.name}</th>)}</tr>
                </thead>
                <tbody>
                  {dataset.rows.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-t border-white/[0.04] text-[#8a94a3]">
                      {dataset.columns.slice(0, 8).map((column) => <td key={column.id} className="mono px-2 py-1.5">{toDisplay(row[column.id])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      </div>

      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Transformation preview"
        subtitle="Review the result before applying it to the workspace"
        icon={<Eye size={15} />}
        footer={<><Button onClick={() => setShowPreview(false)}>Cancel</Button><Button variant="primary" icon={<Check size={13} />} onClick={apply}>Apply transformation</Button></>}
      >
        {result && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="accent">{result.rows.length.toLocaleString()} rows after</Badge>
              <Badge>{result.columns.length} columns after</Badge>
              <Badge tone={result.rows.length === dataset.rows.length ? 'neutral' : 'warning'}>
                {result.rows.length - dataset.rows.length >= 0 ? '+' : ''}{result.rows.length - dataset.rows.length} rows
              </Badge>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/[0.07]">
              <div className="max-h-64 overflow-auto">
                <table className="w-full border-collapse text-left text-[10px]">
                  <thead className="sticky top-0 bg-[#14171c] text-[#8a94a3]">
                    <tr>{result.columns.slice(0, 10).map((column) => <th key={column.id} className="px-2 py-1.5 font-medium">{column.name}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.rows.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-t border-white/[0.04] text-[#a2acba]">
                        {result.columns.slice(0, 10).map((column) => <td key={column.id} className="mono px-2 py-1.5">{toDisplay(row[column.id])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function emptyDataset(): Dataset {
  return {
    id: 'empty', name: 'empty', description: '', source: 'upload',
    columns: [], rows: [], createdAt: 0, updatedAt: 0, tags: [],
  };
}
