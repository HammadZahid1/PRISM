import { Database, Trash2 } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Panel } from '@/components/ui/Panel';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { formatDate, formatNumber } from '@/lib/utils';

export function RecentDatasets({ onBrowseSamples }: { onBrowseSamples: () => void }) {
  const datasets = useAppStore((state) => state.datasets);
  const activeId = useAppStore((state) => state.activeDatasetId);
  const selectDataset = useAppStore((state) => state.selectDataset);
  const removeDataset = useAppStore((state) => state.removeDataset);
  const setModule = useAppStore((state) => state.setModule);

  return (
    <Panel
      title="Recent datasets"
      subtitle="Continue where you left off"
      icon={<Database size={14} />}
      actions={<Badge tone="neutral">{datasets.length} loaded</Badge>}
    >
      {datasets.length === 0 ? (
        <div className="flex flex-col items-start gap-2 py-6">
          <p className="text-[11px] text-[#6c7685]">No datasets in this workspace yet.</p>
          <Button size="sm" icon={<Database size={12} />} onClick={onBrowseSamples}>
            Browse sample datasets
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {datasets.slice(0, 6).map((dataset) => (
            <div
              key={dataset.id}
              className={`group flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                dataset.id === activeId
                  ? 'border-[var(--accent-cyan)]/25 bg-[var(--accent-cyan)]/[0.045]'
                  : 'border-white/[0.05] bg-white/[0.015] hover:border-white/[0.12]'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  selectDataset(dataset.id);
                  setModule('explorer');
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="rounded-md border border-white/[0.08] bg-[#14171c] p-1.5 text-[#8a94a3] group-hover:text-[var(--accent-cyan)]">
                  <Database size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-[#dbe3ec]">{dataset.name}</span>
                  <span className="block truncate text-[10px] text-[#6c7685]">
                    {formatNumber(dataset.rows.length, 0)} rows · {dataset.columns.length} cols · {formatDate(dataset.createdAt)}
                  </span>
                </span>
              </button>
              <Badge tone={dataset.source === 'sample' ? 'accent' : 'neutral'}>{dataset.source}</Badge>
              <IconButton
                label={`Remove ${dataset.name}`}
                icon={<Trash2 size={13} />}
                onClick={() => removeDataset(dataset.id)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100"
              />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
