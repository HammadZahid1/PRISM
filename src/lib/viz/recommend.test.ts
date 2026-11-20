import { describe, expect, it } from 'vitest';
import type { CellValue, DataColumn, Dataset } from '@/types';
import { recommendCharts } from './recommend';
import { validateConfig } from './config';

function makeDataset(columns: DataColumn[], rows: Record<string, CellValue>[]): Dataset {
  return {
    id: 'ds_recommend',
    name: 'Recommendation fixture',
    description: '',
    source: 'sample',
    columns,
    rows,
    createdAt: 0,
    updatedAt: 0,
    tags: [],
  };
}

const date: DataColumn = { id: 'date', name: 'Date', type: 'date', missing: 0, unique: 3 };
const group: DataColumn = { id: 'group', name: 'Group', type: 'string', missing: 0, unique: 3 };
const value: DataColumn = { id: 'value', name: 'Value', type: 'number', missing: 0, unique: 3 };
const second: DataColumn = { id: 'second', name: 'Second', type: 'number', missing: 0, unique: 3 };
const third: DataColumn = { id: 'third', name: 'Third', type: 'number', missing: 0, unique: 3 };

describe('chart recommendations', () => {
  it('returns no suggestions for empty datasets', () => {
    expect(recommendCharts(makeDataset([], []))).toEqual([]);
    expect(recommendCharts(makeDataset([value], []))).toEqual([]);
  });

  it('prioritizes a line chart for date and numeric columns', () => {
    const dataset = makeDataset([date, value], [
      { date: '2024-01-01', value: 1 },
      { date: '2024-01-02', value: 2 },
      { date: '2024-01-03', value: 3 },
    ]);
    const recommendations = recommendCharts(dataset);
    expect(recommendations[0].type).toBe('line');
    expect(recommendations[0].reason).toContain('time-series');
    expect(recommendations.some((item) => item.type === 'area')).toBe(true);
  });

  it('suggests a bar chart for low-cardinality categories with measures', () => {
    const dataset = makeDataset([group, value], [
      { group: 'A', value: 1 },
      { group: 'B', value: 2 },
      { group: 'C', value: 3 },
    ]);
    const recommendations = recommendCharts(dataset);
    expect(recommendations.some((item) => item.type === 'bar')).toBe(true);
    expect(recommendations.some((item) => item.type === 'pie')).toBe(true);
  });

  it('suggests scatter and bubble charts for multiple numeric fields', () => {
    const dataset = makeDataset([value, second, third], [
      { value: 1, second: 3, third: 7 },
      { value: 2, second: 2, third: 8 },
      { value: 3, second: 1, third: 9 },
    ]);
    const types = recommendCharts(dataset).map((item) => item.type);
    expect(types).toContain('scatter');
    expect(types).toContain('bubble');
  });

  it('avoids pie charts for high-cardinality categories', () => {
    const highCardinality: DataColumn = { id: 'label', name: 'Label', type: 'string', missing: 0, unique: 40 };
    const rows = Array.from({ length: 40 }, (_, index) => ({ label: `L${index}`, value: index }));
    const dataset = makeDataset([highCardinality, value], rows);
    expect(recommendCharts(dataset).some((item) => item.type === 'pie')).toBe(false);
  });

  it('returns unique, valid configurations and respects the limit', () => {
    const dataset = makeDataset([date, group, value, second, third], [
      { date: '2024-01-01', group: 'A', value: 1, second: 3, third: 7 },
      { date: '2024-01-02', group: 'B', value: 2, second: 2, third: 8 },
      { date: '2024-01-03', group: 'C', value: 3, second: 1, third: 9 },
    ]);
    const recommendations = recommendCharts(dataset, 3);
    expect(recommendations).toHaveLength(3);
    expect(new Set(recommendations.map((item) => item.type)).size).toBe(3);
    for (const item of recommendations) {
      expect(validateConfig(dataset, item.config).valid).toBe(true);
      expect(item.config.title).toContain(dataset.name);
    }
  });
});
