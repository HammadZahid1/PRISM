import type { Dataset } from '@/types';
import { createPresetDatasets } from './generators';

export { createPresetDatasets } from './generators';

export interface PresetMeta {
  name: string;
  description: string;
  category: string;
  accent: 'cyan' | 'violet' | 'ice';
}

export const presetMetadata: PresetMeta[] = [
  { name: 'Global Population', description: 'Regional population growth, urban share and growth rates.', category: 'Society', accent: 'cyan' },
  { name: 'Solar System', description: 'Planetary orbit, radius and mass reference values.', category: 'Space', accent: 'violet' },
  { name: 'Technology Trends', description: 'Simulated adoption curves across technology segments.', category: 'Technology', accent: 'ice' },
  { name: 'Climate Explorer', description: 'Simulated station-level climate observations.', category: 'Climate', accent: 'cyan' },
  { name: 'World Economy', description: 'Fictional GDP, inflation and unemployment indicators.', category: 'Economy', accent: 'violet' },
  { name: 'City Statistics', description: 'Urban density, transit and green-space indicators.', category: 'Cities', accent: 'ice' },
  { name: 'Space Missions', description: 'Fictional mission durations, budgets and destinations.', category: 'Space', accent: 'cyan' },
  { name: 'Synthetic Financial Markets', description: 'Clearly simulated OHLC market records.', category: 'Finance', accent: 'violet' },
];

const cache = new Map<string, Dataset>();

export function getPreset(name: string): Dataset {
  const cached = cache.get(name);
  if (cached) return { ...cached, rows: [...cached.rows] };
  const dataset = createPresetDatasets().find((item) => item.name === name);
  if (!dataset) throw new Error(`Unknown preset dataset: ${name}`);
  cache.set(name, dataset);
  return { ...dataset, rows: [...dataset.rows] };
}
