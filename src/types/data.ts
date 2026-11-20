export type CellValue = string | number | boolean | null;

export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface DataColumn {
  id: string;
  name: string;
  type: ColumnType;
  missing: number;
  unique: number;
  sample?: string[];
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  source: 'upload' | 'sample' | 'playground';
  fileName?: string;
  fileSize?: number;
  columns: DataColumn[];
  rows: Record<string, CellValue>[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface DatasetSummary {
  id: string;
  name: string;
  rows: number;
  columns: number;
  createdAt: number;
  source: Dataset['source'];
  description: string;
}

export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'not_equals'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'empty'
  | 'not_empty';

export interface DataFilter {
  id: string;
  columnId: string;
  operator: FilterOperator;
  value: string;
  value2?: string;
  enabled: boolean;
}

export interface SortRule {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface ParseIssue {
  row?: number;
  column?: string;
  message: string;
}

export interface ParsedData {
  columns: DataColumn[];
  rows: Record<string, CellValue>[];
  issues: ParseIssue[];
  format: 'csv' | 'tsv' | 'json';
}

export interface ActivityEntry {
  id: string;
  at: number;
  label: string;
  detail: string;
  kind: 'dataset' | 'visualization' | 'transform' | 'export' | 'system';
}
