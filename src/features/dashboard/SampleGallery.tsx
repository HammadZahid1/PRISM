import { useMemo } from 'react';
import { ArrowUpRight, Boxes, Layers3, Rows3 } from 'lucide-react';
import { presetMetadata, getPreset } from '@/lib/presets';
import { useAppStore } from '@/stores/useAppStore';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Primitives';

export function SampleGallery() {
  const addDataset = useAppStore((state) => state.addDataset);
  const setModule = useAppStore((state) => state.setModule);
  const datasets = useAppStore((state) => state.datasets);
  const loadedIds = datasets.map((dataset) => dataset.id);

  const samples = useMemo(
    () =>
      presetMetadata.map((meta) => {
        const dataset = getPreset(meta.name);
        return { meta, dataset };
      }),
    [],
  );

  return (
    <Panel
      title="Sample datasets"
      subtitle="Bundled locally · clearly labeled simulations"
      icon={<Boxes size={14} />}
      actions={<Badge tone="accent">{samples.length} available</Badge>}
    >
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {samples.map(({ meta, dataset }) => {
          const isLoaded = loadedIds.includes(dataset.id);
          return (
            <button
              type="button"
              key={meta.name}
              onClick={() => {
                addDataset(getPreset(meta.name));
                setModule('explorer');
              }}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 text-left transition-all hover:border-[var(--accent-cyan)]/30 hover:bg-[var(--accent-cyan)]/[0.04]"
            >
              <span
                className={`absolute left-0 top-3 h-6 w-[2px] rounded-r ${
                  meta.accent === 'violet' ? 'bg-[var(--accent-violet)]' : meta.accent === 'ice' ? 'bg-ice' : 'bg-[var(--accent-cyan)]'
                }`}
              />
              <div className="flex items-start justify-between gap-2">
                <span className="label">{meta.category}</span>
                <ArrowUpRight size={13} className="text-[#5c6675] transition-colors group-hover:text-[var(--accent-cyan)]" />
              </div>
              <span className="mt-2 block truncate text-[11px] font-semibold text-[#dbe3ec]">{meta.name}</span>
              <span className="mt-1 line-clamp-2 min-h-[28px] text-[10px] leading-tight text-[#6c7685]">
                {meta.description}
              </span>
              <div className="mono mt-3 flex items-center gap-3 text-[9px] text-[#5c6675]">
                <span className="inline-flex items-center gap-1"><Rows3 size={10} /> {dataset.rows.length}</span>
                <span className="inline-flex items-center gap-1"><Layers3 size={10} /> {dataset.columns.length}</span>
                {isLoaded && <Badge tone="success">loaded</Badge>}
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
