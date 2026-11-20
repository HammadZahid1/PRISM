import type { Dataset, UniverseConfig, UniverseMapping } from '@/types';
import type { Row } from '@/lib/data/stats';
import { categoryColor, intensityColor } from '@/lib/color';
import { normalizeRange } from '@/lib/math';

export const defaultUniverseConfig: UniverseConfig = {
  mode: 'scatter',
  mapping: { x: '', y: '', z: '', size: '', color: '', intensity: '' },
  pointSize: 1,
  opacity: 0.85,
  maxPoints: 4000,
  showGrid: true,
  showConnections: false,
  animate: true,
};

export interface UniverseParticle {
  position: [number, number, number];
  color: string;
  size: number;
  opacity: number;
  rowIndex: number;
  label: string;
  values: Record<string, string>;
}

export interface UniverseData {
  particles: UniverseParticle[];
  numericColumns: string[];
  categoryColumns: string[];
  resolvedMapping: UniverseMapping;
  usedFallback: boolean;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('rgb(', '').replace(')', '');
  if (clean.includes(',')) return clean.split(',').map((part) => Number(part.trim()) / 255) as [number, number, number];
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function universeColorVector(color: string): [number, number, number] {
  return hexToRgb(color);
}

function valuesFor(rows: Row[], columnId: string): number[] {
  return rows.map((row) => {
    const value = row[columnId];
    if (typeof value === 'number') return value;
    const number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  });
}

function normalized(values: number[], fallback: number[]): number[] {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length < 2) return fallback;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  return values.map((value, index) =>
    Number.isFinite(value) ? (max === min ? 0.5 : (value - min) / (max - min)) : fallback[index],
  );
}

export function autoUniverseMapping(dataset: Dataset): UniverseMapping {
  const numeric = dataset.columns.filter((column) => column.type === 'number').map((column) => column.id);
  const categorical = dataset.columns
    .filter((column) => column.type === 'string' || column.type === 'boolean')
    .map((column) => column.id);
  return {
    x: numeric[0] ?? '',
    y: numeric[1] ?? numeric[0] ?? '',
    z: numeric[2] ?? numeric[1] ?? numeric[0] ?? '',
    size: numeric[3] ?? numeric[0] ?? '',
    color: categorical[0] ?? '',
    intensity: numeric[4] ?? numeric[0] ?? '',
  };
}

export function buildUniverseData(dataset: Dataset, config: UniverseConfig, rows?: Row[]): UniverseData {
  const source = (rows ?? dataset.rows).slice(0, Math.max(100, config.maxPoints));
  const numericColumns = dataset.columns.filter((column) => column.type === 'number').map((column) => column.id);
  const categoryColumns = dataset.columns
    .filter((column) => column.type === 'string' || column.type === 'boolean')
    .map((column) => column.id);
  const auto = autoUniverseMapping(dataset);
  const mapping: UniverseMapping = {
    x: config.mapping.x || auto.x,
    y: config.mapping.y || auto.y,
    z: config.mapping.z || auto.z,
    size: config.mapping.size || auto.size,
    color: config.mapping.color || auto.color,
    intensity: config.mapping.intensity || auto.intensity,
  };
  const usedFallback = numericColumns.length < 3;

  const indexFallback = source.map((_, index) => source.length > 1 ? index / (source.length - 1) : 0.5);
  const xValues = mapping.x ? normalized(valuesFor(source, mapping.x), indexFallback) : indexFallback;
  const yValues = mapping.y ? normalized(valuesFor(source, mapping.y), indexFallback.map((v) => 1 - v)) : indexFallback;
  const zValues = mapping.z ? normalized(valuesFor(source, mapping.z), indexFallback) : indexFallback;
  const sizeValues = mapping.size ? normalized(valuesFor(source, mapping.size), xValues) : indexFallback;
  const intensityValues = mapping.intensity
    ? normalized(valuesFor(source, mapping.intensity), zValues)
    : zValues;

  const categories = mapping.color
    ? [...new Set(source.map((row) => String(row[mapping.color] ?? 'Unknown')))]
    : [];
  const categoryIndex = new Map(categories.map((value, index) => [value, index]));

  // Quantized bins give the density and cluster modes a local structural layout.
  const bins = new Map<string, { count: number; cx: number; cy: number; cz: number }>();
  source.forEach((_, index) => {
    const key = `${Math.round(xValues[index] * 8)}:${Math.round(yValues[index] * 8)}:${Math.round(zValues[index] * 8)}`;
    const bin = bins.get(key) ?? { count: 0, cx: 0, cy: 0, cz: 0 };
    bin.count += 1;
    bin.cx += xValues[index];
    bin.cy += yValues[index];
    bin.cz += zValues[index];
    bins.set(key, bin);
  });
  bins.forEach((bin) => {
    bin.cx /= bin.count;
    bin.cy /= bin.count;
    bin.cz /= bin.count;
  });

  const clusterCenters = new Map<string, [number, number, number]>();
  if (config.mode === 'cluster' && mapping.color) {
    categories.forEach((category) => {
      const indices = source
        .map((row, index) => (String(row[mapping.color] ?? 'Unknown') === category ? index : -1))
        .filter((index) => index >= 0);
      const count = Math.max(1, indices.length);
      clusterCenters.set(category, [
        indices.reduce((sum, index) => sum + xValues[index], 0) / count,
        indices.reduce((sum, index) => sum + yValues[index], 0) / count,
        indices.reduce((sum, index) => sum + zValues[index], 0) / count,
      ]);
    });
  }

  const particles = source.map((row, index) => {
    let x = xValues[index];
    let y = yValues[index];
    let z = zValues[index];

    if (config.mode === 'cluster' && mapping.color) {
      const center = clusterCenters.get(String(row[mapping.color] ?? 'Unknown')) ?? [0.5, 0.5, 0.5];
      x = center[0] + (x - center[0]) * 0.28;
      y = center[1] + (y - center[1]) * 0.28;
      z = center[2] + (z - center[2]) * 0.28;
    } else if (config.mode === 'density') {
      const key = `${Math.round(xValues[index] * 8)}:${Math.round(yValues[index] * 8)}:${Math.round(zValues[index] * 8)}`;
      const bin = bins.get(key);
      if (bin) {
        x = bin.cx * 0.8 + (x - bin.cx) * 0.2;
        y = bin.cy * 0.8 + Math.min(1, bin.count / 12) * 0.35 + (y - bin.cy) * 0.2;
        z = bin.cz * 0.8 + (z - bin.cz) * 0.2;
      }
    } else if (config.mode === 'radial' || config.mode === 'orbit') {
      const angle = config.mode === 'orbit' ? index * 2.399963 : xValues[index] * Math.PI * 2;
      const radius = 0.35 + xValues[index] * 3.6;
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
      y = (yValues[index] - 0.5) * 5 + zValues[index] * 1.5;
    }

    if (config.mode !== 'radial' && config.mode !== 'orbit') {
      x = (x - 0.5) * 11;
      y = (y - 0.5) * 8;
      z = (z - 0.5) * 11;
    }

    const categoryValue = mapping.color ? String(row[mapping.color] ?? 'Unknown') : 'series';
    const color =
      mapping.color && categoryColumns.includes(mapping.color)
        ? categoryColor(categoryIndex.get(categoryValue) ?? 0)
        : intensityColor(intensityValues[index]);

    return {
      position: [x, y, z] as [number, number, number],
      color,
      size: 0.05 + sizeValues[index] * 0.16,
      opacity: 0.35 + intensityValues[index] * 0.6,
      rowIndex: index,
      label: categoryValue,
      values: Object.fromEntries(
        dataset.columns.map((column) => [column.name, row[column.id] === null ? '—' : String(row[column.id])]),
      ),
    };
  });

  return { particles, numericColumns, categoryColumns, resolvedMapping: mapping, usedFallback };
}

export function densityScale(values: number[]): number[] {
  return normalizeRange(values);
}
