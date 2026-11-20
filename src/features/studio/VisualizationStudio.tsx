import { useState } from 'react';
import {
  ChartNoAxesCombined,
  Copy,
  Download,
  Expand,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { ChartRenderer } from '@/components/charts/ChartRenderer';
import { ChartConfigPanel } from '@/components/charts/ChartConfigPanel';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge, SegmentedControl } from '@/components/ui/Primitives';
import { EmptyState } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { autoConfig, chartLabel } from '@/lib/viz/config';
import { chartConfigPayload, safeFileName } from '@/lib/data/export';
import { downloadBlob, toDisplay } from '@/lib/utils';
import type { ChartConfig } from '@/types';

export function VisualizationStudio() {
  const { dataset, rows } = useVisibleRows();
  const charts = useAppStore((state) => state.visualizations);
  const selectedChartId = useAppStore((state) => state.selectedChartId);
  const selectChart = useAppStore((state) => state.selectChart);
  const addChart = useAppStore((state) => state.addChart);
  const duplicateChart = useAppStore((state) => state.duplicateChart);
  const removeChart = useAppStore((state) => state.removeChart);
  const selectedDatum = useAppStore((state) => state.selectedDatum);
  const selectDatum = useAppStore((state) => state.selectDatum);
  const defaultChart = useAppStore((state) => state.settings.defaultChart);
  const notify = useAppStore((state) => state.notify);
  const [columns, setColumns] = useState<'1' | '2' | '3'>('2');
  const [largeCharts, setLargeCharts] = useState<string[]>([]);
  const [maximized, setMaximized] = useState<string | null>(null);

  const selectedChart = charts.find((chart) => chart.id === selectedChartId);

  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<ChartNoAxesCombined size={20} />}
          title="No data to visualize"
          description="Load a dataset first. PRISM will suggest suitable chart types and field mappings automatically."
        />
      </div>
    );
  }

  const createChart = (type: ChartConfig['type'] = defaultChart as ChartConfig['type']) => {
    addChart(autoConfig(dataset, type));
    notify('Chart created', `${chartLabel(type)} added to the workspace.`, 'success');
  };

  const exportConfig = (chart: ChartConfig) => {
    downloadBlob(
      JSON.stringify(chartConfigPayload(chart, dataset), null, 2),
      `${safeFileName(chart.title)}.prism.json`,
      'application/json',
    );
    notify('Configuration exported', chart.title, 'success');
  };

  const gridClass = columns === '1' ? 'grid-cols-1' : columns === '2' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3';

  return (
    <div className="flex h-full min-h-0 gap-3 p-3">
      <aside className="hidden w-48 shrink-0 flex-col gap-2 lg:flex">
        <Panel title="Visualizations" subtitle={`${charts.length} charts`} icon={<ChartNoAxesCombined size={14} />} className="min-h-0 flex-1" flush>
          <div className="flex h-full flex-col p-2">
            <Button size="sm" variant="primary" icon={<Plus size={12} />} className="mb-2" onClick={() => createChart()}>
              New chart
            </Button>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {charts.length === 0 && (
                <p className="px-1 py-4 text-center text-[10px] leading-relaxed text-[#6c7685]">
                  No charts yet. Create one to start exploring this dataset.
                </p>
              )}
              {charts.map((chart) => (
                <button
                  type="button"
                  key={chart.id}
                  onClick={() => selectChart(chart.id)}
                  className={`flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left transition-colors ${
                    chart.id === selectedChartId
                      ? 'border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/[0.07]'
                      : 'border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mono text-[9px] text-[#5c6675]">{chart.type.slice(0, 3).toUpperCase()}</span>
                  <span className="min-w-0 flex-1 truncate text-[10px] text-[#b8c2cf]">{chart.title}</span>
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="label mb-1">Visualization studio</div>
            <h1 className="text-sm font-semibold text-[#e9edf3]">{dataset.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <SegmentedControl
              value={columns}
              options={[
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
              ]}
              onChange={setColumns}
            />
            <Button size="sm" icon={<Plus size={12} />} onClick={() => createChart()}>New chart</Button>
          </div>
        </div>

        {charts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={<ChartNoAxesCombined size={20} />}
              title="Build your first visualization"
              description="Choose a chart type and PRISM will map the dataset columns for you. Every chart is driven by the loaded data."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {(['bar', 'line', 'scatter'] as const).map((type) => (
                    <Button key={type} size="sm" onClick={() => createChart(type)}>
                      {chartLabel(type)}
                    </Button>
                  ))}
                </div>
              }
            />
          </div>
        ) : (
          <div className={`grid min-h-0 flex-1 content-start gap-3 overflow-y-auto ${gridClass}`}>
            {charts.map((chart) => {
              const large = largeCharts.includes(chart.id);
              return (
                <div
                  key={chart.id}
                  className={`panel flex flex-col overflow-hidden ${large ? 'min-h-[520px]' : 'min-h-[340px]'}`}
                  onMouseDown={() => selectChart(chart.id)}
                >
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-medium text-[#dbe3ec]">{chart.title}</div>
                      <div className="mono text-[9px] text-[#5c6675]">
                        {chart.type} · {chart.x || '—'} → {chart.y || '—'}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconButton
                        label="Toggle chart size"
                        size="sm"
                        icon={large ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                        onClick={() =>
                          setLargeCharts((current) =>
                            large ? current.filter((id) => id !== chart.id) : [...current, chart.id],
                          )
                        }
                      />
                      <IconButton label="Maximize chart" size="sm" icon={<Expand size={12} />} onClick={() => setMaximized(chart.id)} />
                      <IconButton label="Duplicate chart" size="sm" icon={<Copy size={12} />} onClick={() => duplicateChart(chart.id)} />
                      <IconButton label="Export chart configuration" size="sm" icon={<Download size={12} />} onClick={() => exportConfig(chart)} />
                      <IconButton label="Delete chart" size="sm" icon={<Trash2 size={12} />} onClick={() => removeChart(chart.id)} />
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 p-2">
                    <ChartRenderer config={chart} dataset={dataset} rows={rows} onSelect={selectDatum} compact />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="hidden w-[286px] shrink-0 flex-col gap-3 xl:flex">
        <Panel className="min-h-0 flex-1" bodyClassName="overflow-y-auto p-3">
          {selectedChart ? (
            <ChartConfigPanel config={selectedChart} dataset={dataset} />
          ) : (
            <p className="text-[11px] text-[#6c7685]">Select a chart to configure its fields and appearance.</p>
          )}
        </Panel>
        {selectedDatum && (
          <Panel title="Selection inspector" icon={<Expand size={13} />} actions={<IconButton label="Clear selection" size="sm" icon={<X size={12} />} onClick={() => selectDatum(null)} />}>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between gap-2"><span className="text-[#6c7685]">Label</span><span className="mono truncate text-[#dbe3ec]">{selectedDatum.label}</span></div>
              <div className="flex justify-between gap-2"><span className="text-[#6c7685]">Value</span><span className="mono text-[var(--accent-cyan)]">{toDisplay(selectedDatum.value)}</span></div>
              {selectedDatum.series && (
                <div className="flex justify-between gap-2"><span className="text-[#6c7685]">Series</span><span className="mono text-[#b8c2cf]">{selectedDatum.series}</span></div>
              )}
              <div className="border-t border-white/[0.06] pt-2 text-[10px] leading-relaxed text-[#6c7685]">
                {selectedDatum.rowIndex !== undefined && dataset.rows[selectedDatum.rowIndex]
                  ? 'The source record is highlighted in the data explorer.'
                  : 'Click a data point to inspect its mapped values.'}
              </div>
              <Button size="sm" variant="ghost" onClick={() => useAppStore.getState().setModule('explorer')}>
                Open source rows
              </Button>
            </div>
          </Panel>
        )}
      </aside>

      {maximized && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setMaximized(null)}>
          <div className="panel h-[86vh] w-[min(1100px,94vw)] p-3" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <Badge tone="accent">{charts.find((chart) => chart.id === maximized)?.title}</Badge>
              <IconButton label="Close maximized chart" icon={<X size={14} />} onClick={() => setMaximized(null)} />
            </div>
            <div className="h-[calc(100%-36px)]">
              {(() => {
                const chart = charts.find((item) => item.id === maximized);
                return chart ? <ChartRenderer config={chart} dataset={dataset} rows={rows} onSelect={selectDatum} /> : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
