import { useMemo } from 'react';
import {
  ChevronRight,
  Command,
  Download,
  Eye,
  Grid2X2,
  Menu,
  Redo2,
  Search,
  Undo2,
  Upload,
} from 'lucide-react';
import { useAppStore, activeDataset, canRedo, canUndo } from '@/stores/useAppStore';
import { NAV_ITEMS } from './Sidebar';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';

export function Topbar() {
  const module = useAppStore((state) => state.module);
  const setMobileNav = useAppStore((state) => state.setMobileNav);
  const setCommandOpen = useAppStore((state) => state.setCommandOpen);
  const setImportOpen = useAppStore((state) => state.setImportOpen);
  const setModule = useAppStore((state) => state.setModule);
  const dataset = useAppStore(activeDataset);
  const search = useAppStore((state) => state.search);
  const setSearch = useAppStore((state) => state.setSearch);
  const undo = useAppStore((state) => state.undo);
  const redo = useAppStore((state) => state.redo);
  const undoable = useAppStore(canUndo);
  const redoable = useAppStore(canRedo);
  const inspectorOpen = useAppStore((state) => state.inspectorOpen);
  const setInspectorOpen = useAppStore((state) => state.setInspectorOpen);
  const showGrid = useAppStore((state) => state.settings.showGrid);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const moduleLabel = useMemo(() => NAV_ITEMS.find((item) => item.id === module)?.label ?? module, [module]);

  return (
    <header className="flex h-[var(--topbar-height)] shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0b0c0f]/90 px-3 backdrop-blur md:px-4">
      <IconButton label="Open navigation" icon={<Menu size={16} />} className="lg:hidden" onClick={() => setMobileNav(true)} />

      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden text-[11px] text-[#5c6675] sm:block">Workspace</span>
        <ChevronRight size={12} className="hidden text-[#404855] sm:block" />
        <button
          type="button"
          onClick={() => setModule('dashboard')}
          className="truncate text-xs font-medium text-[#dbe3ec] hover:text-[var(--accent-cyan)]"
        >
          {moduleLabel}
        </button>
        {dataset && (
          <>
            <ChevronRight size={12} className="hidden text-[#404855] md:block" />
            <button
              type="button"
              onClick={() => setModule('explorer')}
              className="hidden max-w-[180px] truncate text-[11px] text-[#8a94a3] hover:text-[#e9edf3] md:block"
              title={dataset.name}
            >
              {dataset.name}
            </button>
            <Badge tone="accent" className="hidden xl:inline-flex">
              {dataset.rows.length.toLocaleString()} rows
            </Badge>
          </>
        )}
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-1.5">
        <label className="relative hidden md:block">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5c6675]" />
          <input
            className="control w-44 pl-8 lg:w-56"
            placeholder="Search rows…"
            aria-label="Search dataset rows"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={!dataset}
          />
        </label>
        <IconButton label="Undo (Ctrl+Z)" icon={<Undo2 size={14} />} onClick={undo} disabled={!undoable} />
        <IconButton label="Redo (Ctrl+Shift+Z)" icon={<Redo2 size={14} />} onClick={redo} disabled={!redoable} />
        <div className="mx-1 hidden h-5 w-px bg-white/[0.08] sm:block" />
        <IconButton
          label="Toggle inspector"
          icon={<Eye size={14} />}
          active={inspectorOpen}
          onClick={() => setInspectorOpen(!inspectorOpen)}
        />
        <IconButton
          label="Toggle grid background"
          icon={<Grid2X2 size={14} />}
          active={showGrid}
          onClick={() => updateSettings({ showGrid: !showGrid })}
          className="hidden sm:inline-flex"
        />
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden h-8 items-center gap-2 rounded-md border border-white/[0.08] bg-[#14171c] px-2.5 text-[10px] text-[#8a94a3] transition-colors hover:border-white/[0.16] hover:text-[#e9edf3] sm:inline-flex"
          aria-label="Open command palette"
        >
          <Command size={12} />
          <span className="mono">⌘K</span>
        </button>
        <Button size="sm" icon={<Upload size={13} />} onClick={() => setImportOpen(true)} className="hidden sm:inline-flex">
          Import
        </Button>
        <IconButton
          label="Export studio"
          icon={<Download size={14} />}
          onClick={() => setModule('export')}
        />
      </div>
    </header>
  );
}
