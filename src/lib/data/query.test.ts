import { describe, expect, it } from 'vitest';
import type { DataColumn, DataFilter } from '@/types';
import { applyFilters, applySort, compareValues, queryDataset, searchRows } from './query';

const columns: DataColumn[] = [
  { id: 'name', name: 'Name', type: 'string', missing: 0, unique: 3 },
  { id: 'score', name: 'Score', type: 'number', missing: 0, unique: 3 },
  { id: 'date', name: 'Date', type: 'date', missing: 0, unique: 3 },
];

const rows = [
  { name: 'Beta', score: 20, date: '2024-01-02' },
  { name: 'Alpha', score: 10, date: '2024-01-01' },
  { name: 'Gamma', score: null, date: null },
];

function filter(overrides: Partial<DataFilter>): DataFilter {
  return {
    id: 'f1',
    columnId: 'score',
    operator: 'gt',
    value: '5',
    enabled: true,
    ...overrides,
  };
}

describe('dataset query engine', () => {
  it('compares numbers, text, booleans, and missing values', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues('item2', 'item10')).toBeLessThan(0);
    expect(compareValues(null, 1)).toBeGreaterThan(0);
    expect(compareValues(true, false)).toBeGreaterThan(0);
  });

  it('applies contains, numeric, and range filters', () => {
    expect(applyFilters(rows, [filter({ columnId: 'name', operator: 'contains', value: 'al' })], columns)).toHaveLength(1);
    expect(applyFilters(rows, [filter({ operator: 'gte', value: '20' })], columns)).toHaveLength(1);
    expect(applyFilters(rows, [filter({ operator: 'between', value: '10', value2: '20' })], columns)).toHaveLength(2);
    expect(
      applyFilters(rows, [filter({ columnId: 'date', operator: 'between', value: '2024-01-01', value2: '2024-01-02' })], columns),
    ).toHaveLength(2);
  });

  it('handles empty and not-empty filters without a filter value', () => {
    expect(applyFilters(rows, [filter({ operator: 'empty', value: '' })], columns)).toEqual([rows[2]]);
    expect(applyFilters(rows, [filter({ operator: 'not_empty', value: '' })], columns)).toHaveLength(2);
    expect(applyFilters(rows, [filter({ enabled: false })], columns)).toHaveLength(3);
  });

  it('sorts numerically and supports multi-column rules', () => {
    const sorted = applySort(rows, [{ columnId: 'score', direction: 'asc' }]);
    expect(sorted.map((row) => row.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
    const descending = applySort(rows, [{ columnId: 'score', direction: 'desc' }]);
    expect(descending[0].name).toBe('Beta');
    expect(rows[0].name).toBe('Beta');
  });

  it('searches across all columns and composes the full query', () => {
    expect(searchRows(rows, 'gamma', columns)).toEqual([rows[2]]);
    expect(searchRows(rows, '2024-01-01', columns)).toEqual([rows[1]]);
    const result = queryDataset(rows, {
      filters: [filter({ operator: 'gte', value: '10' })],
      sorts: [{ columnId: 'score', direction: 'asc' }],
      search: 'a',
      columns,
    });
    expect(result.map((row) => row.name)).toEqual(['Alpha', 'Beta']);
  });
});
