import { describe, expect, it } from 'vitest';
import type { Dataset } from '@/types';
import {
  addCalculatedColumn,
  categorizeColumn,
  convertColumnType,
  createDatasetFromRows,
  deleteRows,
  fillMissing,
  normalizeColumn,
  removeColumns,
  removeDuplicates,
  renameColumn,
  replaceValues,
  standardizeColumn,
} from './transform';

function fixture(): Dataset {
  return createDatasetFromRows(
    'Test',
    [
      { id: 'name', name: 'Name', type: 'string', missing: 0, unique: 0 },
      { id: 'value', name: 'Value', type: 'number', missing: 0, unique: 0 },
      { id: 'flag', name: 'Flag', type: 'string', missing: 0, unique: 0 },
    ],
    [
      { name: 'A', value: 2, flag: 'yes' },
      { name: 'A', value: 4, flag: 'no' },
      { name: 'B', value: null, flag: 'yes' },
      { name: 'C', value: 10, flag: 'yes' },
    ],
  );
}

describe('data transformations', () => {
  it('creates datasets with recalculated column metadata', () => {
    const dataset = fixture();
    expect(dataset.source).toBe('playground');
    expect(dataset.columns.find((column) => column.id === 'value')?.missing).toBe(1);
    expect(dataset.columns.find((column) => column.id === 'name')?.unique).toBe(3);
  });

  it('renames columns and refuses to remove the last column', () => {
    expect(renameColumn(fixture(), 'name', ' Label ').columns[0].name).toBe('Label');
    expect(() => renameColumn(fixture(), 'name', '  ')).toThrow(/cannot be empty/);
    expect(() => removeColumns(fixture(), ['name', 'value', 'flag'])).toThrow(/at least one column/);
  });

  it('removes columns, rows, and duplicate records', () => {
    const withoutFlag = removeColumns(fixture(), ['flag']);
    expect(withoutFlag.columns.map((column) => column.id)).toEqual(['name', 'value']);
    expect(withoutFlag.rows[0]).toEqual({ name: 'A', value: 2 });

    expect(deleteRows(fixture(), [0, 2]).rows).toHaveLength(2);
    expect(removeDuplicates(fixture(), ['name']).rows.map((row) => row.name)).toEqual(['A', 'B', 'C']);
    expect(removeDuplicates(fixture()).rows).toHaveLength(4);
  });

  it('fills missing values with mean, median, zero, drop, or label', () => {
    expect(fillMissing(fixture(), 'value', 'mean').rows[2].value).toBeCloseTo(5.3333, 4);
    expect(fillMissing(fixture(), 'value', 'median').rows[2].value).toBe(4);
    expect(fillMissing(fixture(), 'value', 'zero').rows[2].value).toBe(0);
    expect(fillMissing(fixture(), 'value', 'drop').rows).toHaveLength(3);
    expect(fillMissing(fixture(), 'value', 'label').rows[2].value).toBe('Unknown');
  });

  it('converts types and replaces values safely', () => {
    const converted = convertColumnType(fixture(), 'flag', 'boolean');
    expect(converted.rows[0].flag).toBe(true);
    expect(converted.rows[1].flag).toBe(false);
    expect(replaceValues(fixture(), 'name', 'A', 'Alpha').rows[0].name).toBe('Alpha');
    expect(replaceValues(fixture(), 'name', 'A', '').rows[0].name).toBeNull();
  });

  it('adds calculated columns using the safe expression engine', () => {
    const result = addCalculatedColumn(fixture(), 'Double', '[value] * 2');
    expect(result.columns.at(-1)?.id).toBe('double');
    expect(result.rows[0].double).toBe(4);
    expect(result.rows[2].double).toBe(0);
    expect(() => addCalculatedColumn(fixture(), 'Bad', '[nope] * 2')).toThrow(/Unknown column/);
  });

  it('normalizes, standardizes, and categorizes numeric columns', () => {
    const normalized = normalizeColumn(fixture(), 'value');
    expect(normalized.rows[0].value).toBe(0);
    expect(normalized.rows[3].value).toBe(1);
    const standardized = standardizeColumn(fixture(), 'value');
    expect(standardized.rows[0].value).toBeLessThan(0);
    const categorized = categorizeColumn(fixture(), 'value', 2);
    expect(categorized.columns.at(-1)?.id).toBe('value_category');
    expect(categorized.rows[2].value_category).toBe('Unknown');
    expect(['Q1', 'Q2']).toContain(categorized.rows[3].value_category);
  });
});
