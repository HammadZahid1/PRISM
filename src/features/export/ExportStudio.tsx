import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, Download, FileCode2, FileImage, FileJson, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { ChartRenderer } from '@/components/charts/ChartRenderer';
import { Button } from '@/components/ui/Button';
import { Badge, Field, SegmentedControl, TextInput, Toggle } from '@/components/ui/Primitives';
import { EmptyState, Notice, StatTile } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { datasetExport, chartConfigPayload, safeFileName, serializeSvg, svgToPng } from '@/lib/data/export';
import { downloadBlob } from '@/lib/utils';

type Mode = 'dataset' | 'visualization';

export function ExportStudio() {
  const { dataset, rows, allRows } = useVisibleRows();
  const charts = useAppStore((state) => state.visualizations);
  const selectedChartId = useAppStore((state) => state.selectedChartId);
  const selectChart = useAppStore((state) => state.selectChart);
  const recordActivity = useAppStore((state) => state.recordActivity);
  const notify = useAppStore((state) => state.notify);
  const chartRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('dataset');
  const [format, setFormat] = useState<'csv' | 'json' | 'png' | 'svg' | 'config'>('csv');
  const [name, setName] = useState('');
  const [useFiltered, setUseFiltered] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chart = charts.find((item) => item.id === selectedChartId) ?? charts[0];
  const exportName = name.trim() || (mode === 'dataset' ? dataset?.name ?? 'dataset' : chart?.title ?? 'chart');
  const rowCount = useFiltered ? rows.length : allRows.length;

  const preview = useMemo(() => {
    if (!dataset) return '';
    const payload = datasetExport(dataset, useFiltered ? rows : allRows, format === 'json' ? 'json' : 'csv');
    return payload.content.slice(0, 1200);
  }, [dataset, rows, allRows, format, useFiltered]);

  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState title="Nothing to export" description="Load a dataset before creating a CSV, JSON or visualization export." />
      </div>
    );
  }

  const exportDataset = () => {
    const payload = datasetExport(dataset, useFiltered ? rows : allRows, format === 'json' ? 'json' : 'csv');
    downloadBlob(payload.content, `${safeFileName(exportName)}.${payload.extension}`, payload.mime);
    recordActivity('Dataset exported', `${exportName}.${payload.extension}`, 'export');
    notify('Export ready', `${rowCount.toLocaleString()} rows written to ${payload.extension.toUpperCase()}.`, 'success');
  };

  const exportVisualization = async () => {
    setError(null);
    if (!chart) {
      setError('Create a visualization first.');
      return;
    }
    try {
      if (format === 'config') {
        downloadBlob(
          JSON.stringify(chartConfigPayload(chart, dataset), null, 2),
          `${safeFileName(exportName)}.prism.json`,
          'application/json',
        );
      } else {
        const surface = chartRef.current?.querySelector('.recharts-surface') ?? chartRef.current?.querySelector('svg');
        if (!surface) {
          setError('Chart surface is not ready. Try again in a moment.');
          return;
        }
        if (format === 'svg') {
          downloadBlob(serializeSvg(surface), `${safeFileName(exportName)}.svg`, 'image/svg+xml;charset=utf-8');
        } else {
          const blob = await svgToPng(surface, 1600, 900);
          downloadBlob(blob, `${safeFileName(exportName)}.png`, 'image/png');
        }
      }
      recordActivity('Visualization exported', `${exportName}.${format}`, 'export');
      notify('Visualization exported', format.toUpperCase(), 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="label mb-1">Export studio</div>
          <h1 className="text-sm font-semibold text-[#e9edf3]">Create local exports</h1>
        </div>
        <SegmentedControl
          value={mode}
          options={[
            { value: 'dataset', label: 'Dataset' },
            { value: 'visualization', label: 'Visualization' },
          ]}
          onChange={(next) => {
            setMode(next);
            setFormat(next === 'dataset' ? 'csv' : 'png');
            setError(null);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Rows to export" value={rowCount.toLocaleString()} accent />
        <StatTile label="Columns" value={dataset.columns.length} />
        <StatTile label="Charts" value={charts.length} />
        <StatTile label="Format" value={format.toUpperCase()} />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto xl:grid-cols-[320px_1fr]">
        <Panel title="Export settings" subtitle="Choose a format and file name" icon={<Download size={14} />}>
          <div className="space-y-3">
            <Field label="Export name">
              <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder={mode === 'dataset' ? dataset.name : chart?.title ?? 'chart'} />
            </Field>
            <Field label="Format">
              <div className="grid grid-cols-3 gap-1.5">
                {(mode === 'dataset'
                  ? ([['csv', 'CSV', FileSpreadsheet], ['json', 'JSON', FileJson]] as const)
                  : ([['png', 'PNG', FileImage], ['svg', 'SVG', FileCode2], ['config', 'Config', FileCode2]] as const)
                ).map(([value, label, Icon]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setFormat(value)}
                    className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10px] transition-colors ${
                      format === value
                        ? 'border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                        : 'border-white/[0.07] text-[#8a94a3] hover:text-[#e9edf3]'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            {mode === 'dataset' && (
              <>
                <Toggle checked={useFiltered} onChange={setUseFiltered} label="Export filtered rows" description="Applies search, filters and sorting from the data explorer." />
                <div className="mono rounded-md border border-white/[0.06] bg-white/[0.02] p-2 text-[10px] text-[#8a94a3]">
                  {safeFileName(exportName)}.{format}
                </div>
              </>
            )}
            {mode === 'visualization' && (
              <Field label="Chart">
                <select className="control w-full" value={chart?.id ?? ''} onChange={(event) => selectChart(event.target.value)}>
                  {charts.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </Field>
            )}
            {error && <Notice tone="error">{error}</Notice>}
            <Button
              variant="primary"
              className="w-full"
              icon={<CheckCircle2 size={14} />}
              onClick={() => (mode === 'dataset' ? exportDataset() : void exportVisualization())}
              disabled={mode === 'visualization' && !chart}
            >
              Export {format.toUpperCase()}
            </Button>
          </div>
        </Panel>

        <Panel title="Export preview" subtitle={mode === 'dataset' ? 'First 1,200 characters' : 'Rendered chart preview'} icon={<Download size={14} />}>
          {mode === 'dataset' ? (
            <pre className="mono max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-white/[0.06] bg-[#0b0d10] p-3 text-[10px] leading-relaxed text-[#8a94a3]">
              {preview}
            </pre>
          ) : chart ? (
            <div className="flex h-[420px] flex-col gap-2">
              <div className="flex items-center justify-between">
                <Badge tone="accent">{chart.title}</Badge>
                <Badge>{chart.type}</Badge>
              </div>
              <div ref={chartRef} className="min-h-0 flex-1 rounded-md border border-white/[0.06] bg-[#0b0d10] p-2">
                <ChartRenderer config={chart} dataset={dataset} rows={rows} compact />
              </div>
            </div>
          ) : (
            <EmptyState compact title="No chart selected" description="Create a chart in the visualization studio to export it." />
          )}
        </Panel>
      </div>
    </div>
  );
}
