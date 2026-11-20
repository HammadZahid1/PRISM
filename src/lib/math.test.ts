import { describe, expect, it } from 'vitest';
import { linearRegression, mean, median, normalizeRange, pearson, quantile, stdDev, variance } from './math';

describe('math helpers', () => {
  it('computes central tendency for odd and even samples', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(mean([])).toBeNaN();
  });

  it('distinguishes population and sample variance', () => {
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4);
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9], true)).toBeCloseTo(4.5714, 4);
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });

  it('interpolates quantiles', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75);
    expect(quantile([], 0.5)).toBeNaN();
  });

  it('measures correlation and regression direction', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10);
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10);
    const regression = linearRegression([1, 2, 3, 4], [3, 5, 7, 9]);
    expect(regression.slope).toBe(2);
    expect(regression.intercept).toBe(1);
    expect(regression.r2).toBeCloseTo(1, 10);
  });

  it('normalizes ranges and handles constant series', () => {
    expect(normalizeRange([10, 20, 30])).toEqual([0, 0.5, 1]);
    expect(normalizeRange([5, 5, 5])).toEqual([0.5, 0.5, 0.5]);
  });
});
