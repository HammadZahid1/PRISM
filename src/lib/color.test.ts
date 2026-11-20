import { describe, expect, it } from 'vitest';
import { categoryColor, categoryColorFor, heatColor, intensityColor, mixColor } from './color';

describe('visualization colors', () => {
  it('cycles the categorical palette deterministically', () => {
    expect(categoryColor(0)).toBe('#22d3ee');
    expect(categoryColor(10)).toBe(categoryColor(0));
    expect(categoryColor(-1)).toBe(categoryColor(1));
  });

  it('maps category values to stable colors', () => {
    expect(categoryColorFor('beta', ['alpha', 'beta'])).toBe(categoryColor(1));
    expect(categoryColorFor('missing', ['alpha', 'beta'])).toBe(categoryColor(-1));
  });

  it('interpolates intensity and heat colors', () => {
    expect(heatColor(0)).toBe('rgb(12, 18, 28)');
    expect(heatColor(1)).toBe('rgb(46, 211, 238)');
    expect(heatColor(2)).toBe(heatColor(1));
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('rgb(128, 128, 128)');
    expect(intensityColor(0)).toBe(mixColor('#4c3fa8', '#67e8f9', 0));
  });
});
