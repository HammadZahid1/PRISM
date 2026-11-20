import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GitBranch, TrendingUp, TriangleAlert } from 'lucide-react';
import type { Dataset } from '@/types';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { EmptyState, Notice } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { Badge, Field, SegmentedControl, Select } from '@/components/ui/Primitives';
import { correlationMatrix, findOutliers, numericStats } from '@/lib/data/stats';
import { linearRegression, pearson } from '@/lib/math';
import { heatColor } from '@/lib/color';
import { formatNumber, toDisplay } from '@/lib/utils';

type Tab = 'correlation' | 'trends' | 'outliers' | 'missing';

export function PatternExplorer({ dataset }: { dataset: Dataset }) {
  const { rows } = useVisibleRows();
  const numeric = dataset.columns.filter((column) => column.type === 'number');
  const [tab, setTab] = useState<Tab>('correlation');
  const [columnId, setColumnId] = useState(numeric[0]?.id ?? '');
  const [xId, setXId] = useState(numeric[0]?.id ?? '');
  const [yId, setYId] = useState(numeric[1]?.id ?? numeric[0]?.id ?? '');
  const [factor, setFactor] = useState(1.5);

  const matrix = useMemo(() => correlationMatrix(rows, dataset.columns), [rows, dataset.columns]);
  const outliers = useMemo(
    () => (columnId ? findOutliers(rows, columnId, factor) : []),
    [rows, columnId, factor],
  );
  const trendPoints = useMemo(() => {
    if (!xId || !yId) return [];
    return rows
      .map((row) => ({ x: Number(row[xId]), y: Number(row[yId]) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  }, [rows, xId, yId]);
  const regression = useMemo(
    () => linearRegression(trendPoints.map((point) => point.x), trendPoints.map((point) => point.y)),
    [trendPoints],
  );
  const correlation = useMemo(
    () => pearson(trendPoints.map((point) => point.x), trendPoints.map((point) => point.y)),
    [trendPoints],
  );

  if (numeric.length < 2) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<GitBranch size={20} />}
          title="Not enough numeric fields"
          description="Pattern analysis needs at least two numeric columns. Add a calculated column in the transformation studio or load another dataset."
        />
      </div>
    );
  }

  const numericOptions = numeric.map((column) => (
    <option key={column.id} value={column.id}>{column.name}</option>
  ));

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="label mb-1">Pattern explorer</div>
          <h1 className="text-sm font-semibold text-[#e9edf3]">Relationships and distributions</h1>
          <p className="mt-0.5 text-[10px] text-[#6c7685]">All results are calculated locally from the visible rows.</p>
        </div>
        <SegmentedControl
          value={tab}
          options={[
            { value: 'correlation', label: 'Correlation' },
            { value: 'trends', label: 'Trends' },
            { value: 'outliers', label: 'Outliers' },
            { value: 'missing', label: 'Missing' },
          ]}
          onChange={setTab}
        />
      </div>

      {tab === 'correlation' && (
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto xl:grid-cols-[1.4fr_1fr]">
          <Panel title="Pearson correlation matrix" subtitle={`${matrix.ids.length} numeric fields`} icon={<GitBranch size={14} />}>
            {matrix.ids.length < 2 ? (
              <Notice tone="warning">At least two numeric fields are required.</Notice>
            ) : (
              <div className="overflow-auto">
                <div
                  className="grid gap-[3px]"
                  style={{ gridTemplateColumns: `110px repeat(${matrix.ids.length}, minmax(54px, 1fr))` }}
                >
                  <div />
                  {matrix.ids.map((id) => (
                    <div key={id} className="truncate text-center text-[9px] text-[#8a94a3]" title={id}>{id.slice(0, 9)}</div>
                  ))}
                  {matrix.ids.map((rowId, rowIndex) => (
                    <div key={rowId} className="contents">
                      <div className="truncate py-2 pr-2 text-right text-[9px] text-[#8a94a3]">{rowId}</div>
                      {matrix.ids.map((columnId, columnIndex) => {
                        const value = matrix.values[rowIndex]?.[columnIndex] ?? 0;
                        return (
                          <div
                            key={columnId}
                            className="mono flex h-10 items-center justify-center rounded text-[9px] text-white/80"
                            style={{ background: heatColor((value + 1) / 2) }}
                            title={`${rowId} × ${columnId}: ${value.toFixed(3)}`}
                          >
                            {value.toFixed(2)}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>
          <Panel title="How to read this" subtitle="Matrix notes" icon={<GitBranch size={14} />}>
            <div className="space-y-2 text-[11px] leading-relaxed text-[#8a94a3]">
              <p>Values range from −1 (inverse relationship) to +1 (direct relationship). Zero indicates no linear relationship detected in the visible rows.</p>
              <p>Correlation does not imply causation. Fields are compared pairwise using locally calculated Pearson coefficients.</p>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-[9px] text-[#6c7685]">−1</span>
                <span className="h-2 flex-1 rounded" style={{ background: 'linear-gradient(90deg, rgb(12,18,28), rgb(28,90,120), rgb(46,193,238))' }} />
                <span className="text-[9px] text-[#6c7685]">+1</span>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'trends' && (
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto xl:grid-cols-[1fr_260px]">
          <Panel title="Numeric relationship" subtitle="Scatter and least-squares trend" icon={<TrendingUp size={14} />}>
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" tick={{ fill: '#6c7685', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="y" tick={{ fill: '#6c7685', fontSize: 9 }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#14171c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }} />
                  <Scatter data={trendPoints} fill="#22d3ee" fillOpacity={0.55} isAnimationActive={false} />
                  {Number.isFinite(regression.slope) && trendPoints.length > 1 && (
                    <ReferenceLine
                      segment={[
                        { x: Math.min(...trendPoints.map((point) => point.x)), y: regression.slope * Math.min(...trendPoints.map((point) => point.x)) + regression.intercept },
                        { x: Math.max(...trendPoints.map((point) => point.x)), y: regression.slope * Math.max(...trendPoints.map((point) => point.x)) + regression.intercept },
                      ]}
                      stroke="#8b7cf6"
                      strokeWidth={2}
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="Trend settings" icon={<TrendingUp size={14} />}>
            <div className="space-y-3">
              <Field label="X field"><Select value={xId} onChange={(event) => setXId(event.target.value)}>{numericOptions}</Select></Field>
              <Field label="Y field"><Select value={yId} onChange={(event) => setYId(event.target.value)}>{numericOptions}</Select></Field>
              <div className="grid grid-cols-2 gap-2">
                <Badge tone="accent">r = {formatNumber(correlation, 3)}</Badge>
                <Badge>r² = {formatNumber(regression.r2, 3)}</Badge>
              </div>
              <div className="mono rounded-md border border-white/[0.06] bg-white/[0.02] p-2 text-[10px] text-[#8a94a3]">
                y = {formatNumber(regression.slope, 3)}x {regression.intercept >= 0 ? '+' : '−'} {formatNumber(Math.abs(regression.intercept), 3)}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'outliers' && (
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto xl:grid-cols-[1fr_240px]">
          <Panel title="IQR outlier candidates" subtitle="Statistical candidates, not confirmed anomalies" icon={<TriangleAlert size={14} />} flush>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full border-collapse text-left text-[10px]">
                <thead className="sticky top-0 bg-[#14171c] text-[#8a94a3]">
                  <tr><th className="px-3 py-2 font-medium">Row</th><th className="px-3 py-2 font-medium">Field</th><th className="px-3 py-2 font-medium">Value</th><th className="px-3 py-2 font-medium">Bound</th><th className="px-3 py-2 font-medium">Side</th></tr>
                </thead>
                <tbody>
                  {outliers.slice(0, 300).map((outlier, index) => (
                    <tr key={index} className="border-t border-white/[0.04] text-[#a2acba]">
                      <td className="mono px-3 py-1.5">{outlier.rowIndex + 1}</td>
                      <td className="px-3 py-1.5">{dataset.columns.find((column) => column.id === outlier.columnId)?.name}</td>
                      <td className="mono px-3 py-1.5 text-amber-300">{formatNumber(outlier.value)}</td>
                      <td className="mono px-3 py-1.5 text-[#6c7685]">{formatNumber(outlier.bound)}</td>
                      <td className="px-3 py-1.5"><Badge tone={outlier.side === 'high' ? 'warning' : 'neutral'}>{outlier.side}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {outliers.length === 0 && <p className="p-5 text-center text-[10px] text-[#6c7685]">No IQR outliers for this field and factor.</p>}
            </div>
          </Panel>
          <Panel title="Outlier settings" icon={<TriangleAlert size={14} />}>
            <div className="space-y-3">
              <Field label="Numeric field"><Select value={columnId} onChange={(event) => setColumnId(event.target.value)}>{numericOptions}</Select></Field>
              <Field label={`IQR factor · ${factor.toFixed(1)}`}>
                <input type="range" min={0.5} max={4} step={0.1} value={factor} onChange={(event) => setFactor(Number(event.target.value))} className="w-full" />
              </Field>
              <div className="mono rounded border border-white/[0.06] p-2 text-[10px] text-[#8a94a3]">
                {outliers.length} candidate{outliers.length === 1 ? '' : 's'} found
              </div>
              <Notice tone="warning">Candidates are identified using Q1 − k·IQR and Q3 + k·IQR. They may be valid extreme values.</Notice>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'missing' && (
        <Panel title="Missing data analysis" subtitle="Completeness by column" icon={<GitBranch size={14} />}>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataset.columns.map((column) => ({ name: column.name.slice(0, 14), value: column.missing }))}
                margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#6c7685', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6c7685', fontSize: 9 }} axisLine={false} tickLine={false} width={42} />
                <Tooltip contentStyle={{ background: '#14171c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }} />
                <Bar dataKey="value" fill="#fbbf24" fillOpacity={0.65} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-[#6c7685]">
            Selection: {toDisplay(columnId ? numericStats(rows, columnId).missing : 0)} missing values in the selected numeric field.
          </p>
        </Panel>
      )}
    </div>
  );
}

export function PatternExplorerRoute() {
  const { dataset } = useVisibleRows();
  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon={<GitBranch size={20} />} title="No data to analyze" description="Load a dataset to explore correlations, outliers and missing values." />
      </div>
    );
  }
  return <PatternExplorer dataset={dataset} />;
}
