export type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'scatter'
  | 'bubble'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'histogram'
  | 'boxplot'
  | 'heatmap'
  | 'treemap';

export type Aggregation = 'none' | 'sum' | 'mean' | 'count' | 'min' | 'max';

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  datasetId: string;
  x: string;
  y: string;
  category: string;
  size: string;
  color: string;
  aggregation: Aggregation;
  bins: number;
  orientation: 'vertical' | 'horizontal';
  stacked: boolean;
  smooth: boolean;
  showLegend: boolean;
  showGrid: boolean;
  showLabels: boolean;
  showTooltip: boolean;
  limit: number;
}

export interface SelectedDatum {
  chartId: string;
  label: string;
  value: number | string;
  series?: string;
  rowIndex?: number;
}

export type UniverseMode = 'scatter' | 'cluster' | 'density' | 'radial' | 'orbit';

export interface UniverseMapping {
  x: string;
  y: string;
  z: string;
  size: string;
  color: string;
  intensity: string;
}

export interface UniverseConfig {
  mode: UniverseMode;
  mapping: UniverseMapping;
  pointSize: number;
  opacity: number;
  maxPoints: number;
  showGrid: boolean;
  showConnections: boolean;
  animate: boolean;
}
