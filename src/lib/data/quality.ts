import type { Dataset } from '@/types/data';
import { isMissing } from './types';
import { quantile } from '../math';

export type QualitySeverity = 'info' | 'warning' | 'danger';

export interface QualityIssue {
  id: string;
  severity: QualitySeverity;
  title: string;
  detail: string;
  count: number;
  columnId?: string;
}

export interface QualityReport {
  score: number;
  issues: QualityIssue[];
  missingCells: number;
  duplicateRows: number;
  scannedRows: number;
}

const IDENTIFIER_HINTS = ['id', 'uuid', 'key'];

function isIdentifierLike(name: string): boolean {
  const lower = name.toLowerCase();
  return IDENTIFIER_HINTS.some((hint) => lower === hint || lower.endsWith(`_${hint}`));
}

function duplicateCount(dataset: Dataset): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of dataset.rows) {
    const key = dataset.columns.map((column) => JSON.stringify(row[column.id] ?? null)).join('\u0000');
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  return duplicates;
}

export function analyzeDataQuality(dataset: Dataset): QualityReport {
  const issues: QualityIssue[] = [];
  const total = dataset.rows.length;
  const missingByColumn = new Map<string, number>();
  let missingCells = 0;

  for (const column of dataset.columns) {
    let missing = 0;
    const values: number[] = [];
    const distinct = new Set<string>();
    for (const row of dataset.rows) {
      const value = row[column.id];
      if (isMissing(value)) {
        missing += 1;
      } else {
        distinct.add(String(value));
        if (column.type === 'number' && typeof value === 'number' && Number.isFinite(value)) values.push(value);
      }
    }
    missingByColumn.set(column.id, missing);
    missingCells += missing;

    const ratio = total ? missing / total : 0;
    if (ratio >= 0.2) {
      issues.push({
        id: `missing-${column.id}`,
        severity: ratio >= 0.5 ? 'danger' : 'warning',
        title: `${column.name} has missing values`,
        detail: `${missing.toLocaleString()} of ${total.toLocaleString()} rows (${(ratio * 100).toFixed(0)}%) are empty.`,
        count: missing,
        columnId: column.id,
      });
    }

    if (total > 1 && distinct.size === 1) {
      issues.push({
        id: `constant-${column.id}`,
        severity: 'info',
        title: `${column.name} is constant`,
        detail: 'Every populated row has the same value, so this column may not add analytical signal.',
        count: total - missing,
        columnId: column.id,
      });
    }

    if (column.type === 'number' && values.length >= 8) {
      const q1 = quantile(values, 0.25);
      const q3 = quantile(values, 0.75);
      const iqr = q3 - q1;
      if (iqr > 0) {
        const low = q1 - 1.5 * iqr;
        const high = q3 + 1.5 * iqr;
        const outliers = values.filter((value) => value < low || value > high).length;
        if (outliers > 0) {
          issues.push({
            id: `outlier-${column.id}`,
            severity: 'info',
            title: `${column.name} contains outliers`,
            detail: `${outliers} value${outliers === 1 ? '' : 's'} fall outside the 1.5×IQR range.`,
            count: outliers,
            columnId: column.id,
          });
        }
      }
    }

    if (column.type === 'string' && distinct.size === total && isIdentifierLike(column.name)) {
      issues.push({
        id: `unique-${column.id}`,
        severity: 'info',
        title: `${column.name} is unique per row`,
        detail: 'This looks like an identifier and is usually better used for grouping labels than numeric analysis.',
        count: distinct.size,
        columnId: column.id,
      });
    }
  }

  const duplicates = duplicateCount(dataset);
  if (duplicates > 0) {
    issues.push({
      id: 'duplicate-rows',
      severity: 'warning',
      title: 'Duplicate rows detected',
      detail: `${duplicates.toLocaleString()} row${duplicates === 1 ? '' : 's'} exactly match another row.`,
      count: duplicates,
    });
  }

  if (total === 0) {
    issues.push({
      id: 'empty-dataset',
      severity: 'danger',
      title: 'Dataset has no rows',
      detail: 'Load a different dataset or add records before analyzing patterns.',
      count: 0,
    });
  }

  const cellCount = Math.max(1, total * Math.max(1, dataset.columns.length));
  const duplicatePenalty = total ? duplicates / total : 0;
  const rawScore = 100 - (missingCells / cellCount) * 70 - duplicatePenalty * 25;
  const score = total === 0 ? 0 : Math.max(0, Math.round(rawScore));
  const severityRank: Record<QualitySeverity, number> = { danger: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.count - a.count);

  return { score, issues, missingCells, duplicateRows: duplicates, scannedRows: total };
}

export function qualityScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 55) return 'Fair';
  return 'Needs attention';
}
