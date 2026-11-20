import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Dataset } from '@/types';
import { datasetStorageSize } from './idb';
import { estimateStorageUsage } from './usage';

const dataset = {
  id: 'ds',
  name: 'Demo',
  description: '',
  source: 'sample',
  columns: [
    { id: 'a', name: 'A', type: 'number', missing: 0, unique: 1 },
    { id: 'b', name: 'B', type: 'string', missing: 0, unique: 1 },
  ],
  rows: [{ a: 1, b: 'x' }, { a: 2, b: 'y' }],
  createdAt: 0,
  updatedAt: 0,
  tags: [],
} satisfies Dataset;

afterEach(() => vi.unstubAllGlobals());

describe('storage accounting', () => {
  it('estimates dataset size from row and column counts', () => {
    expect(datasetStorageSize(dataset)).toBe(2 * 2 * 48);
  });

  it('uses browser quota information when available', async () => {
    vi.stubGlobal('navigator', {
      storage: { estimate: async () => ({ usage: 5000, quota: 10000 }) },
    });
    const result = await estimateStorageUsage([dataset], [{} as never]);
    expect(result).toEqual({ usage: 5000, quota: 10000, estimated: false });
  });

  it('falls back to local estimates when storage APIs are missing', async () => {
    vi.stubGlobal('navigator', {});
    const result = await estimateStorageUsage([dataset], []);
    expect(result.usage).toBe(datasetStorageSize(dataset));
    expect(result.quota).toBe(0);
    expect(result.estimated).toBe(true);
  });

  it('falls back when storage estimate throws', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        estimate: async () => {
          throw new Error('blocked');
        },
      },
    });
    const result = await estimateStorageUsage([dataset], []);
    expect(result.estimated).toBe(true);
  });
});
