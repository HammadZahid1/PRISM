import { useMemo, useState } from 'react';
import { Boxes, Layers3, Rows3, Search } from 'lucide-react';
import { getPreset, presetMetadata } from '@/lib/presets';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Badge, TextInput } from '@/components/ui/Primitives';
import { Panel } from '@/components/ui/Panel';
import { formatNumber } from '@/lib/utils';

export function PresetLibrary() {
  const addDataset = useAppStore((state) => state.addDataset);
  const setModule = useAppStore((state) => state.setModule);
  const datasets = useAppStore((state) => state.datasets);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const samples = useMemo(
    () =>
      presetMetadata.map((meta) => {
        const dataset = getPreset(meta.name);
        return {
          meta,
          dataset,
          numeric: dataset.columns.filter((column) => column.type === 'number').length,
          categorical: dataset.columns.filter((column) => column.type !== 'number').length,
        };
      }),
    [],
  );

  const categories = ['All', ...new Set(presetMetadata.map((item) => item.category))];
  const filtered = samples.filter(({ meta, dataset }) => {
    const matchesQuery = `${meta.name} ${meta.description} ${dataset.columns.map((column) => column.name).join(' ')}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = category === 'All' || meta.category === category;
    return matchesQuery && matchesCategory;
  });

  const load = (name: string) => {
    addDataset(getPreset(name));
    setModule('explorer');
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="label mb-1">Preset library</div>
          <h1 className="text-sm font-semibold text-[#e9edf3]">Explore bundled datasets</h1>
          <p className="mt-0.5 text-[10px] text-[#6c7685]">
            Simulated and illustrative datasets are clearly labeled. All are generated locally.
          </p>
        </div>
        <Badge tone="accent">{presetMetadata.length} datasets</Badge>
      </div>

      <Panel flush title="Dataset catalog" subtitle="One-click loading into the workspace" icon={<Boxes size={14} />}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-3">
          <label className="relative min-w-[200px] flex-1">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5c6675]" />
            <TextInput className="pl-8" placeholder="Search datasets or columns" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-1">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={`chip transition-colors ${category === item ? 'border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)]' : 'hover:text-[#e9edf3]'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map(({ meta, dataset, numeric, categorical }) => {
            const loaded = datasets.some((item) => item.id === dataset.id);
            return (
              <article
                key={meta.name}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#0e1014] p-4 transition-colors hover:border-[var(--accent-cyan)]/30"
              >
                <div
                  className={`absolute left-0 top-4 h-8 w-[2px] rounded-r ${
                    meta.accent === 'violet' ? 'bg-[var(--accent-violet)]' : meta.accent === 'ice' ? 'bg-ice' : 'bg-[var(--accent-cyan)]'
                  }`}
                />
                <div className="flex items-start justify-between gap-2">
                  <Badge>{meta.category}</Badge>
                  {loaded && <Badge tone="success">loaded</Badge>}
                </div>
                <h2 className="mt-3 text-xs font-semibold text-[#e9edf3]">{meta.name}</h2>
                <p className="mt-1.5 flex-1 text-[10px] leading-relaxed text-[#6c7685]">{meta.description}</p>
                <p className="mt-2 line-clamp-2 text-[9px] text-[#5c6675]">{dataset.description}</p>
                <div className="mono mt-3 flex flex-wrap items-center gap-3 text-[9px] text-[#8a94a3]">
                  <span className="inline-flex items-center gap-1"><Rows3 size={10} /> {formatNumber(dataset.rows.length, 0)}</span>
                  <span className="inline-flex items-center gap-1"><Layers3 size={10} /> {dataset.columns.length}</span>
                  <span>{numeric} num</span>
                  <span>{categorical} cat</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="primary" className="flex-1" onClick={() => load(meta.name)}>
                    Load dataset
                  </Button>
                  <Button size="sm" onClick={() => { load(meta.name); setModule('universe'); }} title="Load and open in Data Universe">
                    3D
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-[11px] text-[#6c7685]">No preset datasets match this search.</p>
        )}
      </Panel>
    </div>
  );
}
