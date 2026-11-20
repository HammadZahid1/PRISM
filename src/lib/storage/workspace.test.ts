import { describe, expect, it } from 'vitest';
import type { ChartConfig, Dataset } from '@/types';
import { createWorkspaceBackup, parseWorkspaceBackup, serializeWorkspaceBackup } from './workspace';

const dataset: Dataset = {
  id: 'ds_1',
  name: 'Demo',
  description: 'Fixture',
  source: 'sample',
  columns: [{ id: 'value', name: 'Value', type: 'number', missing: 0, unique: 1 }],
  rows: [{ value: 1 }],
  createdAt: 0,
  updatedAt: 0,
  tags: [],
};

const chart: ChartConfig = {
  id: 'chart_1',
  type: 'scatter',
  title: 'Scatter',
  datasetId: 'ds_1',
  x: 'value',
  y: 'value',
  category: '',
  size: '',
  color: '',
  aggregation: 'none',
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

describe('workspace backups', () => {
  it('round-trips a valid backup', () => {
    const backup = createWorkspaceBackup([dataset], [chart]);
    const restored = parseWorkspaceBackup(serializeWorkspaceBackup(backup));
    expect(restored.version).toBe(1);
    expect(restored.app).toBe('PRISM');
    expect(restored.datasets).toEqual([dataset]);
    expect(restored.charts).toEqual([chart]);
  });

  it('normalizes partial chart configurations', () => {
    const raw = JSON.stringify({
      app: 'PRISM',
      version: 1,
      datasets: [dataset],
      charts: [{ id: 'c2', title: 'Tiny', datasetId: 'ds_1', type: 'bar' }],
    });
    const restored = parseWorkspaceBackup(raw);
    expect(restored.charts[0]).toMatchObject({
      id: 'c2',
      title: 'Tiny',
      type: 'bar',
      bins: 12,
      limit: 24,
      orientation: 'vertical',
      showTooltip: true,
    });
  });

  it('rejects invalid documents and schemas', () => {
    expect(() => parseWorkspaceBackup('not json')).toThrow(/valid JSON/);
    expect(() => parseWorkspaceBackup('[]')).toThrow(/JSON object/);
    expect(() => parseWorkspaceBackup(JSON.stringify({ app: 'OTHER', version: 1 }))).toThrow(/PRISM v1/);
    expect(() => parseWorkspaceBackup(JSON.stringify({ app: 'PRISM', version: 1, charts: [] }))).toThrow(/missing datasets or charts/);
    expect(() =>
      parseWorkspaceBackup(JSON.stringify({ app: 'PRISM', version: 1, datasets: [{ id: 2 }], charts: [] })),
    ).toThrow(/datasets.*invalid/);
    expect(() =>
      parseWorkspaceBackup(JSON.stringify({ app: 'PRISM', version: 1, datasets: [], charts: [{ id: 'x' }] })),
    ).toThrow(/charts.*invalid/);
  });
});
