import { useMemo, useState } from 'react';
import { Crosshair, Focus, Maximize2, Minimize2, Orbit, RotateCcw, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useVisibleRows } from '@/hooks/useVisibleRows';
import { UniverseScene } from './UniverseScene';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge, Field, SegmentedControl, Select, Toggle } from '@/components/ui/Primitives';
import { EmptyState, Notice } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { buildUniverseData } from '@/lib/viz/universe';
import { typeLabel } from '@/lib/data/types';
import { toDisplay } from '@/lib/utils';
import type { UniverseMode } from '@/types';

const MODES: { value: UniverseMode; label: string }[] = [
  { value: 'scatter', label: 'Scatter' },
  { value: 'cluster', label: 'Cluster' },
  { value: 'density', label: 'Density' },
  { value: 'radial', label: 'Radial' },
  { value: 'orbit', label: 'Orbit' },
];

export function UniverseWorkspace() {
  const { dataset, rows } = useVisibleRows();
  const config = useAppStore((state) => state.universeConfig);
  const updateUniverse = useAppStore((state) => state.updateUniverse);
  const updateMapping = useAppStore((state) => state.updateUniverseMapping);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [cameraKey, setCameraKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const data = useMemo(
    () => (dataset ? buildUniverseData(dataset, config, rows) : null),
    [dataset, config, rows],
  );

  if (!dataset || !data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<Orbit size={20} />}
          title="No dataset in the universe"
          description="Load data to map numeric fields into 3D coordinates, size, color and intensity."
        />
      </div>
    );
  }

  const options = dataset.columns.map((column) => (
    <option key={column.id} value={column.id}>
      {column.name} · {typeLabel(column.type)}
    </option>
  ));

  const mappingField = (label: string, key: keyof typeof config.mapping, allowNone = false) => (
    <Field label={label}>
      <Select value={config.mapping[key]} onChange={(event) => updateMapping({ [key]: event.target.value })}>
        {allowNone && <option value="">— auto —</option>}
        {options}
      </Select>
    </Field>
  );

  const activeIndex = hovered ?? selected;
  const activeParticle = activeIndex !== null ? data.particles[activeIndex] : null;

  const scene = (
    <UniverseScene
      data={data}
      config={config}
      hovered={hovered}
      selected={selected}
      onHover={setHovered}
      onSelect={(index) => setSelected(index)}
      cameraKey={cameraKey}
    />
  );

  return (
    <div className={`flex h-full min-h-0 gap-3 p-3 ${fullscreen ? 'fixed inset-0 z-[78] bg-base p-2' : ''}`}>
      <aside className="hidden w-[250px] shrink-0 flex-col gap-3 lg:flex">
        <Panel title="Universe mode" subtitle="Data-driven layouts" icon={<Orbit size={14} />}>
          <SegmentedControl
            className="w-full"
            value={config.mode}
            options={MODES.map((mode) => ({ value: mode.value, label: mode.label }))}
            onChange={(mode) => {
              updateUniverse({ mode });
              setSelected(null);
            }}
          />
          <p className="mt-2 text-[10px] leading-relaxed text-[#6c7685]">
            Modes are visualization techniques applied to the loaded records — not analytical claims.
          </p>
        </Panel>

        <Panel title="Attribute mapping" subtitle="Map columns to visual channels" className="min-h-0 flex-1" bodyClassName="overflow-y-auto p-3">
          <div className="space-y-2.5">
            {mappingField('X coordinate', 'x')}
            {mappingField('Y coordinate', 'y')}
            {mappingField('Z coordinate', 'z')}
            {mappingField('Point size', 'size')}
            {mappingField('Category color', 'color')}
            {mappingField('Intensity', 'intensity')}
            {data.usedFallback && (
              <Notice tone="warning">Fewer than three numeric fields detected; index-based fallback mapping is active.</Notice>
            )}
          </div>
        </Panel>

        <Panel title="Rendering">
          <div className="space-y-2">
            <Field label={`Point size · ${config.pointSize.toFixed(1)}`}>
              <input type="range" min={0.3} max={3} step={0.1} value={config.pointSize} onChange={(event) => updateUniverse({ pointSize: Number(event.target.value) })} className="w-full" />
            </Field>
            <Field label={`Opacity · ${config.opacity.toFixed(2)}`}>
              <input type="range" min={0.15} max={1} step={0.05} value={config.opacity} onChange={(event) => updateUniverse({ opacity: Number(event.target.value) })} className="w-full" />
            </Field>
            <Field label={`Density · ${config.maxPoints} points`}>
              <input type="range" min={200} max={12000} step={200} value={config.maxPoints} onChange={(event) => updateUniverse({ maxPoints: Number(event.target.value) })} className="w-full" />
            </Field>
            <Toggle checked={config.showGrid} onChange={(showGrid) => updateUniverse({ showGrid })} label="Spatial grid" />
            <Toggle checked={config.showConnections} onChange={(showConnections) => updateUniverse({ showConnections })} label="Connect nearby records" />
            <Toggle checked={config.animate} onChange={(animate) => updateUniverse({ animate })} label="Animate orbital modes" />
          </div>
        </Panel>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="label mb-1">Data universe</div>
            <h1 className="text-sm font-semibold text-[#e9edf3]">{dataset.name}</h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge tone="accent">{data.particles.length.toLocaleString()} particles</Badge>
              <Badge>{config.mode} mode</Badge>
              <Badge tone="neutral">{data.categoryColumns.length} category fields</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" icon={<RotateCcw size={12} />} onClick={() => setCameraKey((value) => value + 1)}>Reset camera</Button>
            <IconButton
              label={fullscreen ? 'Exit fullscreen' : 'Fullscreen universe'}
              icon={fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              onClick={() => setFullscreen((value) => !value)}
            />
            {fullscreen && <IconButton label="Close fullscreen" icon={<X size={14} />} onClick={() => setFullscreen(false)} />}
          </div>
        </div>

        <div className="panel relative min-h-0 flex-1 overflow-hidden">
          {scene}
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            <span className="chip"><Crosshair size={10} /> Drag to rotate · scroll to zoom</span>
            <span className="chip">{data.resolvedMapping.x || 'index'} / {data.resolvedMapping.y || 'index'} / {data.resolvedMapping.z || 'index'}</span>
          </div>
        </div>
      </div>

      <aside className="hidden w-[250px] shrink-0 xl:block">
        <Panel title="Point inspector" subtitle="Hover or click a particle" icon={<Crosshair size={14} />} className="h-full">
          {activeParticle ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge tone="accent">Row {activeParticle.rowIndex + 1}</Badge>
                <span className="mono text-[10px] text-[#8a94a3]">{activeParticle.label}</span>
              </div>
              <div
                className="h-1.5 w-full rounded"
                style={{ background: `linear-gradient(90deg, ${activeParticle.color}, transparent)` }}
              />
              {Object.entries(activeParticle.values).slice(0, 14).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-2 border-b border-white/[0.04] pb-1">
                  <span className="truncate text-[10px] text-[#6c7685]">{key}</span>
                  <span className="mono max-w-[110px] truncate text-right text-[10px] text-[#dbe3ec]" title={value}>{toDisplay(value)}</span>
                </div>
              ))}
              {selected !== null && (
                <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Clear selection</Button>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Focus size={20} className="text-[#4d5663]" />
              <p className="text-[10px] leading-relaxed text-[#6c7685]">
                Point attributes and the source record appear here when you inspect a particle.
              </p>
            </div>
          )}
        </Panel>
      </aside>
    </div>
  );
}
