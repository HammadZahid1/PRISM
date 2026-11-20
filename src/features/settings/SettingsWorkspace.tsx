import { useEffect, useRef, useState } from 'react';
import {
  Database,
  Download,
  FileUp,
  Gauge,
  Keyboard,
  Palette,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/Button';
import { Badge, Field, SegmentedControl, Select, Toggle } from '@/components/ui/Primitives';
import { Notice, StatTile } from '@/components/ui/Feedback';
import { Panel } from '@/components/ui/Panel';
import { CHART_TYPES } from '@/lib/viz/config';
import { formatBytes } from '@/lib/utils';
import { estimateStorageUsage, type StorageUsage } from '@/lib/storage/usage';
import {
  createWorkspaceBackup,
  downloadWorkspaceBackup,
  readWorkspaceBackup,
} from '@/lib/storage/workspace';
import type { Accent } from '@/types';

type PendingAction = 'reset' | 'clear' | null;

export function SettingsWorkspace() {
  const settings = useAppStore((state) => state.settings);
  const datasets = useAppStore((state) => state.datasets);
  const charts = useAppStore((state) => state.visualizations);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const resetSettings = useAppStore((state) => state.resetSettings);
  const resetWorkspace = useAppStore((state) => state.resetWorkspace);
  const clearSavedData = useAppStore((state) => state.clearSavedData);
  const restoreWorkspace = useAppStore((state) => state.restoreWorkspace);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void estimateStorageUsage(datasets, charts).then((result) => {
      if (active) setUsage(result);
    });
    return () => {
      active = false;
    };
  }, [datasets, charts]);

  const exportBackup = () => {
    downloadWorkspaceBackup(createWorkspaceBackup(datasets, charts, settings));
    useAppStore.getState().recordActivity('Backup exported', `${datasets.length} datasets · ${charts.length} charts`, 'export');
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      restoreWorkspace(await readWorkspaceBackup(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the backup file.');
    }
  };

  const usedPercent = usage && usage.quota > 0 ? Math.min(100, (usage.usage / usage.quota) * 100) : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="label mb-1">Settings</div>
          <h1 className="text-base font-semibold text-[#e9edf3]">Workspace preferences</h1>
          <p className="mt-1 text-[11px] text-[#6c7685]">Everything is stored on this device. PRISM never sends your data to a server.</p>
        </div>
        <Badge tone="success">
          <ShieldCheck size={10} /> Local only
        </Badge>
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-2">
        <Panel title="Appearance" subtitle="Tune the interface to your workflow" icon={<Palette size={14} />}>
          <div className="space-y-4">
            <Field label="Accent color">
              <SegmentedControl<Accent>
                value={settings.accent}
                options={[
                  { value: 'cyan', label: 'Cyan' },
                  { value: 'violet', label: 'Violet' },
                  { value: 'ice', label: 'Ice' },
                ]}
                onChange={(accent) => updateSettings({ accent })}
                className="w-full"
              />
            </Field>
            <Field label="Interface density">
              <SegmentedControl
                value={settings.density}
                options={[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'compact', label: 'Compact' },
                ]}
                onChange={(density) => updateSettings({ density })}
                className="w-full"
              />
            </Field>
            <div className="space-y-1 divide-y divide-white/[0.05]">
              <Toggle
                checked={settings.animations}
                onChange={(animations) => updateSettings({ animations })}
                label="Interface animations"
                description="Fade workspace transitions when navigating."
              />
              <Toggle
                checked={settings.showGrid}
                onChange={(showGrid) => updateSettings({ showGrid })}
                label="Background grid"
                description="Show the subtle technical grid behind workspaces."
              />
            </div>
            <Button size="sm" icon={<Keyboard size={12} />} onClick={resetSettings}>Restore default preferences</Button>
          </div>
        </Panel>

        <Panel title="Data & performance" subtitle="Defaults for new charts and large datasets" icon={<Gauge size={14} />}>
          <div className="space-y-4">
            <Field label="Default chart type" hint="Used by the command palette and quick-create actions.">
              <Select value={settings.defaultChart} onChange={(event) => updateSettings({ defaultChart: event.target.value })}>
                {CHART_TYPES.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.label} — {item.hint}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Maximum table rows" hint="Caps the page-size choices in the data explorer.">
              <Select
                value={settings.maxTableRows}
                onChange={(event) => updateSettings({ maxTableRows: Number(event.target.value) })}
              >
                {[1000, 10000, 50000, 200000].map((value) => (
                  <option key={value} value={value}>
                    {value.toLocaleString()} rows
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={`Universe point budget: ${settings.universePoints.toLocaleString()}`}
              hint="Lower values keep 3D rendering responsive on integrated GPUs."
            >
              <input
                type="range"
                min={500}
                max={20000}
                step={500}
                value={settings.universePoints}
                onChange={(event) => updateSettings({ universePoints: Number(event.target.value) })}
                className="h-1.5 w-full cursor-pointer accent-[var(--accent-cyan)]"
              />
            </Field>
            <div className="space-y-1 divide-y divide-white/[0.05]">
              <Toggle
                checked={settings.persistDatasets}
                onChange={(persistDatasets) => updateSettings({ persistDatasets })}
                label="Persist datasets locally"
                description="Save imported datasets to IndexedDB for the next session."
              />
            </div>
          </div>
        </Panel>

        <Panel title="Local storage" subtitle="Inspect and manage browser storage" icon={<Database size={14} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="Datasets" value={datasets.length} />
              <StatTile label="Charts" value={charts.length} />
              <StatTile label="In use" value={usage ? formatBytes(usage.usage) : '…'} />
            </div>
            {usedPercent !== null && (
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-[#6c7685]">
                  <span>Browser quota</span>
                  <span className="mono">{usedPercent.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-[var(--accent-cyan)]" style={{ width: `${Math.max(1, usedPercent)}%` }} />
                </div>
                <p className="mt-1.5 text-[10px] text-[#5c6675]">
                  Quota: {formatBytes(usage?.quota ?? 0)} {usage?.estimated ? '· estimated locally' : '· reported by browser'}
                </p>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button icon={<Download size={13} />} onClick={exportBackup}>Export backup</Button>
              <Button icon={<Upload size={13} />} onClick={() => fileRef.current?.click()}>Restore backup</Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  void importBackup(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="space-y-2 rounded-md border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="label">Destructive actions</div>
              {pending === null ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" icon={<Trash2 size={12} />} onClick={() => setPending('reset')}>Reset session</Button>
                  <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => setPending('clear')}>Clear saved data</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Notice tone="warning">
                    {pending === 'reset'
                      ? 'Remove all datasets and charts from the current session? This can be undone with Ctrl+Z.'
                      : 'Permanently delete all locally saved datasets, charts, and preferences? This cannot be undone.'}
                  </Notice>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (pending === 'reset') resetWorkspace();
                        else void clearSavedData();
                        setPending(null);
                      }}
                    >
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Keyboard shortcuts" subtitle="Work at keyboard speed" icon={<Keyboard size={14} />}>
          <div className="grid gap-1.5 text-[11px]">
            {[
              ['Ctrl / ⌘ + K', 'Open command palette'],
              ['Ctrl / ⌘ + O', 'Import a local dataset'],
              ['Ctrl / ⌘ + Z', 'Undo the last change'],
              ['Ctrl / ⌘ + Shift + Z', 'Redo the last change'],
              ['Ctrl / ⌘ + Y', 'Redo the last change'],
              ['1 – 7', 'Switch primary workspaces'],
              ['Esc', 'Close dialogs and navigation'],
            ].map(([keys, description]) => (
              <div key={keys} className="flex items-center justify-between gap-3 rounded border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5">
                <span className="text-[#8a94a3]">{description}</span>
                <kbd className="mono rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-[#b8c2cf]">{keys}</kbd>
              </div>
            ))}
            <div className="mt-2 flex items-start gap-2 text-[10px] leading-relaxed text-[#5c6675]">
              <FileUp size={13} className="mt-0.5 shrink-0" />
              No account, API key, or network connection is required for any PRISM feature.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
