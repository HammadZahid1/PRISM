import type { CellValue, DataColumn, DataFilter, SortRule } from '@/types/data';
import { isMissing } from './types';
import type { Row } from './stats';

function comparable(value: CellValue): number | string {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value === null) return '';
  return String(value);
}

export function compareValues(a: CellValue, b: CellValue): number {
  if (isMissing(a) && isMissing(b)) return 0;
  if (isMissing(a)) return 1;
  if (isMissing(b)) return -1;
  const left = comparable(a);
  const right = comparable(b);
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

function matchFilter(row: Row, filter: DataFilter, columns: DataColumn[]): boolean {
  if (!filter.enabled || !filter.value) return true;
  const value = row[filter.columnId];
  const column = columns.find((item) => item.id === filter.columnId);
  const raw = filter.value.trim();
  const number = Number(raw);
  const text = String(value ?? '').toLowerCase();
  const needle = raw.toLowerCase();

  switch (filter.operator) {
    case 'contains':
      return text.includes(needle);
    case 'equals':
      if (column?.type === 'number') return Number(value) === number;
      return String(value ?? '').toLowerCase() === needle;
    case 'not_equals':
      if (column?.type === 'number') return Number(value) !== number;
      return String(value ?? '').toLowerCase() !== needle;
    case 'gt':
      return Number(value) > number;
    case 'gte':
      return Number(value) >= number;
    case 'lt':
      return Number(value) < number;
    case 'lte':
      return Number(value) <= number;
    case 'between': {
      const upper = Number(filter.value2 ?? raw);
      const lowerBound = Math.min(number, upper);
      const upperBound = Math.max(number, upper);
      if (column?.type === 'date') {
        const time = Date.parse(String(value));
        return time >= Date.parse(filter.value) && time <= Date.parse(filter.value2 ?? filter.value);
      }
      return Number(value) >= lowerBound && Number(value) <= upperBound;
    }
    case 'empty':
      return isMissing(value);
    case 'not_empty':
      return !isMissing(value);
    default:
      return true;
  }
}

export function applyFilters(rows: Row[], filters: DataFilter[], columns: DataColumn[]): Row[] {
  const active = filters.filter((filter) => filter.enabled);
  if (active.length === 0) return rows;
  return rows.filter((row) => active.every((filter) => matchFilter(row, filter, columns)));
}

export function applySort(rows: Row[], sortRules: SortRule[]): Row[] {
  if (sortRules.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const rule of sortRules) {
      const result = compareValues(a[rule.columnId], b[rule.columnId]);
      if (result !== 0) return rule.direction === 'asc' ? result : -result;
    }
    return 0;
  });
}

export function searchRows(rows: Row[], query: string, columns: DataColumn[]): Row[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  const searchable = columns.map((column) => column.id);
  return rows.filter((row) =>
    searchable.some((id) => String(row[id] ?? '').toLowerCase().includes(needle)),
  );
}

export function queryDataset(
  rows: Row[],
  options: { filters: DataFilter[]; sorts: SortRule[]; search: string; columns: DataColumn[] },
): Row[] {
  const searched = searchRows(rows, options.search, options.columns);
  const filtered = applyFilters(searched, options.filters, options.columns);
  return applySort(filtered, options.sorts);
}
