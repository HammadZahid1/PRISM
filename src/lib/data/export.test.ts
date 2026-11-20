import { describe, expect, it } from 'vitest';
import type { ChartConfig, Dataset } from '@/types';
import { chartConfigPayload, datasetExport, rowsToCsv, rowsToJson, safeFileName } from './export';

const dataset: Dataset = {
  id: 'ds_1',
  name: 'Demo Data',
  description: '',
  source: 'sample',
  columns: [
    { id: 'name', name: 'Name', type: 'string', missing: 0, unique: 2 },
    { id: 'score', name: 'Score', type: 'number', missing: 0, unique: 2 },
  ],
  rows: [
    { name: 'Ada, Jr.', score: 10 },
    { name: 'Grace "Amazing"', score: null },
  ],
  createdAt: 0,
  updatedAt: 0,
  tags: [],
};

const chart: ChartConfig = {
  id: 'chart_1',
  type: 'bar',
  title: 'Scores',
  datasetId: 'ds_1',
  x: 'name',
  y: 'score',
  category: '',
  size: '',
  color: '',
  aggregation: 'sum',
  bins: 12,
  orientation: 'vertical',
  stacked: false,
  smooth: false,
  showLegend: true,
  showGrid: true,
  showLabels: false,
  showTooltip: true,
  limit: 24,
};

describe('export helpers', () => {
  it('escapes CSV quotes, commas, and missing values', () => {
    const csv = rowsToCsv(dataset.columns, dataset.rows);
    expect(csv.split('\n')[0]).toBe('Name,Score');
    expect(csv.split('\n')[1]).toBe('"Ada, Jr.",10');
    expect(csv.split('\n')[2]).toBe('"Grace ""Amazing""",');
  });

  it('exports JSON using human-readable column names', () => {
    const parsed = JSON.parse(rowsToJson(dataset.columns, dataset.rows));
    expect(parsed[0]).toEqual({ Name: 'Ada, Jr.', Score: 10 });
    expect(parsed[1].Score).toBeNull();
  });

  it('selects payload format and metadata', () => {
    expect(datasetExport(dataset, dataset.rows, 'csv').extension).toBe('csv');
    expect(datasetExport(dataset, dataset.rows, 'json').mime).toBe('application/json');
  });

  it('sanitizes file names', () => {
    expect(safeFileName('My Data / Q1!')).toBe('my-data-q1');
    expect(safeFileName('///')).toBe('prism-export');
  });

  it('builds portable chart configuration payloads', () => {
    const payload = chartConfigPayload(chart, dataset);
    expect(payload.format).toBe('prism-chart-config');
    expect(payload.chart).toEqual(chart);
    expect(payload.dataset).toEqual({ id: 'ds_1', name: 'Demo Data', columns: ['Name', 'Score'] });
    expect(chartConfigPayload(chart).dataset).toBeUndefined();
  });
});
