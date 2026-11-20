import {
  ArrowRight,
  ChartNoAxesCombined,
  Database,
  FileUp,
  Grid2X2,
  Layers3,
  Orbit,
  Sparkles,
  Table2,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { EmptyState, StatTile } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { formatDate, formatNumber } from '@/lib/utils';
import type { ModuleId } from '@/types';
import { RecentDatasets } from './RecentDatasets';
import { SampleGallery } from './SampleGallery';
import { RecommendedCharts } from './RecommendedCharts';

const quickActions: { label: string; detail: string; icon: typeof Database; module: ModuleId }[] = [
  { label: 'Explore data', detail: 'Sort, filter and inspect rows', icon: Table2, module: 'explorer' },
  { label: 'Build a chart', detail: 'Map fields to 12 chart types', icon: ChartNoAxesCombined, module: 'studio' },
  { label: 'Enter the universe', detail: '3D attribute exploration', icon: Orbit, module: 'universe' },
  { label: 'Analyze patterns', detail: 'Correlation and outliers', icon: Grid2X2, module: 'patterns' },
];

export function Dashboard() {
  const datasets = useAppStore((state) => state.datasets);
  const activeDataset = useAppStore((state) => state.datasets.find((item) => item.id === state.activeDatasetId));
  const charts = useAppStore((state) => state.visualizations);
  const setModule = useAppStore((state) => state.setModule);
  const setImportOpen = useAppStore((state) => state.setImportOpen);
  const activity = useAppStore((state) => state.activity);

  const totalRows = datasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
  const totalColumns = datasets.reduce((sum, dataset) => sum + dataset.columns.length, 0);

  return (
    <div className="h-full overflow-y-auto px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label mb-1.5 flex items-center gap-2">
              <span className="h-1 w-4 rounded bg-[var(--accent-cyan)]" />
              Local analysis environment
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-[#e9edf3] md:text-2xl">
              Workspace overview
            </h1>
            <p className="mt-1 text-xs text-[#6c7685]">
              Load a dataset, map its fields and explore the structure from every angle.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={<FileUp size={14} />} onClick={() => setImportOpen(true)}>
              Import data
            </Button>
            <Button variant="primary" icon={<Sparkles size={14} />} onClick={() => setModule('presets')}>
              Load a sample
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Datasets" value={datasets.length} detail="In this workspace" icon={<Database size={14} />} accent />
          <StatTile label="Total rows" value={formatNumber(totalRows, 0)} detail="Across loaded datasets" icon={<Table2 size={14} />} />
          <StatTile label="Columns" value={formatNumber(totalColumns, 0)} detail="Available fields" icon={<Layers3 size={14} />} />
          <StatTile label="Visualizations" value={charts.length} detail="Saved charts" icon={<ChartNoAxesCombined size={14} />} />
        </div>

        <RecentDatasets onBrowseSamples={() => setModule('presets')} />
        {activeDataset && <RecommendedCharts dataset={activeDataset} />}
        <SampleGallery />

        {!activeDataset && (
          <EmptyState
            icon={<Database size={20} />}
            title="No dataset loaded yet"
            description="Import a CSV, JSON or TSV file, or start with one of the bundled sample datasets. Everything is processed in your browser."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="primary" icon={<FileUp size={14} />} onClick={() => setImportOpen(true)}>
                  Open import dialog
                </Button>
                <Button icon={<Sparkles size={14} />} onClick={() => setModule('presets')}>
                  Browse samples
                </Button>
              </div>
            }
          />
        )}

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Panel title="Quick start" subtitle="Jump into an analysis workflow" icon={<ArrowRight size={14} />}>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const disabled = !activeDataset && action.module !== 'presets';
                return (
                  <button
                    key={action.label}
                    type="button"
                    disabled={disabled}
                    onClick={() => setModule(action.module)}
                    className="group flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all hover:border-[var(--accent-cyan)]/25 hover:bg-[var(--accent-cyan)]/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="mt-0.5 rounded-md border border-white/[0.08] bg-[#14171c] p-1.5 text-[#8a94a3] transition-colors group-hover:text-[var(--accent-cyan)]">
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-[#dbe3ec]">{action.label}</span>
                      <span className="mt-0.5 block text-[10px] text-[#6c7685]">{action.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Recent activity" subtitle="Local workspace events" icon={<Sparkles size={14} />}>
            {activity.length === 0 ? (
              <p className="text-[11px] text-[#6c7685]">
                Activity will appear here as you load data, build charts and export results.
              </p>
            ) : (
              <div className="space-y-2">
                {activity.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2.5 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-cyan)]/70" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] text-[#dbe3ec]">{entry.label}</div>
                      <div className="truncate text-[10px] text-[#6c7685]">{entry.detail}</div>
                    </div>
                    <span className="mono shrink-0 text-[9px] text-[#5c6675]">{formatDate(entry.at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Suggested next steps" subtitle="Based on your current workspace" icon={<Sparkles size={14} />}>
          <div className="flex flex-wrap items-center gap-2">
            <Suggestion label="Preview sample datasets" onClick={() => setModule('presets')} />
            <Suggestion label="Inspect column types" onClick={() => setModule('explorer')} disabled={!activeDataset} />
            <Suggestion label="Generate a default chart" onClick={() => setModule('studio')} disabled={!activeDataset} />
            <Suggestion label="View statistics" onClick={() => setModule('statistics')} disabled={!activeDataset} />
            <Suggestion label="Configure universe mappings" onClick={() => setModule('universe')} disabled={!activeDataset} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Suggestion({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="chip transition-colors hover:border-[var(--accent-cyan)]/30 hover:text-[var(--accent-cyan)] disabled:opacity-35"
    >
      {label}
      <ArrowRight size={10} />
    </button>
  );
}
