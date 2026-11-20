import type { CellValue, ColumnType } from '@/types/data';

const DATE_PATTERNS = [
  /^\d{4}-\d{1,2}-\d{1,2}([T\s].*)?$/,
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  /^\d{1,2}-\d{1,2}-\d{4}$/,
  /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}$/i,
];

export function isMissing(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

export function looksLikeDate(value: string): boolean {
  if (!DATE_PATTERNS.some((pattern) => pattern.test(value.trim()))) return false;
  const time = Date.parse(value);
  return Number.isFinite(time);
}

function numericRatio(values: string[]): number {
  if (values.length === 0) return 0;
  const numeric = values.filter((value) => value.trim() !== '' && Number.isFinite(Number(value))).length;
  return numeric / values.length;
}

export function detectColumnType(values: unknown[]): ColumnType {
  const strings = values
    .filter((value) => !isMissing(value))
    .map((value) => (typeof value === 'object' ? JSON.stringify(value) : String(value)));
  if (strings.length === 0) return 'string';

  const booleanWords = new Set(['true', 'false', 'yes', 'no', '0', '1']);
  if (strings.every((value) => booleanWords.has(value.toLowerCase()))) {
    return strings.some((value) => ['yes', 'no', 'true', 'false'].includes(value.toLowerCase())) ? 'boolean' : 'number';
  }

  if (numericRatio(strings) >= 0.85) return 'number';
  if (strings.filter(looksLikeDate).length / strings.length >= 0.8) return 'date';
  return 'string';
}

export function coerceCell(value: unknown, type: ColumnType): CellValue {
  if (isMissing(value)) return null;
  if (type === 'number') {
    const num = Number(typeof value === 'string' ? value.replace(/,/g, '').trim() : value);
    return Number.isFinite(num) ? num : null;
  }
  if (type === 'boolean') {
    const text = String(value).trim().toLowerCase();
    if (['true', 'yes', '1'].includes(text)) return true;
    if (['false', 'no', '0'].includes(text)) return false;
    return null;
  }
  if (type === 'date') {
    const time = Date.parse(String(value));
    return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : String(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function typeLabel(type: ColumnType): string {
  return { number: 'num', string: 'text', date: 'date', boolean: 'bool' }[type];
}
