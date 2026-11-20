import type { ChartConfig, Dataset, Settings } from '@/types';
import { CHART_TYPES, baseConfig } from '@/lib/viz/config';
import { downloadBlob } from '@/lib/utils';

export interface WorkspaceBackup {
  version: 1;
  exportedAt: number;
  app: 'PRISM';
  settings?: Settings;
  datasets: Dataset[];
  charts: ChartConfig[];
}

const CHART_TYPE_IDS = new Set(CHART_TYPES.map((item) => item.type));
const COLUMN_TYPES = new Set(['number', 'string', 'date', 'boolean']);
const AGGREGATIONS = new Set(['none', 'sum', 'mean', 'count', 'min', 'max']);

export function createWorkspaceBackup(
  datasets: Dataset[],
  charts: ChartConfig[],
  settings?: Settings,
): WorkspaceBackup {
  return {
    version: 1,
    app: 'PRISM',
    exportedAt: Date.now(),
    settings,
    datasets,
    charts,
  };
}

export function serializeWorkspaceBackup(backup: WorkspaceBackup): string {
  return JSON.stringify(backup, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDataset(value: unknown): value is Dataset {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false;
  if (!Array.isArray(value.columns) || !Array.isArray(value.rows)) return false;
  return value.columns.every(
    (column) =>
      isRecord(column) &&
      typeof column.id === 'string' &&
      typeof column.name === 'string' &&
      typeof column.type === 'string' &&
      COLUMN_TYPES.has(column.type),
  );
}

function isChart(value: unknown): value is ChartConfig {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.datasetId === 'string' &&
    typeof value.type === 'string' &&
    CHART_TYPE_IDS.has(value.type as ChartConfig['type'])
  );
}

function normalizeChart(value: Record<string, unknown>): ChartConfig {
  const config = baseConfig(value.datasetId as string, value.type as ChartConfig['type']);
  config.id = value.id as string;
  config.title = value.title as string;
  const text = (key: keyof ChartConfig): string => (typeof value[key] === 'string' ? (value[key] as string) : '');
  config.x = text('x');
  config.y = text('y');
  config.category = text('category');
  config.size = text('size');
  config.color = text('color');
  const aggregation = value.aggregation;
  if (typeof aggregation === 'string' && AGGREGATIONS.has(aggregation)) {
    config.aggregation = aggregation as ChartConfig['aggregation'];
  }
  const numeric = (key: keyof ChartConfig, fallback: number): number =>
    typeof value[key] === 'number' && Number.isFinite(value[key]) ? (value[key] as number) : fallback;
  config.bins = numeric('bins', config.bins);
  config.limit = numeric('limit', config.limit);
  config.orientation = value.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  for (const key of ['stacked', 'smooth', 'showLegend', 'showGrid', 'showLabels', 'showTooltip'] as const) {
    if (typeof value[key] === 'boolean') config[key] = value[key];
  }
  return config;
}

export function parseWorkspaceBackup(text: string): WorkspaceBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('The backup file is not valid JSON.');
  }
  if (!isRecord(raw)) throw new Error('The backup file must contain a JSON object.');
  if (raw.app !== 'PRISM' || raw.version !== 1) throw new Error('This is not a PRISM v1 workspace backup.');
  if (!Array.isArray(raw.datasets) || !Array.isArray(raw.charts)) {
    throw new Error('The backup is missing datasets or charts.');
  }
  if (!raw.datasets.every(isDataset)) throw new Error('One or more datasets in the backup are invalid.');
  if (!raw.charts.every(isChart)) throw new Error('One or more charts in the backup are invalid.');
  const settings = isRecord(raw.settings) ? (raw.settings as unknown as Settings) : undefined;
  return {
    version: 1,
    app: 'PRISM',
    exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : Date.now(),
    settings,
    datasets: raw.datasets as Dataset[],
    charts: (raw.charts as unknown as Record<string, unknown>[]).map(normalizeChart),
  };
}

export async function readWorkspaceBackup(file: File): Promise<WorkspaceBackup> {
  return parseWorkspaceBackup(await file.text());
}

export function downloadWorkspaceBackup(backup: WorkspaceBackup, fileName = 'prism-workspace.json'): void {
  downloadBlob(serializeWorkspaceBackup(backup), fileName, 'application/json');
}
