import { describe, expect, it } from 'vitest';
import { coerceCell, detectColumnType, isMissing, looksLikeDate, typeLabel } from './types';

describe('data type detection', () => {
  it('recognizes missing values consistently', () => {
    expect(isMissing(null)).toBe(true);
    expect(isMissing(undefined)).toBe(true);
    expect(isMissing('   ')).toBe(true);
    expect(isMissing(0)).toBe(false);
    expect(isMissing(false)).toBe(false);
  });

  it('detects numeric columns with occasional missing values', () => {
    expect(detectColumnType(['1', '2.5', '', '4'])).toBe('number');
    expect(detectColumnType(['1', 'two', 'three'])).toBe('string');
  });

  it('detects booleans, explicit numeric bits, and dates', () => {
    expect(detectColumnType(['yes', 'no', 'true', 'false'])).toBe('boolean');
    expect(detectColumnType(['0', '1', '1', '0'])).toBe('number');
    expect(detectColumnType(['2024-01-01', '2024-02-15', '2024-03-30'])).toBe('date');
    expect(looksLikeDate('March 4, 2024')).toBe(true);
    expect(looksLikeDate('not a date')).toBe(false);
  });

  it('coerces values into the inferred cell representation', () => {
    expect(coerceCell('1,250', 'number')).toBe(1250);
    expect(coerceCell('bad', 'number')).toBeNull();
    expect(coerceCell('YES', 'boolean')).toBe(true);
    expect(coerceCell('off', 'boolean')).toBeNull();
    expect(coerceCell('2024-01-02', 'date')).toBe('2024-01-02');
    expect(coerceCell({ nested: true }, 'string')).toBe('{"nested":true}');
  });

  it('provides compact type labels', () => {
    expect(typeLabel('number')).toBe('num');
    expect(typeLabel('string')).toBe('text');
    expect(typeLabel('date')).toBe('date');
    expect(typeLabel('boolean')).toBe('bool');
  });
});
