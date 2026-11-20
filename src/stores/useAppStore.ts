import { create } from 'zustand';
import type {
  ActivityEntry,
  ChartConfig,
  DataFilter,
  Dataset,
  ModuleId,
  SelectedDatum,
  Settings,
  SortRule,
  Toast,
  UniverseConfig,
} from '@/types';
import { uid } from '@/lib/utils';
import { clearPreferences, loadPreferences, savePreferences } from '@/lib/storage/preferences';
import {
  clearWorkspaceStorage,
  datasetStorageSize,
  persistCharts,
  persistDataset,
  persistedCharts,
  persistedDatasets,
  removePersistedDataset,
} from '@/lib/storage/idb';
import { defaultUniverseConfig } from '@/lib/viz/universe';
import type { WorkspaceBackup } from '@/lib/storage/workspace';

interface Snapshot {
  datasets: Dataset[];
  activeDatasetId: string | null;
  visualizations: ChartConfig[];
  filters: DataFilter[];
  sorts: SortRule[];
  search: string;
}

interface TimelineState {
  dateColumn: string;
  metricColumn: string;
  start: number;
  end: number;
  position: number;
  playing: boolean;
  speed: number;
}

interface AppState {
  module: ModuleId;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandOpen: boolean;
  importOpen: boolean;
  datasets: Dataset[];
  activeDatasetId: string | null;
  visualizations: ChartConfig[];
  selectedChartId: string | null;
  selectedDatum: SelectedDatum | null;
  inspectorOpen: boolean;
  filters: DataFilter[];
  sorts: SortRule[];
  search: string;
  universeConfig: UniverseConfig;
  timeline: TimelineState;
  settings: Settings;
  toasts: Toast[];
  activity: ActivityEntry[];
  history: { past: Snapshot[]; future: Snapshot[] };
  hydrated: boolean;
}

interface AppActions {
  setModule: (module: ModuleId) => void;
  toggleSidebar: () => void;
  setMobileNav: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  addDataset: (dataset: Dataset) => void;
  selectDataset: (id: string) => void;
  removeDataset: (id: string) => void;
  updateDataset: (dataset: Dataset, label: string) => void;
  hydrate: () => Promise<void>;
  addFilter: (filter?: Partial<DataFilter>) => void;
  updateFilter: (id: string, patch: Partial<DataFilter>) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;
  toggleSort: (columnId: string, additive?: boolean) => void;
  clearSorts: () => void;
  setSearch: (query: string) => void;
  addChart: (config: ChartConfig) => void;
  updateChart: (id: string, patch: Partial<ChartConfig>) => void;
  removeChart: (id: string) => void;
  duplicateChart: (id: string) => void;
  selectChart: (id: string | null) => void;
  selectDatum: (datum: SelectedDatum | null) => void;
  setInspectorOpen: (open: boolean) => void;
  updateUniverse: (patch: Partial<UniverseConfig>) => void;
  updateUniverseMapping: (patch: Partial<UniverseConfig['mapping']>) => void;
  setTimeline: (patch: Partial<TimelineState>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  notify: (title: string, detail?: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
  recordActivity: (label: string, detail: string, kind: ActivityEntry['kind']) => void;
  undo: () => void;
  redo: () => void;
  resetWorkspace: () => void;
  clearSavedData: () => Promise<void>;
  restoreWorkspace: (backup: WorkspaceBackup) => void;
}

export type AppStore = AppState & AppActions;

function snapshot(state: AppState): Snapshot {
  return {
    datasets: state.datasets,
    activeDatasetId: state.activeDatasetId,
    visualizations: state.visualizations,
    filters: state.filters,
    sorts: state.sorts,
    search: state.search,
  };
}

function pushedHistory(state: AppState) {
  return {
    past: [...state.history.past, snapshot(state)].slice(-30),
    future: [] as Snapshot[],
  };
}

const initialSettings = loadPreferences();

export const useAppStore = create<AppStore>()((set, get) => ({
  module: 'dashboard',
  sidebarCollapsed: initialSettings.sidebarCollapsed,
  mobileNavOpen: false,
  commandOpen: false,
  importOpen: false,
  datasets: [],
  activeDatasetId: null,
  visualizations: [],
  selectedChartId: null,
  selectedDatum: null,
  inspectorOpen: false,
  filters: [],
  sorts: [],
  search: '',
  universeConfig: defaultUniverseConfig,
  timeline: {
    dateColumn: '',
    metricColumn: '',
    start: 0,
    end: 0,
    position: 0,
    playing: false,
    speed: 1,
  },
  settings: initialSettings,
  toasts: [],
  activity: [],
  history: { past: [], future: [] },
  hydrated: false,

  setModule: (module) => set({ module, mobileNavOpen: false }),
  toggleSidebar: () =>
    set((state) => {
      const sidebarCollapsed = !state.sidebarCollapsed;
      const settings = { ...state.settings, sidebarCollapsed };
      savePreferences(settings);
      return { sidebarCollapsed, settings };
    }),
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setImportOpen: (importOpen) => set({ importOpen }),

  addDataset: (dataset) => {
    set((state) => ({
      history: pushedHistory(state),
      datasets: [dataset, ...state.datasets.filter((item) => item.id !== dataset.id)],
      activeDatasetId: dataset.id,
      filters: [],
      sorts: [],
      search: '',
      activity: [
        {
          id: uid('act'),
          at: Date.now(),
          label: 'Dataset loaded',
          detail: `${dataset.name} · ${dataset.rows.length.toLocaleString()} rows`,
          kind: 'dataset' as const,
        },
        ...state.activity,
      ].slice(0, 40),
    }));
    get().notify('Dataset loaded', `${dataset.name} is ready to explore.`, 'success');
    if (get().settings.persistDatasets && datasetStorageSize(dataset) < 4_000_000) {
      void persistDataset(dataset);
    }
  },

  selectDataset: (id) => {
    const dataset = get().datasets.find((item) => item.id === id);
    if (!dataset) return;
    set({
      activeDatasetId: id,
      filters: [],
      sorts: [],
      search: '',
      timeline: { dateColumn: '', metricColumn: '', start: 0, end: 0, position: 0, playing: false, speed: 1 },
    });
    get().recordActivity('Dataset opened', dataset.name, 'dataset');
  },

  removeDataset: (id) => {
    set((state) => {
      const datasets = state.datasets.filter((dataset) => dataset.id !== id);
      const visualizations = state.visualizations.filter((chart) => chart.datasetId !== id);
      return {
        history: pushedHistory(state),
        datasets,
        visualizations,
        activeDatasetId: state.activeDatasetId === id ? (datasets[0]?.id ?? null) : state.activeDatasetId,
        selectedChartId: visualizations.some((chart) => chart.id === state.selectedChartId)
          ? state.selectedChartId
          : (visualizations[0]?.id ?? null),
      };
    });
    void removePersistedDataset(id);
    get().notify('Dataset removed', 'The local copy was deleted.', 'info');
  },

  updateDataset: (dataset, label) => {
    set((state) => ({
      history: pushedHistory(state),
      datasets: state.datasets.map((item) => (item.id === dataset.id ? dataset : item)),
      activity: [
        { id: uid('act'), at: Date.now(), label, detail: dataset.name, kind: 'transform' as const },
        ...state.activity,
      ].slice(0, 40),
    }));
    if (get().settings.persistDatasets && datasetStorageSize(dataset) < 4_000_000) {
      void persistDataset(dataset);
    }
  },

  hydrate: async () => {
    if (get().hydrated) return;
    const [datasets, charts] = await Promise.all([persistedDatasets(), persistedCharts()]);
    set((state) => ({
      datasets: datasets.length ? datasets : state.datasets,
      visualizations: charts.length ? charts : state.visualizations,
      activeDatasetId: state.activeDatasetId ?? datasets[0]?.id ?? null,
      selectedChartId: state.selectedChartId ?? charts[0]?.id ?? null,
      hydrated: true,
    }));
  },

  addFilter: (filter) =>
    set((state) => ({
      filters: [
        ...state.filters,
        {
          id: uid('filter'),
          columnId: state.datasets.find((item) => item.id === state.activeDatasetId)?.columns[0]?.id ?? '',
          operator: 'contains',
          value: '',
          enabled: true,
          ...filter,
        },
      ],
    })),
  updateFilter: (id, patch) =>
    set((state) => ({ filters: state.filters.map((filter) => (filter.id === id ? { ...filter, ...patch } : filter)) })),
  removeFilter: (id) => set((state) => ({ filters: state.filters.filter((filter) => filter.id !== id) })),
  clearFilters: () => set({ filters: [], search: '' }),
  toggleSort: (columnId, additive = false) =>
    set((state) => {
      const existing = state.sorts.find((rule) => rule.columnId === columnId);
      if (!existing) {
        return { sorts: additive ? [...state.sorts, { columnId, direction: 'asc' }] : [{ columnId, direction: 'asc' }] };
      }
      if (existing.direction === 'asc') {
        return {
          sorts: state.sorts.map((rule) =>
            rule.columnId === columnId ? { ...rule, direction: 'desc' as const } : rule,
          ),
        };
      }
      return { sorts: state.sorts.filter((rule) => rule.columnId !== columnId) };
    }),
  clearSorts: () => set({ sorts: [] }),
  setSearch: (search) => set({ search }),

  addChart: (config) => {
    set((state) => ({
      history: pushedHistory(state),
      visualizations: [...state.visualizations, config],
      selectedChartId: config.id,
      activity: [
        { id: uid('act'), at: Date.now(), label: 'Visualization created', detail: config.title, kind: 'visualization' as const },
        ...state.activity,
      ].slice(0, 40),
    }));
    void persistCharts(get().visualizations);
  },
  updateChart: (id, patch) => {
    set((state) => ({
      history: pushedHistory(state),
      visualizations: state.visualizations.map((chart) => (chart.id === id ? { ...chart, ...patch } : chart)),
    }));
    void persistCharts(get().visualizations);
  },
  removeChart: (id) => {
    set((state) => {
      const visualizations = state.visualizations.filter((chart) => chart.id !== id);
      return {
        history: pushedHistory(state),
        visualizations,
        selectedChartId: state.selectedChartId === id ? (visualizations[0]?.id ?? null) : state.selectedChartId,
      };
    });
    void persistCharts(get().visualizations);
  },
  duplicateChart: (id) => {
    const chart = get().visualizations.find((item) => item.id === id);
    if (!chart) return;
    const copy = { ...chart, id: uid('chart'), title: `${chart.title} copy` };
    get().addChart(copy);
  },
  selectChart: (selectedChartId) => set({ selectedChartId }),
  selectDatum: (selectedDatum) => set({ selectedDatum, inspectorOpen: Boolean(selectedDatum) }),
  setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),

  updateUniverse: (patch) => set((state) => ({ universeConfig: { ...state.universeConfig, ...patch } })),
  updateUniverseMapping: (patch) =>
    set((state) => ({
      universeConfig: { ...state.universeConfig, mapping: { ...state.universeConfig.mapping, ...patch } },
    })),
  setTimeline: (patch) => set((state) => ({ timeline: { ...state.timeline, ...patch } })),

  updateSettings: (patch) => {
    set((state) => {
      const settings = { ...state.settings, ...patch };
      savePreferences(settings);
      return {
        settings,
        sidebarCollapsed: settings.sidebarCollapsed,
        universeConfig: { ...state.universeConfig, maxPoints: settings.universePoints },
      };
    });
  },
  resetSettings: () => {
    const settings = { ...initialSettings };
    savePreferences(settings);
    set((state) => ({
      settings,
      sidebarCollapsed: settings.sidebarCollapsed,
      universeConfig: { ...state.universeConfig, maxPoints: settings.universePoints },
    }));
    get().notify('Settings reset', 'Preferences were restored to defaults.', 'info');
  },

  notify: (title, detail, tone = 'info') => {
    const toast: Toast = { id: uid('toast'), title, detail, tone, at: Date.now() };
    set((state) => ({ toasts: [...state.toasts.slice(-3), toast] }));
    window.setTimeout(() => get().dismissToast(toast.id), 4200);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  recordActivity: (label, detail, kind) =>
    set((state) => ({
      activity: [{ id: uid('act'), at: Date.now(), label, detail, kind }, ...state.activity].slice(0, 40),
    })),

  undo: () => {
    const { past, future } = get().history;
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set((state) => ({
      ...previous,
      history: { past: past.slice(0, -1), future: [snapshot(state), ...future].slice(0, 30) },
    }));
  },
  redo: () => {
    const { past, future } = get().history;
    if (future.length === 0) return;
    const next = future[0];
    set((state) => ({
      ...next,
      history: { past: [...past, snapshot(state)].slice(-30), future: future.slice(1) },
    }));
  },
  resetWorkspace: () => {
    set((state) => ({
      history: pushedHistory(state),
      datasets: [],
      activeDatasetId: null,
      visualizations: [],
      selectedChartId: null,
      filters: [],
      sorts: [],
      search: '',
      module: 'dashboard',
    }));
    get().notify('Workspace reset', 'All datasets and charts were cleared from this session.', 'info');
  },
  clearSavedData: async () => {
    await clearWorkspaceStorage();
    clearPreferences();
    get().notify('Saved data cleared', 'Local browser storage has been emptied.', 'success');
  },
  restoreWorkspace: (backup) => {
    const charts = backup.charts.filter((chart) => backup.datasets.some((dataset) => dataset.id === chart.datasetId));
    set((state) => ({
      history: pushedHistory(state),
      datasets: backup.datasets,
      activeDatasetId: backup.datasets[0]?.id ?? null,
      visualizations: charts,
      selectedChartId: charts[0]?.id ?? null,
      filters: [],
      sorts: [],
      search: '',
      module: 'dashboard',
    }));
    if (backup.settings) get().updateSettings(backup.settings);
    if (get().settings.persistDatasets) {
      backup.datasets.forEach((dataset) => {
        if (datasetStorageSize(dataset) < 4_000_000) void persistDataset(dataset);
      });
    }
    void persistCharts(charts);
    get().recordActivity('Backup restored', `${backup.datasets.length} datasets · ${charts.length} charts`, 'dataset');
    get().notify('Workspace restored', 'Your backup has been loaded into PRISM.', 'success');
  },
}));

export function activeDataset(state: AppStore): Dataset | undefined {
  return state.datasets.find((dataset) => dataset.id === state.activeDatasetId);
}

export function canUndo(state: AppStore): boolean {
  return state.history.past.length > 0;
}

export function canRedo(state: AppStore): boolean {
  return state.history.future.length > 0;
}
