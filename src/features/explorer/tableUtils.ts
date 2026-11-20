import type { SortRule } from '@/types';

export function toggleSortIndicator(rule?: SortRule): string {
  if (!rule) return '↕';
  return rule.direction === 'asc' ? '↑' : '↓';
}

export function pageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice(page * pageSize, (page + 1) * pageSize);
}
