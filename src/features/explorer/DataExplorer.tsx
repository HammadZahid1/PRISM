import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  FileUp,
  Filter,
  Table2,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Primitives';
import { EmptyState } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { FilterBar } from './FilterBar';
import { DataInspector } from './DataInspector';
import { toggleSortIndicator } from './tableUtils';
import { toDisplay } from '@/lib/utils';

export function DataExplorer() {
  const { dataset, rows } = useVisibleRows();
  const sorts = useAppStore((state) => state.sorts);
  const toggleSort = useAppStore((state) => state.toggleSort);
  const setImportOpen = useAppStore((state) => state.setImportOpen);
  const setModule = useAppStore((state) => state.setModule);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(75);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showColumns, setShowColumns] = useState(false);
  const [showInspector, setShowInspector] = useState(true);

  const columns = useMemo(
    () => dataset?.columns.filter((column) => !hiddenColumns.includes(column.id)) ?? [],
    [dataset, hiddenColumns],
  );

  useEffect(() => setPage(0), [dataset?.id, rows.length, pageSize]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (!dataset) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<Table2 size={20} />}
          title="No dataset to explore"
          description="Import a file or load a sample dataset to browse its rows, columns and value distributions."
          action={
            <div className="flex gap-2">
              <Button variant="primary" icon={<FileUp size={14} />} onClick={() => setImportOpen(true)}>Import data</Button>
              <Button icon={<Table2 size={14} />} onClick={() => setModule('presets')}>Browse samples</Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="label mb-1">Data explorer</div>
          <h1 className="truncate text-base font-semibold text-[#e9edf3]">{dataset.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">{dataset.rows.length.toLocaleString()} rows</Badge>
            <Badge>{dataset.columns.length} columns</Badge>
            <Badge>{rows.length.toLocaleString()} visible</Badge>
            <Badge tone="neutral">{dataset.source}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<FileUp size={13} />} onClick={() => setImportOpen(true)}>Import</Button>
          <Button icon={<Download size={13} />} onClick={() => setModule('export')}>Export</Button>
          <Button variant="primary" onClick={() => setModule('studio')}>Visualize</Button>
        </div>
      </div>

      <Panel
        className="min-h-0 flex-1"
        flush
        title="Dataset table"
        subtitle="Click a column header to sort, click a row to inspect"
        icon={<Table2 size={14} />}
        actions={
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              icon={<Filter size={12} />}
              onClick={() => setShowInspector((value) => !value)}
            >
              Inspector
            </Button>
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                icon={<Columns3 size={12} />}
                onClick={() => setShowColumns((value) => !value)}
              >
                Columns
              </Button>
              {showColumns && (
                <div className="absolute right-0 top-9 z-30 w-56 rounded-lg border border-white/[0.1] bg-[#14171c] p-2 shadow-2xl">
                  <div className="label mb-1.5 px-1">Visible columns</div>
                  <div className="max-h-56 space-y-0.5 overflow-y-auto">
                    {dataset.columns.map((column) => {
                      const hidden = hiddenColumns.includes(column.id);
                      return (
                        <button
                          type="button"
                          key={column.id}
                          onClick={() =>
                            setHiddenColumns((current) =>
                              hidden ? current.filter((id) => id !== column.id) : [...current, column.id],
                            )
                          }
                          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] text-[#a2acba] hover:bg-white/[0.05]"
                        >
                          <span className="truncate">{column.name}</span>
                          <span className={`h-2 w-2 rounded-sm ${hidden ? 'bg-[#3b424d]' : 'bg-[var(--accent-cyan)]'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <FilterBar columns={dataset.columns} />

          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead className="sticky top-0 z-10 bg-[#12151a]">
                    <tr>
                      <th className="sticky left-0 z-20 w-12 border-b border-white/[0.07] bg-[#12151a] px-2 py-2 text-[9px] font-medium text-[#5c6675]">#</th>
                      {columns.map((column) => {
                        const rule = sorts.find((sort) => sort.columnId === column.id);
                        return (
                          <th
                            key={column.id}
                            className="min-w-[132px] cursor-pointer select-none border-b border-white/[0.07] px-2.5 py-2 font-medium text-[#8a94a3] hover:text-[#e9edf3]"
                            onClick={() => toggleSort(column.id)}
                            title={`Sort by ${column.name}`}
                          >
                            <span className="flex items-center gap-1.5 whitespace-nowrap">
                              <span className="truncate">{column.name}</span>
                              <span className="mono text-[8px] text-[#4d5663]">{column.type.slice(0, 3)}</span>
                              <span className="text-[var(--accent-cyan)]">{toggleSortIndicator(rule)}</span>
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row, localIndex) => {
                      const index = currentPage * pageSize + localIndex;
                      return (
                        <tr
                          key={index}
                          onClick={() => setSelectedRow(index)}
                          onDoubleClick={() => {
                            void navigator.clipboard?.writeText(
                              columns.map((column) => toDisplay(row[column.id])).join('\t'),
                            );
                          }}
                          className={`cursor-pointer border-b border-white/[0.035] transition-colors hover:bg-white/[0.035] ${
                            selectedRow === index ? 'bg-[var(--accent-cyan)]/[0.07]' : ''
                          }`}
                        >
                          <td className="mono sticky left-0 z-10 bg-[#101216] px-2 py-1.5 text-[9px] text-[#5c6675]">
                            {index + 1}
                          </td>
                          {columns.map((column) => {
                            const value = row[column.id];
                            const missing = value === null || value === undefined || value === '';
                            return (
                              <td
                                key={column.id}
                                className={`mono max-w-[260px] truncate px-2.5 py-1.5 ${
                                  missing ? 'italic text-[#4d5663]' : 'text-[#b8c2cf]'
                                }`}
                                title={toDisplay(value)}
                              >
                                {toDisplay(value)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-2">
                <div className="flex items-center gap-2 text-[10px] text-[#6c7685]">
                  <span className="mono">
                    {rows.length === 0 ? 0 : currentPage * pageSize + 1}–{Math.min(rows.length, (currentPage + 1) * pageSize)} of{' '}
                    {rows.length.toLocaleString()}
                  </span>
                  <select
                    className="control h-6 w-20 px-1 text-[10px]"
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    aria-label="Rows per page"
                  >
                    {[25, 50, 75, 150, 300].map((size) => (
                      <option key={size} value={size}>{size} / page</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setPage(0)} disabled={currentPage === 0}>First</Button>
                  <Button size="sm" variant="ghost" icon={<ChevronLeft size={12} />} onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0} />
                  <span className="mono px-2 text-[10px] text-[#8a94a3]">{currentPage + 1} / {pageCount}</span>
                  <Button size="sm" variant="ghost" icon={<ChevronRight size={12} />} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1} />
                  <Button size="sm" variant="ghost" onClick={() => setPage(pageCount - 1)} disabled={currentPage >= pageCount - 1}>Last</Button>
                </div>
              </div>
            </div>

            {showInspector && (
              <div className="hidden w-64 shrink-0 border-l border-white/[0.06] bg-[#0d0f13] xl:block">
                <DataInspector
                  dataset={dataset}
                  rowIndex={selectedRow}
                  rowsCount={rows.length}
                  onClose={() => setSelectedRow(null)}
                />
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
