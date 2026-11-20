import { useMemo, type ReactElement } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { ChartConfig, Dataset, SelectedDatum } from '@/types';
import { prepareChartData } from '@/lib/viz/prepare';
import { validateConfig } from '@/lib/viz/config';
import { categoryColor, heatColor } from '@/lib/color';
import { formatNumber } from '@/lib/utils';
import { Notice } from '@/components/ui/Feedback';
import type { Row } from '@/lib/data/stats';

interface TooltipPayload {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-white/[0.12] bg-[#14171c]/95 px-2.5 py-2 text-[10px] shadow-xl backdrop-blur">
      {label !== undefined && <div className="mono mb-1 text-[#8a94a3]">{label}</div>}
      {payload.slice(0, 8).map((item, index) => (
        <div key={index} className="flex items-center gap-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color ?? '#22d3ee' }} />
          <span className="text-[#8a94a3]">{item.name ?? 'value'}</span>
          <span className="mono ml-auto text-[#e9edf3]">{formatNumber(Number(item.value))}</span>
        </div>
      ))}
    </div>
  );
}

const axisStyle = { fill: '#6c7685', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' };

function TreemapCell(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  depth?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name = '', value = 0, depth = 1 } = props;
  if (width < 3 || height < 3) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`rgba(34, 211, 238, ${0.1 + Math.min(0.35, depth * 0.08)})`}
        stroke="#0b0d10"
        strokeWidth={2}
      />
      {width > 50 && height > 28 && (
        <>
          <text x={x + 8} y={y + 18} fill="#dbe3ec" fontSize={10} fontWeight={600}>
            {name.length > 18 ? `${name.slice(0, 17)}…` : name}
          </text>
          <text x={x + 8} y={y + 34} fill="#7d8798" fontSize={9} fontFamily="monospace">
            {formatNumber(value, 0)}
          </text>
        </>
      )}
    </g>
  );
}

function CustomBoxPlot({ points, onSelect }: { points: Record<string, unknown>[]; onSelect?: (datum: SelectedDatum, chartId: string) => void }) {
  const width = 760;
  const height = 360;
  const padding = { left: 58, right: 25, top: 22, bottom: 48 };
  const values = points.flatMap((point) => [
    Number(point.low), Number(point.q1), Number(point.median), Number(point.q3), Number(point.high),
    ...((point.outliers as number[]) ?? []),
  ]).filter(Number.isFinite);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = max - min || 1;
  const scaleY = (value: number) =>
    padding.top + (1 - (value - min) / span) * (height - padding.top - padding.bottom);
  const slot = (width - padding.left - padding.right) / Math.max(1, points.length);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Box plot">
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = padding.top + fraction * (height - padding.top - padding.bottom);
        const value = max - fraction * span;
        return (
          <g key={fraction}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="#6c7685" fontSize={9} fontFamily="monospace">
              {formatNumber(value, 1)}
            </text>
          </g>
        );
      })}
      {points.map((point, index) => {
        const center = padding.left + slot * (index + 0.5);
        const boxWidth = Math.min(46, slot * 0.55);
        const q1 = Number(point.q1);
        const q3 = Number(point.q3);
        const median = Number(point.median);
        const low = Number(point.low);
        const high = Number(point.high);
        return (
          <g
            key={String(point.name)}
            className="cursor-pointer"
            onClick={() =>
              onSelect?.(
                {
                  chartId: 'boxplot',
                  label: String(point.name),
                  value: median,
                  series: 'median',
                },
                'boxplot',
              )
            }
          >
            <line x1={center} x2={center} y1={scaleY(high)} y2={scaleY(low)} stroke="#4b93a5" strokeWidth={1} />
            <line x1={center - boxWidth / 2} x2={center + boxWidth / 2} y1={scaleY(high)} y2={scaleY(high)} stroke="#4b93a5" />
            <line x1={center - boxWidth / 2} x2={center + boxWidth / 2} y1={scaleY(low)} y2={scaleY(low)} stroke="#4b93a5" />
            <rect
              x={center - boxWidth / 2}
              y={scaleY(q3)}
              width={boxWidth}
              height={Math.max(2, scaleY(q1) - scaleY(q3))}
              fill="rgba(34,211,238,0.18)"
              stroke="#22d3ee"
              strokeWidth={1}
            />
            <line x1={center - boxWidth / 2} x2={center + boxWidth / 2} y1={scaleY(median)} y2={scaleY(median)} stroke="#a5d8ff" strokeWidth={2} />
            {((point.outliers as number[]) ?? []).map((outlier, outlierIndex) => (
              <circle key={outlierIndex} cx={center} cy={scaleY(outlier)} r={2.2} fill="#8b7cf6" opacity={0.75} />
            ))}
            <text x={center} y={height - 22} textAnchor="middle" fill="#8a94a3" fontSize={9}>
              {String(point.name).slice(0, 12)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface ChartRendererProps {
  config: ChartConfig;
  dataset: Dataset;
  rows?: Row[];
  onSelect?: (datum: SelectedDatum) => void;
  compact?: boolean;
}

export function ChartRenderer({ config, dataset, rows, onSelect, compact = false }: ChartRendererProps) {
  const prepared = useMemo(() => prepareChartData(dataset, config, rows), [dataset, config, rows]);
  const validation = useMemo(() => validateConfig(dataset, config), [dataset, config]);

  const select = (label: string, value: number | string, series?: string, rowIndex?: number) => {
    onSelect?.({ chartId: config.id, label, value, series, rowIndex });
  };

  if (!validation.valid) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Notice tone="warning">{validation.errors[0]}</Notice>
      </div>
    );
  }

  if (prepared.points.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-[11px] text-[#6c7685]">
        No data points match this configuration.
      </div>
    );
  }

  const common = (
    <>
      {config.showGrid && <CartesianGrid stroke="rgba(255,255,255,0.055)" strokeDasharray="3 3" />}
      <Tooltip content={<ChartTooltip />} />
      {config.showLegend && prepared.series.length > 1 && (
        <Legend wrapperStyle={{ fontSize: 10, color: '#8a94a3' }} iconSize={8} />
      )}
    </>
  );

  let chart;

  if (['bar', 'line', 'area'].includes(config.type)) {
    const Chart = config.type === 'bar' ? BarChart : config.type === 'line' ? LineChart : AreaChart;
    chart = (
      <Chart data={prepared.points} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
        {common}
        <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={52} />
        {config.type === 'bar' &&
          prepared.series.map((series, index) => (
            <Bar
              key={series}
              dataKey={series}
              fill={categoryColor(index)}
              stackId={config.stacked ? 'stack' : undefined}
              radius={config.stacked ? 0 : [2, 2, 0, 0]}
              maxBarSize={38}
              onClick={(point) => select(String(point.name), Number(point[series]), series)}
              isAnimationActive={config.showTooltip}
            />
          ))}
        {config.type === 'line' &&
          prepared.series.map((series, index) => (
            <Line
              key={series}
              type={config.smooth ? 'monotone' : 'linear'}
              dataKey={series}
              stroke={categoryColor(index)}
              strokeWidth={1.8}
              dot={compact ? false : { r: 2.2, fill: '#0b0d10', strokeWidth: 1.5 }}
              activeDot={{ r: 4 }}
              onClick={(point: unknown) => {
                const datum = point as Record<string, unknown>;
                select(String(datum.name), Number(datum[series]), series);
              }}
              isAnimationActive={config.showTooltip}
            />
          ))}
        {config.type === 'area' &&
          prepared.series.map((series, index) => (
            <Area
              key={series}
              type={config.smooth ? 'monotone' : 'linear'}
              dataKey={series}
              stroke={categoryColor(index)}
              fill={categoryColor(index)}
              fillOpacity={0.18}
              stackId={config.stacked ? 'stack' : undefined}
              isAnimationActive={config.showTooltip}
            />
          ))}
      </Chart>
    );
  } else if (config.type === 'scatter' || config.type === 'bubble') {
    chart = (
      <ScatterChart margin={{ top: 12, right: 18, left: 0, bottom: 6 }}>
        {common}
        <XAxis type="number" dataKey="x" name={dataset.columns.find((column) => column.id === config.x)?.name ?? 'X'} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis type="number" dataKey="y" name={dataset.columns.find((column) => column.id === config.y)?.name ?? 'Y'} tick={axisStyle} axisLine={false} tickLine={false} width={52} />
        {config.type === 'bubble' && <ZAxis type="number" dataKey="size" range={[20, 320]} name="size" />}
        {prepared.series.map((series, index) => (
          <Scatter
            key={series}
            name={series}
            data={prepared.points.filter((point) => point.category === series)}
            fill={categoryColor(index)}
            fillOpacity={0.75}
            onClick={(point) =>
              select(String(point.label), Number(point.y), series, Number(point.rowIndex))
            }
            isAnimationActive={false}
          />
        ))}
      </ScatterChart>
    );
  } else if (config.type === 'pie' || config.type === 'donut') {
    chart = (
      <PieChart>
        <Tooltip content={<ChartTooltip />} />
        {config.showLegend && <Legend wrapperStyle={{ fontSize: 10, color: '#8a94a3' }} iconSize={8} />}
        <Pie
          data={prepared.points}
          dataKey="value"
          nameKey="name"
          innerRadius={config.type === 'donut' ? '52%' : 0}
          outerRadius="75%"
          paddingAngle={2}
          onClick={(point) => select(String(point.name), Number(point.value))}
          isAnimationActive={config.showTooltip}
        >
          {prepared.points.map((point, index) => (
            <Cell key={String(point.name)} fill={categoryColor(index)} stroke="#0b0d10" />
          ))}
        </Pie>
        {config.type === 'donut' && (
          <text x="50%" y="48%" textAnchor="middle" fill="#e9edf3" fontSize={18} fontFamily="monospace">
            {formatNumber(prepared.numericValues.reduce((sum, value) => sum + value, 0), 0)}
          </text>
        )}
      </PieChart>
    );
  } else if (config.type === 'radar') {
    chart = (
      <RadarChart data={prepared.points} outerRadius="72%">
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#8a94a3', fontSize: 9 }} />
        <PolarRadiusAxis tick={{ fill: '#5c6675', fontSize: 8 }} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        {config.showLegend && <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />}
        {prepared.series.map((series, index) => (
          <Radar
            key={series}
            name={series}
            dataKey={series}
            stroke={categoryColor(index)}
            fill={categoryColor(index)}
            fillOpacity={0.16}
            onClick={(point: unknown) => {
              const datum = point as Record<string, unknown>;
              select(String(datum.subject), Number(datum[series]), series);
            }}
          />
        ))}
      </RadarChart>
    );
  } else if (config.type === 'histogram') {
    chart = (
      <BarChart data={prepared.points} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
        {common}
        <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
        <Bar
          dataKey="value"
          fill="#22d3ee"
          fillOpacity={0.7}
          onClick={(point) => select(String(point.label), Number(point.value))}
          isAnimationActive={config.showTooltip}
        />
      </BarChart>
    );
  } else if (config.type === 'boxplot') {
    chart = <CustomBoxPlot points={prepared.points} onSelect={(datum) => select(datum.label, datum.value, datum.series)} />;
  } else if (config.type === 'heatmap') {
    const values = prepared.numericValues.filter(Number.isFinite);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    chart = (
      <div className="flex h-full flex-col gap-2 overflow-auto p-2">
        <div className="flex gap-1 text-[9px] text-[#6c7685]">
          <span>low</span>
          <span className="h-2 w-24 rounded" style={{ background: 'linear-gradient(90deg, rgb(12,18,28), rgb(46,193,238))' }} />
          <span>high</span>
        </div>
        <div className="flex-1 overflow-auto">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `90px repeat(${Math.max(1, prepared.series.length)}, minmax(46px, 1fr))` }}
          >
            <div />
            {prepared.series.map((series) => (
              <div key={series} className="truncate text-center text-[8px] text-[#6c7685]" title={series}>
                {series.slice(0, 9)}
              </div>
            ))}
            {prepared.categories.map((category) => (
              <div key={category} className="contents">
                <div className="truncate pr-1 text-right text-[9px] text-[#8a94a3]" title={category}>{category}</div>
                {prepared.series.map((series) => {
                  const point = prepared.points.find((item) => item.row === category && item.column === series);
                  const value = Number(point?.value ?? 0);
                  const intensity = max === min ? 0.5 : (value - min) / (max - min);
                  return (
                    <button
                      type="button"
                      key={series}
                      className="h-7 rounded-[3px] border border-white/[0.02] transition-transform hover:scale-105"
                      style={{ background: heatColor(intensity) }}
                      title={`${category} / ${series}: ${formatNumber(value)} (${point?.count ?? 0} rows)`}
                      onClick={() => select(`${category} / ${series}`, value)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (config.type === 'treemap') {
    chart = (
      <Treemap
        data={prepared.points.map((point) => ({ name: String(point.name), size: Number(point.value) }))}
        dataKey="size"
        stroke="#0b0d10"
        isAnimationActive={false}
        content={<TreemapCell />}
      />
    );
  }

  return (
    <div data-chart-id={config.id} className="h-full w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        {chart as ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
