import type { Settings } from '@/types';

const KEY = 'prism.preferences.v1';

export const defaultSettings: Settings = {
  accent: 'cyan',
  sidebarCollapsed: false,
  animations: true,
  density: 'comfortable',
  defaultChart: 'bar',
  maxTableRows: 50000,
  universePoints: 4000,
  persistDatasets: true,
  showGrid: true,
};

export function loadPreferences(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

export function savePreferences(settings: Settings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage may be disabled or full; preferences remain in memory.
  }
}

export function clearPreferences(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Ignore storage failures.
  }
}
