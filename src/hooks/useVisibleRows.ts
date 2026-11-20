import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { queryDataset } from '@/lib/data/query';

export function useVisibleRows() {
  const datasets = useAppStore((state) => state.datasets);
  const activeDatasetId = useAppStore((state) => state.activeDatasetId);
  const filters = useAppStore((state) => state.filters);
  const sorts = useAppStore((state) => state.sorts);
  const search = useAppStore((state) => state.search);

  const dataset = useMemo(
    () => datasets.find((item) => item.id === activeDatasetId),
    [datasets, activeDatasetId],
  );

  const rows = useMemo(
    () =>
      dataset
        ? queryDataset(dataset.rows, { filters, sorts, search, columns: dataset.columns })
        : [],
    [dataset, filters, sorts, search],
  );

  return { dataset, rows, allRows: dataset?.rows ?? [] };
}
