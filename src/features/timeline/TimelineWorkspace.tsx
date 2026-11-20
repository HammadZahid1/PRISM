import { useEffect, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock3, Pause, Play, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { Button } from '@/components/ui/Button';
import { Badge, Field, Select } from '@/components/ui/Primitives';
import { EmptyState, Notice } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { getPreset } from '@/lib/presets';
import { formatNumber } from '@/lib/utils';

export function TimelineWorkspace() {
  const { dataset, rows } = useVisibleRows();
  const timeline = useAppStore((state) => state.timeline);
  const setTimeline = useAppStore((state) => state.setTimeline);
  const addDataset = useAppStore((state) => state.addDataset);
  const setModule = useAppStore((state) => state.setModule);

  const dateColumns = dataset?.columns.filter((column) => column.type === 'date') ?? [];
  const numericColumns = dataset?.columns.filter((column) => column.type === 'number') ?? [];

  useEffect(() => {
    if (!dataset || dateColumns.length === 0 || numericColumns.length === 0) return;
    if (timeline.dateColumn && dataset.columns.some((column) => column.id === timeline.dateColumn)) return;
    setTimeline({
      dateColumn: dateColumns[0].id,
      metricColumn: numericColumns[0].id,
      start: 0,
      end: Math.max(0, dateColumns[0].unique - 1),
      position: 0,
      playing: false,
    });
  }, [dataset, dateColumns, numericColumns, timeline.dateColumn, setTimeline]);

  const frames = useMemo(() => {
    if (!dataset || !timeline.dateColumn) return [];
    const values = rows
      .map((row) => ({ date: String(row[timeline.dateColumn] ?? ''), row }))
      .filter((item) => item.date && item.date !== '—');
    const grouped = new Map<string, typeof values>();
    values.forEach((item) => {
      if (!grouped.has(item.date)) grouped.set(item.date, []);
      grouped.get(item.date)!.push(item);
    });
    return [...grouped.entries()]
      .sort(([a], [b]) => Date.parse(a) - Date.parse(b))
      .map(([date, items]) => ({ date, items }));
  }, [rows, timeline.dateColumn, dataset]);

  const end = Math.max(0, frames.length - 1);
  useEffect(() => {
    if (end !== timeline.end && frames.length > 0) setTimeline({ end, position: Math.min(timeline.position, end) });
  }, [end, timeline.end, frames.length, timeline.position, setTimeline]);

  useEffect(() => {
    if (!timeline.playing || frames.length === 0) return;
    const timer = window.setInterval(() => {
      const current = useAppStore.getState().timeline;
      if (current.position >= current.end) {
        useAppStore.getState().setTimeline({ playing: false });
      } else {
        useAppStore.getState().setTimeline({ position: current.position + 1 });
      }
    }, Math.max(80, 700 / timeline.speed));
    return () => window.clearInterval(timer);
  }, [timeline.playing, timeline.speed, frames.length]);

  const chartData = useMemo(() => {
    if (!timeline.metricColumn) return [];
    return frames.slice(0, timeline.position + 1).map((frame) => {
      const values = frame.items
        .map((item) => Number(item.row[timeline.metricColumn]))
        .filter((value) => Number.isFinite(value));
      return {
        date: frame.date.slice(0, 10),
        value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
        count: values.length,
      };
    });
  }, [frames, timeline.position, timeline.metricColumn]);

  const currentFrame = frames[Math.min(timeline.position, end)];
  const currentValues = currentFrame
    ? currentFrame.items
        .map((item) => Number(item.row[timeline.metricColumn]))
        .filter((value) => Number.isFinite(value))
    : [];

  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<Clock3 size={20} />}
          title="No timeline data"
          description="Load a dataset with a date column to animate values over time."
          action={<Button variant="primary" onClick={() => setModule('presets')}>Browse sample datasets</Button>}
        />
      </div>
    );
  }

  if (dateColumns.length === 0 || numericColumns.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-lg">
          <EmptyState
            icon={<Clock3 size={20} />}
            title="No suitable date column"
            description="This dataset has no detected date column or numeric variable. Use a sample dataset to explore the timeline module."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  addDataset(getPreset('Climate Explorer'));
                  setTimeline({ dateColumn: '', metricColumn: '', position: 0, end: 0, playing: false });
                }}
              >
                Load Climate Explorer sample
              </Button>
            }
          />
          <div className="mt-3"><Notice tone="info">The sample dataset is clearly labeled as simulated data.</Notice></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="label mb-1">Data timeline</div>
          <h1 className="text-sm font-semibold text-[#e9edf3]">{dataset.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{frames.length} time steps</Badge>
          <Badge>{currentFrame?.date.slice(0, 10) ?? '—'}</Badge>
        </div>
      </div>

      <Panel title="Timeline controls" subtitle="Scrub, play and control playback speed" icon={<Clock3 size={14} />}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Date column" className="min-w-[180px] flex-1">
              <Select value={timeline.dateColumn} onChange={(event) => setTimeline({ dateColumn: event.target.value, position: 0, playing: false })}>
                {dateColumns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
              </Select>
            </Field>
            <Field label="Numeric variable" className="min-w-[180px] flex-1">
              <Select value={timeline.metricColumn} onChange={(event) => setTimeline({ metricColumn: event.target.value })}>
                {numericColumns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
              </Select>
            </Field>
            <Field label={`Speed · ${timeline.speed}×`} className="w-36">
              <input type="range" min={0.5} max={4} step={0.5} value={timeline.speed} onChange={(event) => setTimeline({ speed: Number(event.target.value) })} className="w-full" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              icon={timeline.playing ? <Pause size={13} /> : <Play size={13} />}
              onClick={() => setTimeline({ playing: !timeline.playing, position: timeline.position >= end ? 0 : timeline.position })}
            >
              {timeline.playing ? 'Pause' : 'Play'}
            </Button>
            <Button size="sm" icon={<RotateCcw size={12} />} onClick={() => setTimeline({ position: 0, playing: false })}>Reset</Button>
            <input
              type="range"
              min={timeline.start}
              max={end}
              value={Math.min(timeline.position, end)}
              onChange={(event) => setTimeline({ position: Number(event.target.value), playing: false })}
              className="min-w-[180px] flex-1"
              aria-label="Timeline position"
            />
            <span className="mono min-w-[96px] text-right text-[11px] text-[#8a94a3]">
              {Math.min(timeline.position, end) + 1} / {frames.length}
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Value progression" subtitle="Mean of the selected variable up to the current time step" icon={<Clock3 size={14} />}>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#6c7685', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6c7685', fontSize: 9 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip contentStyle={{ background: '#14171c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }} />
                <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#timelineFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Current time step" subtitle="Statistics for the visible frame" icon={<Clock3 size={14} />}>
          <div className="space-y-2">
            <div className="mono text-xl text-[var(--accent-cyan)]">{currentFrame?.date.slice(0, 10) ?? '—'}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-white/[0.06] p-2">
                <div className="label">Records</div>
                <div className="mono mt-1 text-sm text-[#dbe3ec]">{currentFrame?.items.length ?? 0}</div>
              </div>
              <div className="rounded-md border border-white/[0.06] p-2">
                <div className="label">Mean</div>
                <div className="mono mt-1 text-sm text-[#dbe3ec]">
                  {currentValues.length ? formatNumber(currentValues.reduce((sum, value) => sum + value, 0) / currentValues.length) : '—'}
                </div>
              </div>
              <div className="rounded-md border border-white/[0.06] p-2">
                <div className="label">Min</div>
                <div className="mono mt-1 text-sm text-[#dbe3ec]">{currentValues.length ? formatNumber(Math.min(...currentValues)) : '—'}</div>
              </div>
              <div className="rounded-md border border-white/[0.06] p-2">
                <div className="label">Max</div>
                <div className="mono mt-1 text-sm text-[#dbe3ec]">{currentValues.length ? formatNumber(Math.max(...currentValues)) : '—'}</div>
              </div>
            </div>
            <Notice tone="info">Playback reads rows from the current filtered dataset state.</Notice>
          </div>
        </Panel>
      </div>
    </div>
  );
}
