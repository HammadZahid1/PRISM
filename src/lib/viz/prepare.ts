import type { Aggregation, ChartConfig, Dataset } from '@/types';
import type { Row } from '@/lib/data/stats';
import { quantile } from '@/lib/math';
import { toDisplay } from '@/lib/utils';

export interface PreparedChart {
  points: Record<string, unknown>[];
  series: string[];
  categories: string[];
  numericValues: number[];
  total: number;
}

function aggregate(values: number[], method: Aggregation): number {
  if (values.length === 0) return 0;
  if (method === 'count') return values.length;
  const sum = values.reduce((acc, value) => acc + value, 0);
  switch (method) {
    case 'sum':
      return sum;
    case 'mean':
      return sum / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return sum;
  }
}

function labelFor(value: unknown): string {
  return toDisplay(value);
}

function numeric(row: Row, id: string): number | null {
  const value = row[id];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function groupedSeries(
  rows: Row[],
  config: ChartConfig,
): PreparedChart {
  const groups = new Map<string, Map<string, number[]>>();
  const seriesSet = new Set<string>();
  const categoryId = config.category && config.category !== config.x ? config.category : '';
  rows.forEach((row) => {
    const key = labelFor(row[config.x]);
    if (!groups.has(key)) groups.set(key, new Map());
    const series = categoryId ? labelFor(row[categoryId]) : 'value';
    seriesSet.add(series);
    const group = groups.get(key)!;
    if (!group.has(series)) group.set(series, []);
    const value = numeric(row, config.y);
    if (value !== null) group.get(series)!.push(value);
  });
  const series = [...seriesSet].slice(0, 12);
  const points = [...groups.entries()]
    .slice(0, config.limit)
    .map(([name, values]) => {
      const point: Record<string, unknown> = { name };
      series.forEach((key) => {
        point[key] = aggregate(values.get(key) ?? [], config.aggregation);
      });
      return point;
    });
  const numericValues = points.flatMap((point) => series.map((key) => Number(point[key])));
  return { points, series, categories: [...groups.keys()], numericValues, total: points.length };
}

function distributionData(rows: Row[], config: ChartConfig): PreparedChart {
  const groups = new Map<string, number[]>();
  rows.forEach((row) => {
    const key = labelFor(row[config.x]);
    if (!groups.has(key)) groups.set(key, []);
    const value = numeric(row, config.y);
    if (value !== null) groups.get(key)!.push(value);
  });
  const points = [...groups.entries()]
    .map(([name, values]) => ({ name, value: Math.max(0, aggregate(values, config.aggregation)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, config.limit);
  return {
    points,
    series: ['value'],
    categories: points.map((point) => point.name),
    numericValues: points.map((point) => point.value),
    total: points.length,
  };
}

function scatterData(rows: Row[], config: ChartConfig): PreparedChart {
  const categories = config.category
    ? [...new Set(rows.map((row) => labelFor(row[config.category])))].slice(0, 12)
    : ['series'];
  const points: Record<string, unknown>[] = [];
  rows.slice(0, Math.max(200, config.limit * 20)).forEach((row, rowIndex) => {
    const x = numeric(row, config.x);
    const y = numeric(row, config.y);
    if (x === null || y === null) return;
    const size = config.size ? Math.abs(numeric(row, config.size) ?? 1) : 1;
    points.push({
      x,
      y,
      size: Math.max(0.2, Math.min(400, size)),
      category: config.category ? labelFor(row[config.category]) : 'series',
      label: labelFor(row[config.x]),
      rowIndex,
    });
  });
  return {
    points,
    series: categories,
    categories,
    numericValues: points.map((point) => Number(point.y)),
    total: points.length,
  };
}

function histogramData(rows: Row[], config: ChartConfig): PreparedChart {
  const values = rows.map((row) => numeric(row, config.x)).filter((value): value is number => value !== null);
  if (values.length === 0) return { points: [], series: ['count'], categories: [], numericValues: [], total: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bins = Math.max(2, Math.min(60, config.bins));
  const width = (max - min) / bins || 1;
  const counts = Array.from({ length: bins }, () => 0);
  values.forEach((value) => {
    const index = Math.min(bins - 1, Math.floor((value - min) / width));
    counts[index] += 1;
  });
  const points = counts.map((count, index) => ({
    name: `${Math.round((min + index * width) * 100) / 100}`,
    label: `${Math.round((min + index * width) * 100) / 100} – ${Math.round((min + (index + 1) * width) * 100) / 100}`,
    value: count,
    binStart: min + index * width,
    binEnd: min + (index + 1) * width,
  }));
  return { points, series: ['count'], categories: points.map((p) => p.name), numericValues: counts, total: values.length };
}

function boxData(rows: Row[], config: ChartConfig): PreparedChart {
  const categoryId = config.category || config.x;
  const grouped = new Map<string, number[]>();
  rows.forEach((row) => {
    const key = categoryId ? labelFor(row[categoryId]) : 'All';
    if (!grouped.has(key)) grouped.set(key, []);
    const value = numeric(row, config.y);
    if (value !== null) grouped.get(key)!.push(value);
  });
  const points = [...grouped.entries()].slice(0, config.limit).map(([name, values]) => {
    if (values.length === 0) {
      return { name, q1: 0, median: 0, q3: 0, low: 0, high: 0, outliers: [], count: 0 };
    }
    const q1 = quantile(values, 0.25);
    const median = quantile(values, 0.5);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    const low = Math.min(...values.filter((value) => value >= q1 - 1.5 * iqr));
    const high = Math.max(...values.filter((value) => value <= q3 + 1.5 * iqr));
    const outliers = values.filter((value) => value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr);
    return { name, q1, median, q3, low, high, outliers: outliers.slice(0, 30), count: values.length };
  });
  return {
    points,
    series: ['distribution'],
    categories: points.map((point) => point.name),
    numericValues: points.flatMap((point) => [point.q1, point.median, point.q3]),
    total: points.length,
  };
}

function heatmapData(rows: Row[], config: ChartConfig): PreparedChart {
  const cells = new Map<string, { sum: number; count: number }>();
  const rowCategories = new Set<string>();
  const columnCategories = new Set<string>();
  rows.slice(0, 5000).forEach((row) => {
    const rowKey = labelFor(row[config.x]);
    const columnKey = labelFor(row[config.category]);
    rowCategories.add(rowKey);
    columnCategories.add(columnKey);
    const key = `${rowKey}::${columnKey}`;
    const cell = cells.get(key) ?? { sum: 0, count: 0 };
    const value = numeric(row, config.y);
    if (value !== null) {
      cell.sum += value;
      cell.count += 1;
    }
    cells.set(key, cell);
  });
  const points = [...rowCategories].slice(0, 24).flatMap((rowKey) =>
    [...columnCategories].slice(0, 24).map((columnKey) => {
      const cell = cells.get(`${rowKey}::${columnKey}`);
      return {
        row: rowKey,
        column: columnKey,
        value: cell && cell.count > 0 ? cell.sum / cell.count : 0,
        count: cell?.count ?? 0,
      };
    }),
  );
  return {
    points,
    series: [...columnCategories].slice(0, 24),
    categories: [...rowCategories].slice(0, 24),
    numericValues: points.map((point) => Number(point.value)),
    total: points.length,
  };
}

function radarData(rows: Row[], config: ChartConfig, dataset: Dataset): PreparedChart {
  const numericColumns = dataset.columns.filter((column) => column.type === 'number').slice(0, 7);
  const groups = new Map<string, Row[]>();
  rows.forEach((row) => {
    const key = config.category ? labelFor(row[config.category]) : 'All';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  });
  const series = [...groups.keys()].slice(0, 6);
  const points = numericColumns.map((column) => {
    const point: Record<string, unknown> = { subject: column.name };
    series.forEach((key) => {
      const values = (groups.get(key) ?? [])
        .map((row) => numeric(row, column.id))
        .filter((value): value is number => value !== null);
      point[key] = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    });
    return point;
  });
  return {
    points,
    series,
    categories: numericColumns.map((column) => column.name),
    numericValues: points.flatMap((point) => series.map((key) => Number(point[key]))),
    total: points.length,
  };
}

export function prepareChartData(dataset: Dataset, config: ChartConfig, rows?: Row[]): PreparedChart {
  const data = rows ?? dataset.rows;
  switch (config.type) {
    case 'bar':
    case 'line':
    case 'area':
      return groupedSeries(data, config);
    case 'pie':
    case 'donut':
    case 'treemap':
      return distributionData(data, config);
    case 'scatter':
    case 'bubble':
      return scatterData(data, config);
    case 'histogram':
      return histogramData(data, config);
    case 'boxplot':
      return boxData(data, config);
    case 'heatmap':
      return heatmapData(data, config);
    case 'radar':
      return radarData(data, config, dataset);
    default:
      return { points: [], series: [], categories: [], numericValues: [], total: 0 };
  }
}
