import { describe, expect, it } from 'vitest';
import type { DataColumn } from '@/types';
import { categoricalStats, correlationMatrix, dateStats, findOutliers, numericStats, summarizeColumns } from './stats';

const columns: DataColumn[] = [
  { id: 'value', name: 'Value', type: 'number', missing: 0, unique: 0 },
  { id: 'twin', name: 'Twin', type: 'number', missing: 0, unique: 0 },
  { id: 'group', name: 'Group', type: 'string', missing: 0, unique: 0 },
  { id: 'date', name: 'Date', type: 'date', missing: 0, unique: 0 },
];

const rows = [
  { value: 1, twin: 2, group: 'A', date: '2024-01-01' },
  { value: 2, twin: 4, group: 'B', date: '2024-01-02' },
  { value: 3, twin: 6, group: 'A', date: '2024-02-01' },
  { value: 4, twin: 8, group: 'C', date: null },
  { value: 100, twin: 200, group: 'A', date: '2024-03-01' },
];

describe('dataset statistics', () => {
  it('computes numeric summaries including quartiles', () => {
    const stats = numericStats(rows, 'value');
    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(22);
    expect(stats.median).toBe(3);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(100);
    expect(stats.q1).toBe(2);
    expect(stats.q3).toBe(4);
    expect(stats.sum).toBe(110);
    expect(stats.missing).toBe(0);
  });

  it('returns empty numeric summaries for absent columns', () => {
    const stats = numericStats([{ value: null }], 'value');
    expect(stats.count).toBe(0);
    expect(stats.missing).toBe(1);
    expect(stats.mean).toBeNaN();
  });

  it('builds categorical frequency distributions', () => {
    const stats = categoricalStats(rows, 'group', 2);
    expect(stats.unique).toBe(3);
    expect(stats.mostFrequent).toHaveLength(2);
    expect(stats.mostFrequent[0]).toEqual({ value: 'A', count: 3, ratio: 0.6 });
  });

  it('summarizes date ranges and monthly buckets', () => {
    const stats = dateStats(rows, 'date');
    expect(stats.count).toBe(4);
    expect(stats.missing).toBe(1);
    expect(stats.earliest).toBe('2024-01-01');
    expect(stats.latest).toBe('2024-03-01');
    expect(stats.days).toBe(60);
    expect(stats.distribution).toHaveLength(3);
  });

  it('creates correlation matrices for numeric columns', () => {
    const matrix = correlationMatrix(rows, columns);
    expect(matrix.ids).toEqual(['value', 'twin']);
    expect(matrix.values[0][0]).toBe(1);
    expect(matrix.values[0][1]).toBeCloseTo(1, 10);
    expect(matrix.values[1][0]).toBeCloseTo(1, 10);
  });

  it('finds IQR outliers on the high side', () => {
    const outliers = findOutliers(rows, 'value');
    expect(outliers).toHaveLength(1);
    expect(outliers[0]).toMatchObject({ rowIndex: 4, value: 100, side: 'high' });
    expect(findOutliers(rows, 'value', 60)).toHaveLength(0);
  });

  it('summarizes every column by its declared type', () => {
    const summaries = summarizeColumns(columns, rows);
    expect(summaries.map((item) => item.kind)).toEqual(['number', 'number', 'category', 'date']);
  });
});
