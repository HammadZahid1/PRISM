import { describe, expect, it } from 'vitest';
import { detectFormat, parseContent, parseDelimited, parseJSON, validateParsed } from './parse';

describe('local data parsing', () => {
  it('detects formats from file names and content', () => {
    expect(detectFormat('data.tsv')).toBe('tsv');
    expect(detectFormat('data.tab')).toBe('tsv');
    expect(detectFormat('data.json')).toBe('json');
    expect(detectFormat('upload', 'a\tb\n1\t2')).toBe('tsv');
    expect(detectFormat('upload', '{"a":1}')).toBe('json');
    expect(detectFormat('data.csv')).toBe('csv');
  });

  it('parses CSV headers, coerces cells, and keys rows by column id', () => {
    const parsed = parseDelimited('Name,Value,Active\nAlpha,10,yes\nBeta,20,no\n', 'csv');
    expect(parsed.format).toBe('csv');
    expect(parsed.columns.map((column) => column.id)).toEqual(['name', 'value', 'active']);
    expect(parsed.columns.map((column) => column.type)).toEqual(['string', 'number', 'boolean']);
    expect(parsed.rows).toEqual([
      { name: 'Alpha', value: 10, active: true },
      { name: 'Beta', value: 20, active: false },
    ]);
    expect(parsed.columns[1].unique).toBe(2);
  });

  it('parses tab-separated input', () => {
    const parsed = parseDelimited('City\tPopulation\nOslo\t700000\nLima\t9700000', 'tsv');
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0]).toEqual({ city: 'Oslo', population: 700000 });
  });

  it('supports JSON arrays, wrapped data, and column-oriented objects', () => {
    expect(parseJSON('[{"id":1,"score":4}]').rows).toEqual([{ id: 1, score: 4 }]);
    expect(parseJSON('{"data":[{"x":7}]}').rows).toEqual([{ x: 7 }]);
    expect(parseJSON('{"x":[1,2],"y":[3,4]}').rows).toEqual([
      { x: 1, y: 3 },
      { x: 2, y: 4 },
    ]);
  });

  it('reports nested JSON objects instead of keeping invalid cell types', () => {
    const parsed = parseJSON('[{"id":1,"meta":{"tag":"a"}}]');
    expect(parsed.rows[0].meta).toBe('{"tag":"a"}');
    expect(parsed.issues[0]).toMatchObject({ row: 1, column: 'meta' });
  });

  it('rejects empty and malformed documents', () => {
    expect(() => parseContent('empty.csv', '   ')).toThrow(/empty/);
    expect(() => parseJSON('{oops')).toThrow(/Invalid JSON/);
    expect(() => parseJSON('42')).toThrow(/array of objects/);
    expect(() => parseJSON('[]')).toThrow(/no records/);
  });

  it('validates parsed datasets and detects empty input', () => {
    expect(validateParsed({ columns: [], rows: [], issues: [], format: 'csv' })).toEqual([
      'No columns were detected in this file.',
      'No data rows were detected in this file.',
    ]);
  });
});
