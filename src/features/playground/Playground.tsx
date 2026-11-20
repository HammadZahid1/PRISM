import { useEffect, useMemo, useState } from 'react';
import { ChartNoAxesCombined, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import type { ColumnType, Dataset } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { Button } from '@/components/ui/Button';
import { Badge, Field, Select, TextInput } from '@/components/ui/Primitives';
import { EmptyState, Notice, StatTile } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { coerceCell } from '@/lib/data/types';
import { removeColumns } from '@/lib/data/transform';
import { autoConfig } from '@/lib/viz/config';
import { slugify, toDisplay } from '@/lib/utils';

function cloneDataset(dataset: Dataset): Dataset {
  return {
    ...dataset,
    columns: dataset.columns.map((column) => ({ ...column })),
    rows: dataset.rows.map((row) => ({ ...row })),
  };
}

export function Playground() {
  const { dataset } = useVisibleRows();
  const updateDataset = useAppStore((state) => state.updateDataset);
  const addChart = useAppStore((state) => state.addChart);
  const setModule = useAppStore((state) => state.setModule);
  const notify = useAppStore((state) => state.notify);
  const [draft, setDraft] = useState<Dataset | null>(dataset ? cloneDataset(dataset) : null);
  const [newColumn, setNewColumn] = useState('');
  const [newType, setNewType] = useState<ColumnType>('number');

  useEffect(() => {
    setDraft(dataset ? cloneDataset(dataset) : null);
  }, [dataset?.id]);

  const stats = useMemo(() => {
    if (!draft) return null;
    const missing = draft.columns.reduce(
      (sum, column) => sum + draft.rows.filter((row) => row[column.id] === null || row[column.id] === '').length,
      0,
    );
    return { missing, numeric: draft.columns.filter((column) => column.type === 'number').length };
  }, [draft]);

  if (!dataset || !draft || !stats) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="No dataset in the playground"
          description="Load a dataset to edit values, create fields and generate charts directly from your changes."
        />
      </div>
    );
  }

  const setCell = (rowIndex: number, columnId: string, raw: string) => {
    setDraft((current) => {
      if (!current) return current;
      const column = current.columns.find((item) => item.id === columnId);
      const value = raw === '' ? null : coerceCell(raw, column?.type ?? 'string');
      return {
        ...current,
        rows: current.rows.map((row, index) => (index === rowIndex ? { ...row, [columnId]: value } : row)),
      };
    });
  };

  const addRow = () => {
    setDraft((current) =>
      current
        ? { ...current, rows: [...current.rows, Object.fromEntries(current.columns.map((column) => [column.id, null]))] }
        : current,
    );
  };

  const deleteRow = (index: number) => {
    setDraft((current) => (current ? { ...current, rows: current.rows.filter((_, rowIndex) => rowIndex !== index) } : current));
  };

  const addColumn = () => {
    if (!newColumn.trim()) return;
    setDraft((current) => {
      if (!current) return current;
      const id = slugify(newColumn);
      if (current.columns.some((column) => column.id === id)) return current;
      return {
        ...current,
        columns: [...current.columns, { id, name: newColumn.trim(), type: newType, missing: current.rows.length, unique: 0, sample: [] }],
        rows: current.rows.map((row) => ({ ...row, [id]: null })),
      };
    });
    setNewColumn('');
  };

  const changeType = (columnId: string, type: ColumnType) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        columns: current.columns.map((column) => (column.id === columnId ? { ...column, type } : column)),
        rows: current.rows.map((row) => ({ ...row, [columnId]: coerceCell(row[columnId], type) })),
      };
    });
  };

  const removeColumn = (columnId: string) => {
    try {
      setDraft(removeColumns(draft, [columnId]));
    } catch (error) {
      notify('Cannot remove column', error instanceof Error ? error.message : undefined, 'warning');
    }
  };

  const save = () => {
    const saved = { ...draft, id: dataset.id, name: dataset.name, source: dataset.source, updatedAt: Date.now() };
    updateDataset(saved, 'Playground edit');
    notify('Playground changes saved', 'The workspace dataset was updated.', 'success');
  };

  const generateChart = () => {
    addChart(autoConfig(draft, 'bar'));
    setModule('studio');
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="label mb-1">Data playground</div>
          <h1 className="text-sm font-semibold text-[#e9edf3]">Edit and experiment</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={<RotateCcw size={12} />} onClick={() => setDraft(cloneDataset(dataset))}>Reset</Button>
          <Button size="sm" icon={<ChartNoAxesCombined size={12} />} onClick={generateChart}>Generate chart</Button>
          <Button size="sm" variant="primary" icon={<Save size={12} />} onClick={save}>Save to workspace</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Rows" value={draft.rows.length} accent />
        <StatTile label="Columns" value={draft.columns.length} />
        <StatTile label="Numeric" value={stats.numeric} />
        <StatTile label="Missing" value={stats.missing} />
      </div>

      <Panel title="Editable dataset" subtitle="Click any cell to change its value" icon={<Plus size={14} />} className="min-h-0 flex-1" flush>
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex flex-wrap items-end gap-2 border-b border-white/[0.06] p-3">
            <Field label="New column name"><TextInput className="w-44" value={newColumn} onChange={(event) => setNewColumn(event.target.value)} placeholder="column name" /></Field>
            <Field label="Type">
              <Select className="w-32" value={newType} onChange={(event) => setNewType(event.target.value as ColumnType)}>
                {(['number', 'string', 'date', 'boolean'] as ColumnType[]).map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
            </Field>
            <Button size="sm" icon={<Plus size={12} />} onClick={addColumn}>Add column</Button>
            <Button size="sm" icon={<Plus size={12} />} onClick={addRow}>Add row</Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left text-[10px]">
              <thead className="sticky top-0 z-10 bg-[#14171c]">
                <tr>
                  <th className="px-2 py-1.5 text-[#5c6675]">#</th>
                  {draft.columns.map((column) => (
                    <th key={column.id} className="min-w-[130px] px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-[#b8c2cf]">{column.name}</span>
                        <Select
                          className="h-5 w-16 border-transparent bg-transparent px-0 text-[9px]"
                          value={column.type}
                          aria-label={`Type of ${column.name}`}
                          onChange={(event) => changeType(column.id, event.target.value as ColumnType)}
                        >
                          {(['number', 'string', 'date', 'boolean'] as ColumnType[]).map((type) => <option key={type} value={type}>{type.slice(0, 4)}</option>)}
                        </Select>
                        <button type="button" onClick={() => removeColumn(column.id)} className="text-[#5c6675] hover:text-red-300" aria-label={`Remove ${column.name}`}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {draft.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-white/[0.04]">
                    <td className="mono px-2 py-1 text-[#5c6675]">{rowIndex + 1}</td>
                    {draft.columns.map((column) => (
                      <td key={column.id} className="px-1 py-0.5">
                        <input
                          className="mono w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-[#b8c2cf] hover:border-white/[0.08] focus:border-[var(--accent-cyan)] focus:bg-[#14171c] focus:outline-none"
                          value={row[column.id] === null ? '' : String(row[column.id])}
                          onChange={(event) => setCell(rowIndex, column.id, event.target.value)}
                          aria-label={`${column.name} row ${rowIndex + 1}`}
                        />
                      </td>
                    ))}
                    <td className="px-2">
                      <button type="button" onClick={() => deleteRow(rowIndex)} className="text-[#5c6675] hover:text-red-300" aria-label={`Delete row ${rowIndex + 1}`}>
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Draft changes remain local until saved</Badge>
        <span className="mono text-[10px] text-[#6c7685]">
          sample: {toDisplay(draft.rows[0]?.[draft.columns[0]?.id ?? ''] ?? '—')}
        </span>
        <Notice tone="info">Use Save to workspace to make edits available to charts, filters and exports.</Notice>
      </div>
    </div>
  );
}
