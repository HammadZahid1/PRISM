import type { ChartConfig, ChartType, Dataset } from '@/types';
import { autoConfig, chartLabel, validateConfig } from './config';

export interface ChartRecommendation {
  type: ChartType;
  score: number;
  reason: string;
  config: ChartConfig;
}

interface Candidate {
  type: ChartType;
  score: number;
  reason: string;
}

function cardinality(dataset: Dataset, id: string): number {
  const column = dataset.columns.find((item) => item.id === id);
  if (!column) return 0;
  if (column.unique > 0) return column.unique;
  return new Set(dataset.rows.map((row) => row[id])).size;
}

export function recommendCharts(dataset: Dataset, limit = 4): ChartRecommendation[] {
  if (dataset.columns.length === 0 || dataset.rows.length === 0) return [];

  const numeric = dataset.columns.filter((column) => column.type === 'number');
  const categorical = dataset.columns.filter((column) => column.type === 'string' || column.type === 'boolean');
  const dates = dataset.columns.filter((column) => column.type === 'date');
  const lowCardinality = categorical.filter((column) => {
    const count = cardinality(dataset, column.id);
    return count > 0 && count <= 12;
  });
  const candidates: Candidate[] = [];

  if (dates.length && numeric.length) {
    candidates.push({
      type: 'line',
      score: 96,
      reason: `${dates[0].name} plus ${numeric[0].name} supports a time-series trend.`,
    });
    candidates.push({
      type: 'area',
      score: 82,
      reason: 'An area chart emphasizes accumulated change over the ordered axis.',
    });
  }

  if (numeric.length >= 2) {
    candidates.push({
      type: 'scatter',
      score: 92,
      reason: `${numeric[0].name} and ${numeric[1].name} can reveal correlation or clusters.`,
    });
  }

  if (numeric.length >= 3) {
    candidates.push({
      type: 'bubble',
      score: 84,
      reason: `A third numeric field (${numeric[2].name}) can encode point size.`,
    });
  }

  if (lowCardinality.length && numeric.length) {
    candidates.push({
      type: 'bar',
      score: 90,
      reason: `${lowCardinality[0].name} is a low-cardinality dimension for comparing totals.`,
    });
    candidates.push({
      type: 'radar',
      score: 66,
      reason: 'Radar charts compare multiple metrics across a small set of categories.',
    });
  }

  if (lowCardinality.length && lowCardinality.length >= 2 && numeric.length) {
    candidates.push({
      type: 'heatmap',
      score: 78,
      reason: `Two categorical fields (${lowCardinality[0].name}, ${lowCardinality[1].name}) form a useful matrix.`,
    });
  }

  if (numeric.length) {
    candidates.push({
      type: 'histogram',
      score: 74,
      reason: `A histogram exposes the distribution of ${numeric[0].name}.`,
    });
    candidates.push({
      type: 'boxplot',
      score: 70,
      reason: 'A box plot summarizes quartiles and highlights outliers.',
    });
  }

  if (lowCardinality.length && numeric.length) {
    candidates.push({
      type: 'treemap',
      score: 62,
      reason: `A treemap shows each ${lowCardinality[0].name} share of the total.`,
    });
    if (cardinality(dataset, lowCardinality[0].id) <= 8) {
      candidates.push({
        type: 'pie',
        score: 68,
        reason: `There are few enough ${lowCardinality[0].name} values for a part-to-whole view.`,
      });
    }
  }

  if (categorical.length && !numeric.length) {
    candidates.push({
      type: 'treemap',
      score: 58,
      reason: 'Without numeric measures, a treemap can show category frequency.',
    });
  }

  const seen = new Set<ChartType>();
  return candidates
    .sort((a, b) => b.score - a.score)
    .filter((candidate) => {
      if (seen.has(candidate.type)) return false;
      seen.add(candidate.type);
      return true;
    })
    .map((candidate) => ({ ...candidate, config: autoConfig(dataset, candidate.type) }))
    .filter((item) => validateConfig(dataset, item.config).valid)
    .map((item) => ({
      ...item,
      config: { ...item.config, title: `${chartLabel(item.type)} · ${dataset.name}`, id: `${item.config.id}_rec_${item.type}` },
    }))
    .slice(0, Math.max(1, limit));
}
