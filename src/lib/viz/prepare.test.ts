import { describe, expect, it } from 'vitest';
import type { DataColumn, Dataset } from '@/types';
import { prepareChartData } from './prepare';

const columns: DataColumn[] = [
  { id: 'region', name: 'Region', type: 'string', missing: 0, unique: 2 },
  { id: 'product', name: 'Product', type: 'string', missing: 0, unique: 2 },
  { id: 'sales', name: 'Sales', type: 'number', missing: 0, unique: 4 },
  { id: 'cost', name: 'Cost', type: 'number', missing: 0, unique: 4 },
];

const dataset: Dataset = {
  id: 'ds_1',
  name: 'Sales',
  description: '',
  source: 'sample',
  columns,
  rows: [
    { region: 'East', product: 'Alpha', sales: 10, cost: 4 },
    { region: 'East', product: 'Beta', sales: 20, cost: 8 },
    { region: 'West', product: 'Alpha', sales: 30, cost: 12 },
    { region: 'West', product: 'Beta', sales: 40, cost: 16 },
    { region: 'East', product: 'Alpha', sales: 50, cost: 20 },
  ],
  createdAt: 0,
  updatedAt: 0,
  tags: [],
};

const base = {
  id: 'chart',
  title: 'Chart',
  datasetId: 'ds_1',
  x: 'region',
  y: 'sales',
  category: 'product',
  size: '',
  color: '',
  aggregation: 'sum' as const,
  bins: 4,
  orientation: 'vertical' as const,
  stacked: false,
  smooth: false,
  showLegend: true,
  showGrid: true,
  showLabels: false,
  showTooltip: true,
  limit: 24,
};

describe('chart data preparation', () => {
  it('groups and aggregates series for cartesian charts', () => {
    const prepared = prepareChartData(dataset, { ...base, type: 'bar' });
    expect(prepared.categories).toEqual(['East', 'West']);
    expect(prepared.series).toEqual(['Alpha', 'Beta']);
    expect(prepared.points[0]).toMatchObject({ name: 'East', Alpha: 60, Beta: 20 });
    expect(prepared.total).toBe(2);
  });

  it('sorts distribution charts by value', () => {
    const prepared = prepareChartData(dataset, { ...base, type: 'pie' });
    expect(prepared.points).toEqual([
      { name: 'East', value: 80 },
      { name: 'West', value: 70 },
    ]);
  });

  it('keeps only rows with valid numeric coordinates for scatter charts', () => {
    const prepared = prepareChartData(dataset, {
      ...base,
      type: 'bubble',
      x: 'sales',
      y: 'cost',
      size: 'cost',
      aggregation: 'none',
    });
    expect(prepared.points).toHaveLength(5);
    expect(prepared.points[0]).toMatchObject({ x: 10, y: 4, size: 4, category: 'Alpha' });
    expect(prepared.numericValues).toContain(20);
  });

  it('builds histogram bins from numeric values', () => {
    const prepared = prepareChartData(dataset, { ...base, type: 'histogram', x: 'sales', y: '' });
    expect(prepared.points).toHaveLength(4);
    expect(prepared.total).toBe(5);
    expect(prepared.numericValues.reduce((sum, value) => sum + value, 0)).toBe(5);
    expect(prepared.points[0]).toHaveProperty('binStart');
  });

  it('computes quartiles and outliers for box plots', () => {
    const prepared = prepareChartData(dataset, { ...base, type: 'boxplot', y: 'sales', category: '' });
    expect(prepared.categories).toEqual(['East', 'West']);
    expect(prepared.points[0]).toMatchObject({ name: 'East', median: 20, count: 3 });
    expect(prepared.points[0]).toHaveProperty('outliers');
  });

  it('creates a dense heatmap matrix with averaged cells', () => {
    const prepared = prepareChartData(dataset, { ...base, type: 'heatmap', aggregation: 'mean' });
    expect(prepared.points).toHaveLength(4);
    expect(prepared.points[0]).toMatchObject({ row: 'East', column: 'Alpha', value: 30 });
    expect(prepared.series).toEqual(['Alpha', 'Beta']);
  });

  it('builds radar profiles from numeric dataset columns', () => {
    const prepared = prepareChartData(dataset, { ...base, type: 'radar', aggregation: 'mean' });
    expect(prepared.categories).toEqual(['Sales', 'Cost']);
    expect(prepared.series).toEqual(['Alpha', 'Beta']);
    expect(prepared.points[0]).toMatchObject({ subject: 'Sales', Alpha: 30, Beta: 30 });
  });
});
