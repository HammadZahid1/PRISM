import { describe, expect, it } from 'vitest';
import { buildDataset, createPresetDatasets, presetFactories } from './generators';

describe('preset datasets', () => {
  it('ships eight distinct sample datasets', () => {
    const datasets = createPresetDatasets();
    expect(presetFactories).toHaveLength(8);
    expect(datasets).toHaveLength(8);
    expect(new Set(datasets.map((dataset) => dataset.id)).size).toBe(8);
    expect(datasets.every((dataset) => dataset.source === 'sample' && dataset.rows.length > 0)).toBe(true);
  });

  it('generates deterministic values across calls', () => {
    const first = createPresetDatasets();
    const second = createPresetDatasets();
    expect(first.map((dataset) => dataset.rows)).toEqual(second.map((dataset) => dataset.rows));
  });

  it('defines stable column ids and inferred types', () => {
    const dataset = createPresetDatasets()[0];
    expect(dataset.columns.map((column) => column.id)).toEqual([
      'region',
      'country',
      'year',
      'population_millions',
      'growth_rate',
      'urban_share',
    ]);
    expect(dataset.columns.find((column) => column.id === 'year')?.type).toBe('number');
    expect(dataset.columns.find((column) => column.id === 'region')?.type).toBe('string');
    expect(dataset.rows[0]).toHaveProperty('region');
  });

  it('resolves slug collisions in custom datasets', () => {
    const dataset = buildDataset(
      'Collision test',
      '',
      ['Value', 'Value', 'Value!'],
      [[1, 2, 3]],
      ['test'],
      1,
    );
    expect(dataset.columns.map((column) => column.id)).toEqual(['value', 'value_2', 'value_3']);
    expect(dataset.rows[0]).toEqual({ value: 1, value_2: 2, value_3: 3 });
  });
});
