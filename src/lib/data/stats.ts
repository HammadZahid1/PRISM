import type { CellValue, DataColumn } from '@/types/data';
import { mean, median, pearson, quantile, stdDev, variance } from '@/lib/math';
import { isMissing } from './types';

export type Row = Record<string, CellValue>;

export interface NumericStats {
  count: number;
  missing: number;
  distinct: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  stdDev: number;
  variance: number;
  q1: number;
  q3: number;
  iqr: number;
  sum: number;
}

export interface CategoryStat {
  value: string;
  count: number;
  ratio: number;
}

export interface CategoricalStats {
  count: number;
  missing: number;
  unique: number;
  mostFrequent: CategoryStat[];
  distribution: CategoryStat[];
}

export interface DateStats {
  count: number;
  missing: number;
  earliest: string | null;
  latest: string | null;
  days: number;
  distribution: { bucket: string; count: number }[];
}

export function numericValues(rows: Row[], columnId: string): number[] {
  return rows
    .map((row) => row[columnId])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

export function numericStats(rows: Row[], columnId: string): NumericStats {
  const values = numericValues(rows, columnId);
  const missing = rows.filter((row) => isMissing(row[columnId])).length;
  const min = values.length ? Math.min(...values) : NaN;
  const max = values.length ? Math.max(...values) : NaN;
  const q1 = values.length ? quantile(values, 0.25) : NaN;
  const q3 = values.length ? quantile(values, 0.75) : NaN;
  return {
    count: values.length,
    missing,
    distinct: new Set(values).size,
    mean: mean(values),
    median: median(values),
    min,
    max,
    range: max - min,
    stdDev: stdDev(values, true),
    variance: variance(values, true),
    q1,
    q3,
    iqr: q3 - q1,
    sum: values.reduce((acc, value) => acc + value, 0),
  };
}

export function categoricalStats(rows: Row[], columnId: string, limit = 12): CategoricalStats {
  const counts = new Map<string, number>();
  let missing = 0;
  rows.forEach((row) => {
    const value = row[columnId];
    if (isMissing(value)) {
      missing += 1;
      return;
    }
    const key = String(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const total = Math.max(1, rows.length - missing);
  const distribution = [...counts.entries()]
    .map(([value, count]) => ({ value, count, ratio: count / total }))
    .sort((a, b) => b.count - a.count);
  return {
    count: rows.length - missing,
    missing,
    unique: counts.size,
    mostFrequent: distribution.slice(0, limit),
    distribution: distribution.slice(0, 40),
  };
}

export function dateStats(rows: Row[], columnId: string): DateStats {
  const dates = rows
    .map((row) => row[columnId])
    .filter((value) => !isMissing(value))
    .map((value) => String(value))
    .filter((value) => Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  const missing = rows.filter((row) => isMissing(row[columnId])).length;
  if (dates.length === 0) return { count: 0, missing, earliest: null, latest: null, days: 0, distribution: [] };
  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  const days = Math.round((Date.parse(latest) - Date.parse(earliest)) / 86400000);
  const buckets = new Map<string, number>();
  dates.forEach((date) => {
    const key = date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return {
    count: dates.length,
    missing,
    earliest,
    latest,
    days,
    distribution: [...buckets.entries()].map(([bucket, count]) => ({ bucket, count })),
  };
}

export function summarizeColumns(columns: DataColumn[], rows: Row[]) {
  return columns.map((column) => {
    if (column.type === 'number') {
      const stats = numericStats(rows, column.id);
      return { column, kind: 'number' as const, stats };
    }
    if (column.type === 'date') {
      const stats = dateStats(rows, column.id);
      return { column, kind: 'date' as const, stats };
    }
    const stats = categoricalStats(rows, column.id);
    return { column, kind: 'category' as const, stats };
  });
}

export type ColumnSummary = ReturnType<typeof summarizeColumns>[number];

export function correlationMatrix(rows: Row[], columns: DataColumn[]): { ids: string[]; values: number[][] } {
  const numeric = columns.filter((column) => column.type === 'number');
  const values = numeric.map((column) => numericValues(rows, column.id));
  const matrix = numeric.map((_, i) =>
    numeric.map((__, j) => (i === j ? 1 : pearson(values[i], values[j]))),
  );
  return { ids: numeric.map((column) => column.id), values: matrix };
}

export interface Outlier {
  rowIndex: number;
  columnId: string;
  value: number;
  bound: number;
  side: 'low' | 'high';
}

export function findOutliers(rows: Row[], columnId: string, factor = 1.5): Outlier[] {
  const stats = numericStats(rows, columnId);
  if (!Number.isFinite(stats.iqr)) return [];
  const lower = stats.q1 - factor * stats.iqr;
  const upper = stats.q3 + factor * stats.iqr;
  const outliers: Outlier[] = [];
  rows.forEach((row, rowIndex) => {
    const value = row[columnId];
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    if (value < lower) outliers.push({ rowIndex, columnId, value, bound: lower, side: 'low' });
    if (value > upper) outliers.push({ rowIndex, columnId, value, bound: upper, side: 'high' });
  });
  return outliers;
}
