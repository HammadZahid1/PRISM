import { describe, expect, it } from 'vitest';
import type { DataColumn, Dataset } from '@/types';
import { autoUniverseMapping, buildUniverseData, defaultUniverseConfig, densityScale, universeColorVector } from './universe';

const columns: DataColumn[] = [
  { id: 'group', name: 'Group', type: 'string', missing: 0, unique: 2 },
  { id: 'x', name: 'X', type: 'number', missing: 0, unique: 4 },
  { id: 'y', name: 'Y', type: 'number', missing: 0, unique: 4 },
  { id: 'z', name: 'Z', type: 'number', missing: 0, unique: 4 },
  { id: 'weight', name: 'Weight', type: 'number', missing: 0, unique: 4 },
  { id: 'energy', name: 'Energy', type: 'number', missing: 0, unique: 4 },
];

const dataset: Dataset = {
  id: 'ds',
  name: 'Points',
  description: '',
  source: 'sample',
  columns,
  rows: [
    { group: 'A', x: 1, y: 2, z: 3, weight: 4, energy: 5 },
    { group: 'A', x: 2, y: 4, z: 6, weight: 8, energy: 10 },
    { group: 'B', x: 3, y: 6, z: 9, weight: 12, energy: 15 },
    { group: 'B', x: 4, y: 8, z: 12, weight: 16, energy: 20 },
  ],
  createdAt: 0,
  updatedAt: 0,
  tags: [],
};

describe('data universe', () => {
  it('auto-maps numeric and categorical columns', () => {
    expect(autoUniverseMapping(dataset)).toEqual({
      x: 'x', y: 'y', z: 'z', size: 'weight', color: 'group', intensity: 'energy',
    });
  });

  it('builds normalized particles with category colors', () => {
    const result = buildUniverseData(dataset, defaultUniverseConfig);
    expect(result.particles).toHaveLength(4);
    expect(result.numericColumns).toEqual(['x', 'y', 'z', 'weight', 'energy']);
    expect(result.categoryColumns).toEqual(['group']);
    expect(result.usedFallback).toBe(false);
    expect(result.particles[0].position).toHaveLength(3);
    expect(result.particles[0].color).toMatch(/^#/);
    expect(result.particles[0].values).toHaveProperty('Group', 'A');
  });

  it('clusters, reorganizes, and radially arranges particles by mode', () => {
    const scatter = buildUniverseData(dataset, defaultUniverseConfig);
    for (const mode of ['cluster', 'density', 'radial', 'orbit'] as const) {
      const result = buildUniverseData(dataset, { ...defaultUniverseConfig, mode });
      expect(result.particles).toHaveLength(4);
      expect(result.particles.map((particle) => particle.position)).not.toEqual(
        scatter.particles.map((particle) => particle.position),
      );
    }
  });

  it('caps rendered particles and flags datasets without enough numeric axes', () => {
    const large = {
      ...dataset,
      rows: Array.from({ length: 150 }, (_, index) => ({
        group: index % 2 === 0 ? 'A' : 'B',
        x: index,
        y: index * 2,
        z: index * 3,
        weight: index + 1,
        energy: index + 2,
      })),
    };
    const capped = buildUniverseData(large, { ...defaultUniverseConfig, maxPoints: 40 });
    expect(capped.particles).toHaveLength(100);
    const sparse = buildUniverseData(
      { ...dataset, columns: columns.slice(0, 2) },
      defaultUniverseConfig,
    );
    expect(sparse.usedFallback).toBe(true);
  });

  it('converts colors and scales densities', () => {
    expect(universeColorVector('#ff0000')).toEqual([1, 0, 0]);
    expect(universeColorVector('rgb(0, 255, 0)')).toEqual([0, 1, 0]);
    expect(densityScale([10, 20, 30])).toEqual([0, 0.5, 1]);
    expect(densityScale([5, 5])).toEqual([0.5, 0.5]);
  });
});
