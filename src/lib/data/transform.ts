import type { CellValue, ColumnType, Dataset } from '@/types/data';
import { coerceCell, isMissing } from './types';
import { compileExpression } from './expression';
import { numericValues } from './stats';
import { slugify, uid } from '@/lib/utils';

function cloneDataset(dataset: Dataset, changes: Partial<Dataset>): Dataset {
  return { ...dataset, ...changes, updatedAt: Date.now() };
}

function uniqueColumnId(dataset: Dataset, name: string): string {
  const base = slugify(name);
  const existing = new Set(dataset.columns.map((column) => column.id));
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
}

function recalculateColumns(columns: Dataset['columns'], rows: Dataset['rows']): Dataset['columns'] {
  return columns.map((column) => {
    const values = rows.map((row) => row[column.id] ?? null);
    return {
      ...column,
      missing: values.filter(isMissing).length,
      unique: new Set(values.filter((value) => !isMissing(value)).map(String)).size,
    };
  });
}

export function renameColumn(dataset: Dataset, columnId: string, newName: string): Dataset {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Column name cannot be empty.');
  const columns = dataset.columns.map((column) =>
    column.id === columnId ? { ...column, name: trimmed } : column,
  );
  return cloneDataset(dataset, { columns });
}

export function removeColumns(dataset: Dataset, columnIds: string[]): Dataset {
  if (dataset.columns.length - columnIds.length < 1) throw new Error('A dataset must keep at least one column.');
  const columns = dataset.columns.filter((column) => !columnIds.includes(column.id));
  const rows = dataset.rows.map((row) => {
    const next: Dataset['rows'][number] = {};
    columns.forEach((column) => {
      next[column.id] = row[column.id] ?? null;
    });
    return next;
  });
  return cloneDataset(dataset, { columns, rows });
}

export function deleteRows(dataset: Dataset, indices: number[]): Dataset {
  const excluded = new Set(indices);
  const rows = dataset.rows.filter((_, index) => !excluded.has(index));
  return cloneDataset(dataset, { rows, columns: recalculateColumns(dataset.columns, rows) });
}

export function removeDuplicates(dataset: Dataset, columnIds: string[] = dataset.columns.map((c) => c.id)): Dataset {
  const seen = new Set<string>();
  const rows = dataset.rows.filter((row) => {
    const key = columnIds.map((id) => JSON.stringify(row[id] ?? null)).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return cloneDataset(dataset, { rows, columns: recalculateColumns(dataset.columns, rows) });
}

export function fillMissing(
  dataset: Dataset,
  columnId: string,
  strategy: 'mean' | 'median' | 'zero' | 'drop' | 'label',
): Dataset {
  let rows = [...dataset.rows];
  if (strategy === 'drop') {
    rows = rows.filter((row) => !isMissing(row[columnId]));
  } else {
    const values = numericValues(rows, columnId).sort((a, b) => a - b);
    const replacement =
      strategy === 'zero'
        ? 0
        : strategy === 'label'
          ? 'Unknown'
          : strategy === 'median'
            ? values[Math.floor(values.length / 2)] ?? 0
            : values.length
              ? values.reduce((sum, value) => sum + value, 0) / values.length
              : 0;
    rows = rows.map((row) => (isMissing(row[columnId]) ? { ...row, [columnId]: replacement } : row));
  }
  return cloneDataset(dataset, { rows, columns: recalculateColumns(dataset.columns, rows) });
}

export function convertColumnType(dataset: Dataset, columnId: string, type: ColumnType): Dataset {
  const columns = dataset.columns.map((column) => (column.id === columnId ? { ...column, type } : column));
  const rows = dataset.rows.map((row) => ({ ...row, [columnId]: coerceCell(row[columnId], type) }));
  return cloneDataset(dataset, { columns: recalculateColumns(columns, rows), rows });
}

export function addCalculatedColumn(
  dataset: Dataset,
  name: string,
  expression: string,
): Dataset {
  const id = uniqueColumnId(dataset, name);
  const evaluate = compileExpression(
    expression,
    dataset.columns.map((column) => column.id),
  );
  const rows = dataset.rows.map((row) => {
    try {
      const value = evaluate(row);
      return { ...row, [id]: value === null || value === undefined ? null : value };
    } catch {
      return { ...row, [id]: null };
    }
  });
  const columns = [
    ...dataset.columns,
    { id, name: name.trim(), type: 'number' as ColumnType, missing: 0, unique: 0, sample: [] },
  ];
  return cloneDataset(dataset, { columns: recalculateColumns(columns, rows), rows });
}

export function normalizeColumn(dataset: Dataset, columnId: string): Dataset {
  const values = numericValues(dataset.rows, columnId);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rows = dataset.rows.map((row) => {
    const value = row[columnId];
    if (typeof value !== 'number' || max === min) return row;
    return { ...row, [columnId]: (value - min) / (max - min) };
  });
  return cloneDataset(dataset, { rows });
}

export function standardizeColumn(dataset: Dataset, columnId: string): Dataset {
  const values = numericValues(dataset.rows, columnId);
  const avg = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const deviation = Math.sqrt(
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / Math.max(1, values.length),
  );
  const rows = dataset.rows.map((row) => {
    const value = row[columnId];
    if (typeof value !== 'number' || deviation === 0) return row;
    return { ...row, [columnId]: (value - avg) / deviation };
  });
  return cloneDataset(dataset, { rows });
}

export function replaceValues(
  dataset: Dataset,
  columnId: string,
  find: string,
  replacement: string,
): Dataset {
  const column = dataset.columns.find((item) => item.id === columnId);
  const rows = dataset.rows.map((row) => {
    if (String(row[columnId] ?? '') !== find) return row;
    const value: CellValue =
      column?.type === 'number' && Number.isFinite(Number(replacement))
        ? Number(replacement)
        : replacement === ''
          ? null
          : replacement;
    return { ...row, [columnId]: value };
  });
  return cloneDataset(dataset, { rows, columns: recalculateColumns(dataset.columns, rows) });
}

export function categorizeColumn(dataset: Dataset, columnId: string, bins = 4): Dataset {
  const values = numericValues(dataset.rows, columnId);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const newId = uniqueColumnId(dataset, `${columnId}_category`);
  const width = (max - min) / Math.max(1, bins);
  const rows = dataset.rows.map((row) => {
    const value = row[columnId];
    const index = typeof value === 'number' && width > 0 ? Math.min(bins - 1, Math.floor((value - min) / width)) : -1;
    return { ...row, [newId]: index < 0 ? 'Unknown' : `Q${index + 1}` };
  });
  const columns = [
    ...dataset.columns,
    { id: newId, name: `${columnId} category`, type: 'string' as ColumnType, missing: 0, unique: 0, sample: [] },
  ];
  return cloneDataset(dataset, { columns: recalculateColumns(columns, rows), rows });
}

export function createDatasetFromRows(name: string, columns: Dataset['columns'], rows: Dataset['rows']): Dataset {
  const timestamp = Date.now();
  return {
    id: uid('ds'),
    name,
    description: 'Dataset created in the data playground.',
    source: 'playground',
    columns: recalculateColumns(columns, rows),
    rows,
    createdAt: timestamp,
    updatedAt: timestamp,
    tags: ['playground'],
  };
}
