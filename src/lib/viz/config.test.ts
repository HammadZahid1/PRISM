import { describe, expect, it } from 'vitest';
import type { DataColumn, Dataset } from '@/types';
import { CHART_TYPES, autoConfig, baseConfig, chartLabel, firstCategorical, firstDate, firstNumeric, validateConfig } from './config';

const columns: DataColumn[] = [
  { id: 'region', name: 'Region', type: 'string', missing: 0, unique: 2 },
  { id: 'date', name: 'Date', type: 'date', missing: 0, unique: 2 },
  { id: 'sales', name: 'Sales', type: 'number', missing: 0, unique: 2 },
  { id: 'cost', name: 'Cost', type: 'number', missing: 0, unique: 2 },
];

const dataset: Dataset = {
  id: 'ds_1',
  name: 'Sales',
  description: '',
  source: 'sample',
  columns,
  rows: [
    { region: 'East', date: '2024-01-01', sales: 10, cost: 4 },
    { region: 'West', date: '2024-01-02', sales: 20, cost: 8 },
  ],
  createdAt: 0,
  updatedAt: 0,
  tags: [],
};

describe('visualization configuration', () => {
  it('provides all twelve chart types with labels', () => {
    expect(CHART_TYPES).toHaveLength(12);
    expect(chartLabel('treemap')).toBe('Treemap');
  });

  it('finds default fields by type', () => {
    expect(firstNumeric(dataset)).toBe('sales');
    expect(firstCategorical(dataset)).toBe('region');
    expect(firstDate(dataset)).toBe('date');
  });

  it('creates stable base configurations with unique ids', () => {
    const first = baseConfig('ds_1');
    const second = baseConfig('ds_1');
    expect(first.id).not.toBe(second.id);
    expect(first).toMatchObject({ type: 'bar', aggregation: 'none', bins: 12, limit: 24, showTooltip: true });
  });

  it('automatically maps fields for each chart type', () => {
    for (const { type } of CHART_TYPES) {
      const config = autoConfig(dataset, type);
      const validation = validateConfig(dataset, config);
      expect(validation.valid, `${type}: ${validation.errors.join(', ')}`).toBe(true);
    }
    expect(autoConfig(dataset, 'line').x).toBe('date');
    expect(autoConfig(dataset, 'scatter').x).toBe('sales');
    expect(autoConfig(dataset, 'histogram').x).toBe('sales');
  });

  it('reports invalid field mappings', () => {
    const config = autoConfig(dataset, 'bar');
    const invalid = validateConfig(dataset, { ...config, y: 'region', x: 'missing', category: 'nope' });
    expect(invalid.errors).toContain('The X field is not present in this dataset.');
    expect(invalid.errors).toContain('The Y field must be numeric.');
    expect(invalid.warnings).toContain('The category field is not present and will be ignored.');
  });

  it('requires value fields for most charts', () => {
    const config = autoConfig(dataset, 'line');
    expect(validateConfig(dataset, { ...config, y: '' }).errors).toContain('Choose a numeric value field for this chart.');
    expect(validateConfig({ ...dataset, rows: [] }, config).errors).toContain('The dataset has no rows to visualize.');
  });
});
