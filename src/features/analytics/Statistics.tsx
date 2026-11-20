import { useMemo, useState } from 'react';
import { Activity, ChartNoAxesCombined, Hash, Type } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Dataset } from '@/types';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { EmptyState, StatTile } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { Badge, Select } from '@/components/ui/Primitives';
import { categoricalStats, dateStats, numericStats, summarizeColumns } from '@/lib/data/stats';
import { categoryColor } from '@/lib/color';
import { formatNumber } from '@/lib/utils';
import { typeLabel } from '@/lib/data/types';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <div className="label">{label}</div>
      <div className="mono mt-1 text-xs text-[#dbe3ec]">{value}</div>
    </div>
  );
}

function DistributionChart({
  data,
  color = '#22d3ee',
}: {
  data: { name: string; value: number }[];
  color?: string;
}) {
  if (data.length === 0) return <p className="py-8 text-center text-[10px] text-[#6c7685]">No distribution available.</p>;
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 2 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: '#6c7685', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#6c7685', fontSize: 9 }} axisLine={false} tickLine={false} width={42} />
          <Tooltip
            contentStyle={{ background: '#14171c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
            itemStyle={{ color: '#e9edf3' }}
          />
          <Bar dataKey="value" fill={color} fillOpacity={0.65} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatisticsWorkspace({ dataset }: { dataset: Dataset }) {
  const { rows } = useVisibleRows();
  const summaries = useMemo(() => summarizeColumns(dataset.columns, rows), [dataset.columns, rows]);
  const [columnId, setColumnId] = useState(dataset.columns[0]?.id ?? '');
  const column = dataset.columns.find((item) => item.id === columnId) ?? dataset.columns[0];

  if (!column) return <EmptyState title="No columns" description="This dataset has no columns to summarize." />;

  const distribution = useMemo(() => {
    if (!column) return [];
    if (column.type === 'date') {
      return dateStats(rows, column.id).distribution.map((item) => ({ name: item.bucket, value: item.count }));
    }
    if (column.type === 'number') {
      const values = rows
        .map((row) => row[column.id])
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      if (values.length === 0) return [];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const bins = 16;
      const width = (max - min) / bins || 1;
      const counts = Array.from({ length: bins }, () => 0);
      values.forEach((value) => {
        counts[Math.min(bins - 1, Math.floor((value - min) / width))] += 1;
      });
      return counts.map((count, index) => ({
        name: formatNumber(min + index * width, 1),
        value: count,
      }));
    }
    return categoricalStats(rows, column.id, 12).mostFrequent.map((item) => ({
      name: item.value.length > 14 ? `${item.value.slice(0, 13)}…` : item.value,
      value: item.count,
    }));
  }, [column, rows]);

  const typeCounts = dataset.columns.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});
  const missingTotal = dataset.columns.reduce((sum, item) => sum + item.missing, 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="label mb-1">Statistics engine</div>
          <h1 className="text-sm font-semibold text-[#e9edf3]">Dataset summary</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="label">Column</span>
          <Select className="w-56" value={columnId} onChange={(event) => setColumnId(event.target.value)}>
            {dataset.columns.map((item) => (
              <option key={item.id} value={item.id}>{item.name} · {typeLabel(item.type)}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Rows" value={rows.length.toLocaleString()} detail="Visible records" icon={<Activity size={14} />} accent />
        <StatTile label="Columns" value={dataset.columns.length} detail="All fields" icon={<Hash size={14} />} />
        <StatTile label="Missing values" value={missingTotal.toLocaleString()} detail="Across the dataset" icon={<Type size={14} />} />
        <StatTile label="Numeric fields" value={dataset.columns.filter((item) => item.type === 'number').length} detail="Statistical summaries" icon={<ChartNoAxesCombined size={14} />} />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto xl:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-3">
          <Panel title={`${column.name} distribution`} subtitle={`${typeLabel(column.type)} · ${rows.length} records`} icon={<ChartNoAxesCombined size={14} />}>
            <DistributionChart data={distribution} color={column.type === 'number' ? '#22d3ee' : '#8b7cf6'} />
          </Panel>

          <Panel title="Column details" subtitle="Locally calculated summary" icon={<Activity size={14} />}>
            {column.type === 'number' ? (
              (() => {
                const stats = numericStats(rows, column.id);
                return (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Metric label="Mean" value={formatNumber(stats.mean)} />
                    <Metric label="Median" value={formatNumber(stats.median)} />
                    <Metric label="Std dev" value={formatNumber(stats.stdDev)} />
                    <Metric label="Variance" value={formatNumber(stats.variance)} />
                    <Metric label="Min" value={formatNumber(stats.min)} />
                    <Metric label="Q1" value={formatNumber(stats.q1)} />
                    <Metric label="Q3" value={formatNumber(stats.q3)} />
                    <Metric label="Max" value={formatNumber(stats.max)} />
                    <Metric label="Range" value={formatNumber(stats.range)} />
                    <Metric label="IQR" value={formatNumber(stats.iqr)} />
                    <Metric label="Distinct" value={String(stats.distinct)} />
                    <Metric label="Missing" value={String(stats.missing)} />
                  </div>
                );
              })()
            ) : column.type === 'date' ? (
              (() => {
                const stats = dateStats(rows, column.id);
                return (
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Metric label="Earliest" value={stats.earliest ?? '—'} />
                    <Metric label="Latest" value={stats.latest ?? '—'} />
                    <Metric label="Range (days)" value={String(stats.days)} />
                    <Metric label="Missing" value={String(stats.missing)} />
                  </div>
                );
              })()
            ) : (
              (() => {
                const stats = categoricalStats(rows, column.id, 8);
                return (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Metric label="Distinct" value={String(stats.unique)} />
                      <Metric label="Populated" value={String(stats.count)} />
                      <Metric label="Missing" value={String(stats.missing)} />
                    </div>
                    <div className="space-y-1.5">
                      {stats.mostFrequent.map((item, index) => (
                        <div key={item.value} className="flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: categoryColor(index) }} />
                          <span className="w-28 truncate text-[10px] text-[#8a94a3]">{item.value}</span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded bg-white/[0.05]">
                            <span className="block h-full rounded bg-[var(--accent-cyan)]/60" style={{ width: `${item.ratio * 100}%` }} />
                          </span>
                          <span className="mono w-10 text-right text-[10px] text-[#dbe3ec]">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Column overview" subtitle="Types, completeness and distinct counts" icon={<Hash size={14} />}>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {summaries.map(({ column: item, kind, stats }) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setColumnId(item.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] transition-colors ${
                    item.id === column.id ? 'bg-[var(--accent-cyan)]/[0.08]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-[#b8c2cf]">{item.name}</span>
                  <Badge tone="neutral" className="mono">{typeLabel(item.type)}</Badge>
                  <span className="mono w-12 text-right text-[#6c7685]">
                    {kind === 'number' ? formatNumber(stats.mean, 1) : kind === 'date' ? (stats.earliest ?? '—').slice(0, 7) : stats.unique}
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Data type distribution" subtitle="Fields by detected type" icon={<Type size={14} />}>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeCounts).map(([type, count], index) => (
                <span key={type} className="chip" style={{ borderColor: `${categoryColor(index)}44` }}>
                  <span className="h-2 w-2 rounded-sm" style={{ background: categoryColor(index) }} />
                  {type} · {count}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Data quality" subtitle="Missing values by column" icon={<ChartNoAxesCombined size={14} />}>
            <div className="space-y-1.5">
              {dataset.columns.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="w-24 truncate text-[10px] text-[#8a94a3]">{item.name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded bg-white/[0.05]">
                    <span
                      className="block h-full rounded bg-amber-400/60"
                      style={{ width: `${Math.min(100, (item.missing / Math.max(1, rows.length)) * 100)}%` }}
                    />
                  </span>
                  <span className="mono w-8 text-right text-[10px] text-[#6c7685]">{item.missing}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function StatisticsWorkspaceRoute() {
  const { dataset } = useVisibleRows();
  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<ChartNoAxesCombined size={20} />}
          title="No statistics to show"
          description="Load a dataset to calculate summaries, distributions and data-quality metrics."
        />
      </div>
    );
  }
  return <StatisticsWorkspace dataset={dataset} />;
}
