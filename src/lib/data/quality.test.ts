import { describe, expect, it } from 'vitest';
import type { CellValue, DataColumn, Dataset } from '@/types';
import { analyzeDataQuality, qualityScoreLabel } from './quality';

function makeDataset(columns: DataColumn[], rows: Record<string, CellValue>[]): Dataset {
  return {
    id: 'ds_quality',
    name: 'Quality fixture',
    description: '',
    source: 'sample',
    columns,
    rows,
    createdAt: 0,
    updatedAt: 0,
    tags: [],
  };
}

describe('data quality analysis', () => {
  it('reports a clean dataset without issues', () => {
    const dataset = makeDataset(
      [
        { id: 'group', name: 'Group', type: 'string', missing: 0, unique: 3 },
        { id: 'value', name: 'Value', type: 'number', missing: 0, unique: 3 },
      ],
      [
        { group: 'A', value: 1 },
        { group: 'B', value: 2 },
        { group: 'C', value: 3 },
      ],
    );
    const report = analyzeDataQuality(dataset);
    expect(report.score).toBe(100);
    expect(report.issues).toEqual([]);
    expect(report.missingCells).toBe(0);
    expect(report.duplicateRows).toBe(0);
  });

  it('flags columns with a high missing-value ratio', () => {
    const dataset = makeDataset(
      [{ id: 'value', name: 'Value', type: 'number', missing: 3, unique: 1 }],
      [{ value: 1 }, { value: null }, { value: '' }, { value: null }],
    );
    const report = analyzeDataQuality(dataset);
    const issue = report.issues.find((item) => item.id === 'missing-value');
    expect(issue?.severity).toBe('danger');
    expect(issue?.count).toBe(3);
    expect(report.missingCells).toBe(3);
    expect(report.score).toBeLessThan(100);
  });

  it('detects exact duplicate rows', () => {
    const dataset = makeDataset(
      [{ id: 'value', name: 'Value', type: 'number', missing: 0, unique: 1 }],
      [{ value: 7 }, { value: 7 }, { value: 8 }],
    );
    const report = analyzeDataQuality(dataset);
    expect(report.duplicateRows).toBe(1);
    expect(report.issues.find((item) => item.id === 'duplicate-rows')?.count).toBe(1);
  });

  it('flags constant columns and numeric outliers', () => {
    const dataset = makeDataset(
      [
        { id: 'constant', name: 'Constant', type: 'string', missing: 0, unique: 1 },
        { id: 'value', name: 'Value', type: 'number', missing: 0, unique: 10 },
      ],
      [
        { constant: 'x', value: 1 },
        { constant: 'x', value: 2 },
        { constant: 'x', value: 3 },
        { constant: 'x', value: 4 },
        { constant: 'x', value: 5 },
        { constant: 'x', value: 6 },
        { constant: 'x', value: 7 },
        { constant: 'x', value: 100 },
      ],
    );
    const report = analyzeDataQuality(dataset);
    expect(report.issues.some((item) => item.id === 'constant-constant')).toBe(true);
    expect(report.issues.some((item) => item.id === 'outlier-value')).toBe(true);
  });

  it('reports empty datasets and maps score labels', () => {
    const report = analyzeDataQuality(makeDataset([], []));
    expect(report.score).toBe(0);
    expect(report.issues[0].id).toBe('empty-dataset');
    expect(qualityScoreLabel(95)).toBe('Excellent');
    expect(qualityScoreLabel(80)).toBe('Good');
    expect(qualityScoreLabel(60)).toBe('Fair');
    expect(qualityScoreLabel(20)).toBe('Needs attention');
  });
});
