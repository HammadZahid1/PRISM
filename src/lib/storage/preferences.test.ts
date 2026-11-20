import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPreferences, defaultSettings, loadPreferences, savePreferences } from './preferences';

const values = new Map<string, string>();

vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  },
});

describe('preference persistence', () => {
  beforeEach(() => values.clear());
  afterAll(() => vi.unstubAllGlobals());

  it('returns defaults when nothing is saved', () => {
    expect(loadPreferences()).toEqual(defaultSettings);
  });

  it('saves and reloads preferences', () => {
    savePreferences({ ...defaultSettings, accent: 'violet', density: 'compact', universePoints: 8000 });
    const loaded = loadPreferences();
    expect(loaded.accent).toBe('violet');
    expect(loaded.density).toBe('compact');
    expect(loaded.universePoints).toBe(8000);
  });

  it('merges partial saved preferences with defaults', () => {
    values.set('prism.preferences.v1', JSON.stringify({ accent: 'ice' }));
    expect(loadPreferences()).toEqual({ ...defaultSettings, accent: 'ice' });
  });

  it('falls back to defaults for corrupt storage', () => {
    values.set('prism.preferences.v1', '{not-json');
    expect(loadPreferences()).toEqual(defaultSettings);
  });

  it('clears saved preferences', () => {
    savePreferences(defaultSettings);
    clearPreferences();
    expect(values.size).toBe(0);
  });
});
