import { Clipboard, X } from 'lucide-react';
import type { Dataset } from '@/types';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Primitives';
import { numericStats, categoricalStats } from '@/lib/data/stats';
import { formatNumber, toDisplay } from '@/lib/utils';
import { typeLabel } from '@/lib/data/types';

export function DataInspector({
  dataset,
  rowIndex,
  onClose,
  rowsCount,
}: {
  dataset: Dataset;
  rowIndex: number | null;
  onClose: () => void;
  rowsCount: number;
}) {
  if (rowIndex === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5 text-[#5c6675]">
          <Clipboard size={17} />
        </div>
        <p className="text-[11px] font-medium text-[#8a94a3]">No row selected</p>
        <p className="text-[10px] leading-relaxed text-[#5c6675]">
          Choose a row in the table to inspect its values and column context.
        </p>
      </div>
    );
  }

  const row = dataset.rows[rowIndex];
  if (!row) return null;

  const copyRow = () => {
    const text = dataset.columns.map((column) => `${column.name}\t${toDisplay(row[column.id])}`).join('\n');
    void navigator.clipboard?.writeText(text);
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="label">Record inspector</div>
          <div className="mono mt-1 text-sm text-[var(--accent-cyan)]">Row {rowIndex + 1}</div>
          <div className="text-[10px] text-[#6c7685]">of {rowsCount.toLocaleString()} visible rows</div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton label="Copy row values" icon={<Clipboard size={13} />} onClick={copyRow} />
          <IconButton label="Close inspector" icon={<X size={13} />} onClick={onClose} />
        </div>
      </div>

      <div className="space-y-1.5">
        {dataset.columns.map((column) => {
          const value = row[column.id];
          const numStats = column.type === 'number' ? numericStats(dataset.rows, column.id) : null;
          const catStats = column.type !== 'number' ? categoricalStats(dataset.rows, column.id, 1) : null;
          const detail = numStats
            ? `mean ${formatNumber(numStats.mean)} · max ${formatNumber(numStats.max)}`
            : `${catStats?.unique ?? 0} distinct`;
          return (
            <div key={column.id} className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] text-[#8a94a3]">{column.name}</span>
                <Badge tone="neutral" className="mono">{typeLabel(column.type)}</Badge>
              </div>
              <div className="mono mt-1 truncate text-[11px] text-[#e9edf3]" title={toDisplay(value)}>
                {toDisplay(value)}
              </div>
              <div className="mono mt-1 text-[9px] text-[#5c6675]">{detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
