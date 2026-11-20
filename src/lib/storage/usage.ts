import type { ChartConfig, Dataset } from '@/types';
import { datasetStorageSize } from './idb';

export interface StorageUsage {
  usage: number;
  quota: number;
  estimated: boolean;
}

export async function estimateStorageUsage(datasets: Dataset[], charts: ChartConfig[]): Promise<StorageUsage> {
  const estimatedUsage =
    datasets.reduce((total, dataset) => total + datasetStorageSize(dataset), 0) + charts.length * 512;

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage ?? estimatedUsage,
        quota: estimate.quota ?? 0,
        estimated: false,
      };
    } catch {
      // Fall through to the local estimate when storage APIs are unavailable.
    }
  }

  return { usage: estimatedUsage, quota: 0, estimated: true };
}
