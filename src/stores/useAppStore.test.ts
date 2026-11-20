import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChartConfig, Dataset } from '@/types';
import { defaultSettings } from '@/lib/storage/preferences';
import { baseConfig } from '@/lib/viz/config';

const storage = new Map<string, string>();
vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  },
  setTimeout: () => 0,
  clearTimeout: () => undefined,
});

const { useAppStore, activeDataset, canRedo, canUndo } = await import('./useAppStore');

const dataset: Dataset = {
  id: 'ds_1',
  name: 'Demo',
  description: '',
  source: 'sample',
  columns: [
    { id: 'name', name: 'Name', type: 'string', missing: 0, unique: 1 },
    { id: 'value', name: 'Value', type: 'number', missing: 0, unique: 1 },
  ],
  rows: [{ name: 'A', value: 1 }],
  createdAt: 0,
  updatedAt: 0,
  tags: [],
};

const chart: ChartConfig = { ...baseConfig(dataset.id, 'bar'), id: 'chart_1', title: 'Bar', x: 'name', y: 'value' };

beforeEach(() => {
  storage.clear();
  useAppStore.setState({
    module: 'dashboard',
    datasets: [],
    activeDatasetId: null,
    visualizations: [],
    selectedChartId: null,
    filters: [],
    sorts: [],
    search: '',
    settings: { ...defaultSettings },
    toasts: [],
    activity: [],
    history: { past: [], future: [] },
    hydrated: false,
  });
});

afterAll(() => vi.unstubAllGlobals());

describe('application store', () => {
  it('loads datasets as the active dataset and records activity', () => {
    useAppStore.getState().addDataset(dataset);
    const state = useAppStore.getState();
    expect(activeDataset(state)).toEqual(dataset);
    expect(state.activity[0].label).toBe('Dataset loaded');
    expect(canUndo(state)).toBe(true);
    expect(canRedo(state)).toBe(false);
  });

  it('switches datasets and clears transient query state', () => {
    useAppStore.setState({
      datasets: [dataset, { ...dataset, id: 'ds_2', name: 'Other' }],
      activeDatasetId: 'ds_1',
      filters: [{ id: 'f', columnId: 'name', operator: 'contains', value: 'A', enabled: true }],
      search: 'A',
    });
    useAppStore.getState().selectDataset('ds_2');
    const state = useAppStore.getState();
    expect(state.activeDatasetId).toBe('ds_2');
    expect(state.filters).toEqual([]);
    expect(state.search).toBe('');
  });

  it('removes charts belonging to a deleted dataset', () => {
    useAppStore.setState({ datasets: [dataset], activeDatasetId: dataset.id, visualizations: [chart], selectedChartId: chart.id });
    useAppStore.getState().removeDataset(dataset.id);
    const state = useAppStore.getState();
    expect(state.datasets).toEqual([]);
    expect(state.visualizations).toEqual([]);
    expect(state.selectedChartId).toBeNull();
  });

  it('manages filters, sorts, and search', () => {
    useAppStore.setState({ datasets: [dataset], activeDatasetId: dataset.id });
    const store = useAppStore.getState();
    store.addFilter({ columnId: 'name' });
    store.toggleSort('name');
    store.toggleSort('name');
    store.setSearch('demo');
    let state = useAppStore.getState();
    expect(state.filters).toHaveLength(1);
    expect(state.sorts).toEqual([{ columnId: 'name', direction: 'desc' }]);
    expect(state.search).toBe('demo');
    useAppStore.getState().clearFilters();
    useAppStore.getState().clearSorts();
    state = useAppStore.getState();
    expect(state.filters).toEqual([]);
    expect(state.sorts).toEqual([]);
    expect(state.search).toBe('');
  });

  it('adds, duplicates, updates, and removes visualizations', () => {
    useAppStore.getState().addChart(chart);
    expect(useAppStore.getState().selectedChartId).toBe(chart.id);
    useAppStore.getState().updateChart(chart.id, { title: 'Updated' });
    expect(useAppStore.getState().visualizations[0].title).toBe('Updated');
    useAppStore.getState().duplicateChart(chart.id);
    expect(useAppStore.getState().visualizations).toHaveLength(2);
    useAppStore.getState().removeChart(chart.id);
    expect(useAppStore.getState().visualizations).toHaveLength(1);
  });

  it('updates and resets preferences persistently', () => {
    useAppStore.getState().updateSettings({ accent: 'violet', universePoints: 9000 });
    expect(useAppStore.getState().settings.accent).toBe('violet');
    expect(useAppStore.getState().universeConfig.maxPoints).toBe(9000);
    expect(storage.has('prism.preferences.v1')).toBe(true);
    useAppStore.getState().resetSettings();
    expect(useAppStore.getState().settings.accent).toBe(defaultSettings.accent);
    expect(useAppStore.getState().universeConfig.maxPoints).toBe(defaultSettings.universePoints);
  });

  it('restores history snapshots with undo and redo', () => {
    useAppStore.getState().addDataset(dataset);
    useAppStore.getState().addChart(chart);
    expect(useAppStore.getState().visualizations).toHaveLength(1);
    useAppStore.getState().undo();
    expect(useAppStore.getState().visualizations).toHaveLength(0);
    expect(canRedo(useAppStore.getState())).toBe(true);
    useAppStore.getState().redo();
    expect(useAppStore.getState().visualizations).toHaveLength(1);
  });

  it('restores a validated workspace backup into state', () => {
    useAppStore.getState().restoreWorkspace({
      version: 1,
      app: 'PRISM',
      exportedAt: Date.now(),
      datasets: [dataset],
      charts: [chart],
    });
    const state = useAppStore.getState();
    expect(state.module).toBe('dashboard');
    expect(state.datasets).toEqual([dataset]);
    expect(state.visualizations).toEqual([chart]);
    expect(state.activeDatasetId).toBe(dataset.id);
    expect(state.activity[0].label).toBe('Backup restored');
  });

  it('resets and clears workspace state', async () => {
    useAppStore.setState({ datasets: [dataset], activeDatasetId: dataset.id, visualizations: [chart] });
    useAppStore.getState().resetWorkspace();
    expect(useAppStore.getState().datasets).toEqual([]);
    await useAppStore.getState().clearSavedData();
    expect(storage.size).toBe(0);
  });
});
