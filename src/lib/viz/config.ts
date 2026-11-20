import type { ChartConfig, ChartType, Dataset } from '@/types';
import { uid } from '@/lib/utils';

export const CHART_TYPES: { type: ChartType; label: string; hint: string }[] = [
  { type: 'bar', label: 'Bar', hint: 'Categorical comparison' },
  { type: 'line', label: 'Line', hint: 'Trends over an ordered axis' },
  { type: 'area', label: 'Area', hint: 'Cumulative magnitude' },
  { type: 'scatter', label: 'Scatter', hint: 'Relationship between variables' },
  { type: 'bubble', label: 'Bubble', hint: 'Three numeric dimensions' },
  { type: 'pie', label: 'Pie', hint: 'Part-to-whole' },
  { type: 'donut', label: 'Donut', hint: 'Part-to-whole with center metric' },
  { type: 'radar', label: 'Radar', hint: 'Multi-variable profile' },
  { type: 'histogram', label: 'Histogram', hint: 'Numeric distribution' },
  { type: 'boxplot', label: 'Box plot', hint: 'Quartiles and outliers' },
  { type: 'heatmap', label: 'Heatmap', hint: 'Matrix intensity' },
  { type: 'treemap', label: 'Treemap', hint: 'Hierarchical proportion' },
];

export const chartLabel = (type: ChartType): string =>
  CHART_TYPES.find((item) => item.type === type)?.label ?? type;

export function baseConfig(datasetId: string, type: ChartType = 'bar'): ChartConfig {
  return {
    id: uid('chart'),
    type,
    title: `${chartLabel(type)} chart`,
    datasetId,
    x: '',
    y: '',
    category: '',
    size: '',
    color: '',
    aggregation: 'none',
    bins: 12,
    orientation: 'vertical',
    stacked: false,
    smooth: false,
    showLegend: true,
    showGrid: true,
    showLabels: false,
    showTooltip: true,
    limit: 24,
  };
}

export function firstNumeric(dataset: Dataset): string {
  return dataset.columns.find((column) => column.type === 'number')?.id ?? '';
}

export function firstCategorical(dataset: Dataset): string {
  return dataset.columns.find((column) => column.type === 'string' || column.type === 'boolean')?.id ?? '';
}

export function firstDate(dataset: Dataset): string {
  return dataset.columns.find((column) => column.type === 'date')?.id ?? '';
}

export function autoConfig(dataset: Dataset, type: ChartType = 'bar'): ChartConfig {
  const config = baseConfig(dataset.id, type);
  const numeric = firstNumeric(dataset);
  const category = firstCategorical(dataset);
  const date = firstDate(dataset);
  const numericColumns = dataset.columns.filter((column) => column.type === 'number');

  config.x = category || date || dataset.columns[0]?.id || '';
  config.y = numeric;
  config.category = category;
  config.size = numericColumns[1]?.id ?? numeric;
  config.color = category;

  switch (type) {
    case 'bar':
    case 'area':
      config.aggregation = 'sum';
      break;
    case 'line':
      config.x = date || category || config.x;
      config.smooth = true;
      break;
    case 'scatter':
      config.x = numericColumns[0]?.id ?? config.x;
      config.y = numericColumns[1]?.id ?? numericColumns[0]?.id ?? '';
      config.aggregation = 'none';
      break;
    case 'bubble':
      config.x = numericColumns[0]?.id ?? config.x;
      config.y = numericColumns[1]?.id ?? numeric;
      config.size = numericColumns[2]?.id ?? numericColumns[0]?.id ?? numeric;
      config.aggregation = 'none';
      break;
    case 'pie':
    case 'donut':
    case 'treemap':
      config.x = category || config.x;
      config.aggregation = 'sum';
      break;
    case 'radar':
      config.x = category || config.x;
      config.aggregation = 'mean';
      break;
    case 'histogram':
      config.x = numeric;
      config.y = '';
      break;
    case 'boxplot':
      config.y = numeric;
      break;
    case 'heatmap': {
      const categories = dataset.columns.filter((column) => column.type === 'string' || column.type === 'boolean');
      config.x = categories[0]?.id ?? config.x;
      config.category = categories[1]?.id ?? categories[0]?.id ?? config.x;
      config.y = numeric;
      config.aggregation = 'mean';
      break;
    }
    default:
      break;
  }
  config.title = `${chartLabel(type)} · ${dataset.name}`;
  return config;
}

export interface ConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfig(dataset: Dataset, config: ChartConfig): ConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set(dataset.columns.map((column) => column.id));
  const numericIds = new Set(dataset.columns.filter((column) => column.type === 'number').map((column) => column.id));

  if (dataset.rows.length === 0) errors.push('The dataset has no rows to visualize.');
  if (config.x && !ids.has(config.x)) errors.push('The X field is not present in this dataset.');
  if (config.y && !ids.has(config.y)) errors.push('The Y field is not present in this dataset.');
  if (config.category && !ids.has(config.category)) warnings.push('The category field is not present and will be ignored.');
  if (config.size && !ids.has(config.size)) warnings.push('The size field is not present and will be ignored.');

  const needsY = ['bar', 'line', 'area', 'scatter', 'bubble', 'radar', 'boxplot', 'heatmap'].includes(config.type);
  const needsX = !['boxplot', 'histogram'].includes(config.type);
  if (needsY && !config.y) errors.push('Choose a numeric value field for this chart.');
  if (needsX && !config.x) errors.push('Choose an X axis field for this chart.');
  if (config.y && !numericIds.has(config.y)) errors.push('The Y field must be numeric.');
  if (['scatter', 'bubble'].includes(config.type) && config.x && !numericIds.has(config.x)) {
    errors.push('Scatter and bubble charts require a numeric X field.');
  }
  if (config.type === 'histogram' && config.x && !numericIds.has(config.x)) {
    errors.push('Histograms require a numeric field.');
  }
  if (config.type === 'heatmap' && config.category === config.x) {
    warnings.push('Choose two different category fields for a richer heatmap.');
  }
  if (config.type === 'pie' && dataset.rows.length > 40) {
    warnings.push('Large category counts can make pie charts hard to read.');
  }
  if (config.type === 'bubble' && config.size === config.y) {
    warnings.push('Size and Y use the same field; choose another size field if available.');
  }

  return { valid: errors.length === 0, errors, warnings };
}
