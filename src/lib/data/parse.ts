import Papa from 'papaparse';
import type { CellValue, DataColumn, ParsedData, ParseIssue } from '@/types/data';
import { coerceCell, detectColumnType, isMissing } from './types';
import { slugify } from '@/lib/utils';

export type DataFormat = 'csv' | 'tsv' | 'json';

export function detectFormat(fileName: string, content?: string): DataFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.tsv') || lower.endsWith('.tab')) return 'tsv';
  if (lower.endsWith('.json')) return 'json';
  if (content) {
    const trimmed = content.trimStart();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
    if (trimmed.includes('\t') && !trimmed.includes(',')) return 'tsv';
  }
  return 'csv';
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const base = header.trim() || `column_${index + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function buildColumns(headers: string[], rows: Record<string, CellValue>[]): DataColumn[] {
  const usedIds = new Set<string>();
  return headers.map((name) => {
    const values = rows.map((row) => row[name] ?? null);
    const type = detectColumnType(values);
    const distinct = new Set(values.filter((value) => !isMissing(value)).map(String));
    const baseId = slugify(name);
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    return {
      id,
      name,
      type,
      missing: values.filter(isMissing).length,
      unique: distinct.size,
      sample: values.filter((value) => !isMissing(value)).slice(0, 3).map(String),
    };
  });
}

function keyRowsById(columns: DataColumn[], rows: Record<string, CellValue>[]): void {
  rows.forEach((row) => {
    columns.forEach((column) => {
      row[column.id] = row[column.name] ?? null;
      delete row[column.name];
    });
  });
}

function normalizeHeaders(headers: string[], row: Record<string, unknown>): Record<string, CellValue> {
  const result: Record<string, CellValue> = {};
  headers.forEach((header, index) => {
    const raw = row[header] ?? row[index] ?? null;
    result[header] = raw === undefined ? null : (raw as CellValue);
  });
  return result;
}

export function parseDelimited(content: string, format: 'csv' | 'tsv'): ParsedData {
  const issues: ParseIssue[] = [];
  const result = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    delimiter: format === 'tsv' ? '\t' : ',',
    skipEmptyLines: 'greedy',
    transformHeader: (header, index) => header.trim() || `column_${index + 1}`,
  });

  result.errors.slice(0, 50).forEach((error) => {
    issues.push({
      row: typeof error.row === 'number' ? error.row + 1 : undefined,
      message: error.message,
    });
  });

  const rawHeaders = (result.meta.fields ?? []).filter((field) => field && field !== '__parsed_extra');
  const headers = uniqueHeaders(rawHeaders);
  const rows = result.data
    .filter((row) => Object.values(row).some((value) => value !== null && value !== ''))
    .slice(0, 200000)
    .map((row, index) => {
      const normalized = normalizeHeaders(headers, row);
      if (headers.length > 0 && Object.keys(row).length > headers.length) {
        issues.push({ row: index + 1, message: 'Extra fields were truncated to match the header row.' });
      }
      return normalized;
    });

  const columns = buildColumns(headers, rows);
  keyRowsById(columns, rows);
  columns.forEach((column) => {
    rows.forEach((row) => {
      row[column.id] = coerceCell(row[column.id], column.type);
    });
  });

  return { columns, rows, issues, format };
}

export function parseJSON(content: string): ParsedData {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'unable to parse document'}`);
  }

  let records: Record<string, unknown>[];
  if (Array.isArray(data)) {
    records = data.filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object');
  } else if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    records = ((data as { data: unknown[] }).data).filter(
      (item): item is Record<string, unknown> => item !== null && typeof item === 'object',
    );
  } else if (data && typeof data === 'object') {
    const object = data as Record<string, unknown>;
    const keys = Object.keys(object);
    const lengths = keys.map((key) => (Array.isArray(object[key]) ? (object[key] as unknown[]).length : 0));
    const length = Math.max(...lengths, 0);
    if (length === 0) throw new Error('JSON object must contain an array of records or arrays of column values.');
    records = Array.from({ length }, (_, index) =>
      Object.fromEntries(keys.map((key) => [key, Array.isArray(object[key]) ? object[key][index] : object[key]])),
    );
  } else {
    throw new Error('JSON data must be an array of objects or an object containing arrays.');
  }

  if (records.length === 0) throw new Error('The JSON document contains no records.');

  const headers = uniqueHeaders([
    ...new Set(records.flatMap((record) => Object.keys(record))),
  ]);
  const issues: ParseIssue[] = [];
  const rows = records.slice(0, 200000).map((record, index) => {
    const row: Record<string, CellValue> = {};
    headers.forEach((header) => {
      let value = record[header];
      if (value !== null && typeof value === 'object') {
        value = JSON.stringify(value);
        issues.push({ row: index + 1, column: header, message: 'Nested object was serialized to text.' });
      }
      row[header] = (value ?? null) as CellValue;
    });
    return row;
  });

  const columns = buildColumns(headers, rows);
  keyRowsById(columns, rows);
  columns.forEach((column) => {
    rows.forEach((row) => {
      row[column.id] = coerceCell(row[column.id], column.type);
    });
  });
  return { columns, rows, issues, format: 'json' };
}

export function parseContent(fileName: string, content: string): ParsedData {
  const format = detectFormat(fileName, content);
  if (!content.trim()) throw new Error('The selected file is empty.');
  if (format === 'json') return parseJSON(content);
  return parseDelimited(content, format);
}

export function validateParsed(parsed: ParsedData): string[] {
  const errors: string[] = [];
  if (parsed.columns.length === 0) errors.push('No columns were detected in this file.');
  if (parsed.rows.length === 0) errors.push('No data rows were detected in this file.');
  if (parsed.columns.length > 500) errors.push('This file has more than 500 columns; only the first 500 can be used.');
  if (parsed.rows.length > 200000) errors.push('This file exceeds the 200,000 row limit and was truncated.');
  const duplicateIds = new Set<string>();
  parsed.columns.forEach((column) => {
    if (duplicateIds.has(column.id)) errors.push(`Duplicate column identifier detected: ${column.id}`);
    duplicateIds.add(column.id);
  });
  return errors;
}
