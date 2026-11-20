import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { Aggregation, ChartConfig, ChartType, Dataset } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { Field, Select, SegmentedControl, TextInput, Toggle } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Feedback';
import { CHART_TYPES, autoConfig, validateConfig } from '@/lib/viz/config';
import { typeLabel } from '@/lib/data/types';

export function ChartConfigPanel({ config, dataset }: { config: ChartConfig; dataset: Dataset }) {
  const updateChart = useAppStore((state) => state.updateChart);
  const validation = validateConfig(dataset, config);
  const patch = (values: Partial<ChartConfig>) => updateChart(config.id, values);
  const columnOptions = dataset.columns.map((column) => ({ id: column.id, name: column.name, type: column.type }));
  const numericOptions = columnOptions.filter((column) => column.type === 'number');
  const categoryOptions = columnOptions.filter((column) => column.type !== 'number');

  const fieldSelect = (
    label: string,
    value: string,
    key: keyof ChartConfig,
    options = columnOptions,
    allowNone = true,
  ) => (
    <Field label={label}>
      <Select value={value} onChange={(event) => patch({ [key]: event.target.value } as Partial<ChartConfig>)}>
        {allowNone && <option value="">— none —</option>}
        {options.map((column) => (
          <option key={column.id} value={column.id}>
            {column.name} · {typeLabel(column.type)}
          </option>
        ))}
      </Select>
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[var(--accent-cyan)]" />
          <span className="text-xs font-semibold text-[#dbe3ec]">Chart configuration</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={<RotateCcw size={12} />}
          onClick={() => {
            const { id: _id, ...next } = autoConfig(dataset, config.type);
            patch(next);
          }}
        >
          Auto
        </Button>
      </div>

      {!validation.valid && (
        <Notice tone="error">
          {validation.errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </Notice>
      )}
      {validation.warnings.length > 0 && (
        <Notice tone="warning">
          {validation.warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </Notice>
      )}

      <Field label="Chart title">
        <TextInput value={config.title} onChange={(event) => patch({ title: event.target.value })} />
      </Field>

      <Field label="Visualization type">
        <div className="grid grid-cols-3 gap-1.5">
          {CHART_TYPES.map((item) => (
            <button
              type="button"
              key={item.type}
              title={item.hint}
              onClick={() => {
                const { id: _id, ...next } = autoConfig(dataset, item.type as ChartType);
                patch({ ...next, type: item.type });
              }}
              className={`rounded-md border px-2 py-1.5 text-[10px] transition-colors ${
                config.type === item.type
                  ? 'border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
                  : 'border-white/[0.07] bg-white/[0.02] text-[#8a94a3] hover:border-white/[0.15] hover:text-[#e9edf3]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="space-y-2 border-t border-white/[0.06] pt-3">
        <div className="label">Field mappings</div>
        {!['boxplot', 'histogram'].includes(config.type) && fieldSelect('X axis', config.x, 'x')}
        {!['histogram', 'pie', 'donut', 'treemap'].includes(config.type) && fieldSelect('Y value', config.y, 'y', numericOptions)}
        {config.type === 'histogram' && fieldSelect('Numeric field', config.x, 'x', numericOptions, false)}
        {['pie', 'donut', 'treemap'].includes(config.type) && fieldSelect('Category', config.x, 'x', categoryOptions)}
        {['scatter', 'bubble', 'boxplot', 'heatmap', 'radar'].includes(config.type) &&
          fieldSelect('Group / category', config.category, 'category', categoryOptions)}
        {config.type === 'bubble' && fieldSelect('Bubble size', config.size, 'size', numericOptions)}
        {config.type === 'heatmap' && fieldSelect('Matrix column', config.category, 'category', categoryOptions)}
        {config.type === 'radar' && fieldSelect('Comparison series', config.category, 'category', categoryOptions)}
      </div>

      <div className="space-y-2 border-t border-white/[0.06] pt-3">
        <div className="label">Behavior</div>
        <Field label="Aggregation">
          <Select
            value={config.aggregation}
            onChange={(event) => patch({ aggregation: event.target.value as Aggregation })}
          >
            {(['none', 'sum', 'mean', 'count', 'min', 'max'] as Aggregation[]).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </Field>
        {config.type === 'bar' && (
          <>
            <Field label="Orientation">
              <SegmentedControl
                value={config.orientation}
                options={[
                  { value: 'vertical', label: 'Vertical' },
                  { value: 'horizontal', label: 'Horizontal' },
                ]}
                onChange={(orientation) => patch({ orientation })}
              />
            </Field>
            <Toggle checked={config.stacked} onChange={(stacked) => patch({ stacked })} label="Stacked bars" />
          </>
        )}
        {['line', 'area'].includes(config.type) && (
          <Toggle checked={config.smooth} onChange={(smooth) => patch({ smooth })} label="Smooth curve" />
        )}
        {config.type === 'histogram' && (
          <Field label={`Bins · ${config.bins}`}>
            <input
              type="range"
              min={2}
              max={60}
              value={config.bins}
              onChange={(event) => patch({ bins: Number(event.target.value) })}
              className="w-full"
            />
          </Field>
        )}
        <Field label={`Category limit · ${config.limit}`}>
          <input
            type="range"
            min={5}
            max={200}
            value={config.limit}
            onChange={(event) => patch({ limit: Number(event.target.value) })}
            className="w-full"
          />
        </Field>
      </div>

      <div className="space-y-1 border-t border-white/[0.06] pt-3">
        <div className="label mb-1">Display</div>
        <Toggle checked={config.showGrid} onChange={(showGrid) => patch({ showGrid })} label="Grid lines" />
        <Toggle checked={config.showLegend} onChange={(showLegend) => patch({ showLegend })} label="Legend" />
        <Toggle checked={config.showTooltip} onChange={(showTooltip) => patch({ showTooltip })} label="Tooltips & animation" />
        <Toggle checked={config.showLabels} onChange={(showLabels) => patch({ showLabels })} label="Value labels" />
      </div>
    </div>
  );
}
