import { describe, expect, it } from 'vitest';
import { clamp, formatBytes, formatNumber, shortId, slugify, toDisplay, uid } from './utils';

describe('formatting utilities', () => {
  it('generates unique prefixed identifiers', () => {
    const ids = Array.from({ length: 100 }, () => uid('x'));
    expect(new Set(ids).size).toBe(100);
    expect(ids[0]).toMatch(/^x_/);
  });

  it('clamps numeric values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('formats numbers with compact suffixes', () => {
    expect(formatNumber(12345)).toBe('12.35k');
    expect(formatNumber(2_500_000)).toBe('2.50M');
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatNumber(42)).toBe('42');
  });

  it('formats byte counts', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });

  it('renders cell values for display', () => {
    expect(toDisplay(null)).toBe('—');
    expect(toDisplay(1.23456)).toBe('1.2346');
    expect(toDisplay(false)).toBe('false');
    expect(shortId('chart_abc123')).toBe('abc123');
  });

  it('slugs human-readable names', () => {
    expect(slugify('Total Revenue (USD)')).toBe('total_revenue_usd');
    expect(slugify('///')).toBe('column');
    expect(slugify('  Already_Slug  ')).toBe('already_slug');
  });
});
