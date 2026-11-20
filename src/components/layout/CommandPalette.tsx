import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChartNoAxesCombined,
  Command,
  CornerDownLeft,
  Database,
  FileUp,
  FilterX,
  Keyboard,
  Redo2,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore, activeDataset, canRedo, canUndo } from '@/stores/useAppStore';
import { NAV_ITEMS } from './Sidebar';
import { CHART_TYPES, autoConfig, chartLabel } from '@/lib/viz/config';
import { Badge } from '@/components/ui/Primitives';

type Category = 'Navigate' | 'Action' | 'Dataset' | 'Visualization' | 'Column';

interface PaletteCommand {
  id: string;
  label: string;
  detail: string;
  category: Category;
  icon: LucideIcon;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useAppStore((state) => state.commandOpen);
  const setOpen = useAppStore((state) => state.setCommandOpen);
  const datasets = useAppStore((state) => state.datasets);
  const visualizations = useAppStore((state) => state.visualizations);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<PaletteCommand[]>(() => {
    const state = useAppStore.getState();
    const dataset = activeDataset(state);
    const items: PaletteCommand[] = [];

    for (const item of NAV_ITEMS) {
      items.push({
        id: `nav-${item.id}`,
        label: item.label,
        detail: `Go to ${item.group.toLowerCase()} workspace`,
        category: 'Navigate',
        icon: item.icon,
        keywords: `${item.group} ${item.id} ${item.shortcut ?? ''}`,
        run: () => state.setModule(item.id),
      });
    }

    items.push(
      {
        id: 'action-import',
        label: 'Import dataset',
        detail: 'Load a local CSV, TSV, or JSON file',
        category: 'Action',
        icon: FileUp,
        keywords: 'upload file open csv json tsv',
        run: () => state.setImportOpen(true),
      },
      {
        id: 'action-shortcuts',
        label: 'Keyboard shortcuts',
        detail: 'Show all global and workspace shortcuts',
        category: 'Action',
        icon: Keyboard,
        keywords: 'help keys hotkeys question mark',
        run: () => state.setShortcutsOpen(true),
      },
      {
        id: 'action-undo',
        label: 'Undo last change',
        detail: 'Restore the previous workspace snapshot',
        category: 'Action',
        icon: Undo2,
        keywords: 'history revert',
        run: () => state.undo(),
      },
      {
        id: 'action-redo',
        label: 'Redo last change',
        detail: 'Reapply a reverted workspace snapshot',
        category: 'Action',
        icon: Redo2,
        keywords: 'history repeat',
        run: () => state.redo(),
      },
      {
        id: 'action-clear-filters',
        label: 'Clear all filters',
        detail: 'Remove filters and reset the table search',
        category: 'Action',
        icon: FilterX,
        keywords: 'reset search query',
        run: () => state.clearFilters(),
      },
      {
        id: 'action-reset',
        label: 'Reset workspace',
        detail: 'Remove all datasets and charts from this session',
        category: 'Action',
        icon: RotateCcw,
        keywords: 'clear empty destroy',
        run: () => {
          state.resetWorkspace();
          state.notify('Workspace reset', 'Session data was cleared.', 'warning');
        },
      },
    );

    if (dataset) {
      const type = (CHART_TYPES.find((item) => item.type === state.settings.defaultChart)?.type ?? 'bar');
      items.push({
        id: 'action-new-chart',
        label: 'Create recommended chart',
        detail: `Build a ${chartLabel(type)} visualization from ${dataset.name}`,
        category: 'Action',
        icon: Sparkles,
        keywords: 'visualization auto add generate',
        run: () => {
          state.addChart(autoConfig(dataset, type));
          state.setModule('studio');
        },
      });

      for (const column of dataset.columns) {
        items.push({
          id: `column-${column.id}`,
          label: `Inspect ${column.name}`,
          detail: `${column.type} column · ${dataset.name}`,
          category: 'Column',
          icon: Table2,
          keywords: `${column.name} ${column.type} field data explore sort`,
          run: () => {
            state.selectDataset(dataset.id);
            state.setModule('explorer');
            state.toggleSort(column.id);
          },
        });
      }
    }

    for (const item of datasets) {
      items.push({
        id: `dataset-${item.id}`,
        label: item.name,
        detail: `${item.rows.length.toLocaleString()} rows · ${item.columns.length} columns`,
        category: 'Dataset',
        icon: Database,
        keywords: 'open switch dataset table',
        run: () => {
          state.selectDataset(item.id);
          state.setModule('explorer');
        },
      });
    }

    for (const chart of visualizations) {
      items.push({
        id: `chart-${chart.id}`,
        label: chart.title,
        detail: `${chartLabel(chart.type)} visualization`,
        category: 'Visualization',
        icon: ChartNoAxesCombined,
        keywords: 'chart open edit select',
        run: () => {
          state.setModule('studio');
          state.selectChart(chart.id);
        },
      });
    }

    return items;
  }, [datasets, visualizations]);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    const filtered = !text
      ? commands
      : commands.filter((command) =>
          `${command.label} ${command.detail} ${command.category} ${command.keywords ?? ''}`
            .toLowerCase()
            .includes(text),
        );
    return filtered.slice(0, 48);
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selected, open, results]);

  if (!open) return null;

  const runCommand = (command: PaletteCommand | undefined) => {
    if (!command) return;
    setOpen(false);
    command.run();
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((value) => (results.length ? (value + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((value) => (results.length ? (value - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(results[selected]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  let lastCategory: Category | null = null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative flex max-h-[68vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-white/[0.1] bg-[#101318] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-4">
          <Search size={16} className="text-[var(--accent-cyan)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search commands, datasets, charts, columns…"
            aria-label="Search commands"
            className="h-12 min-w-0 flex-1 bg-transparent text-[13px] text-[#e9edf3] outline-none placeholder:text-[#5c6675]"
          />
          <Badge tone="neutral">
            <Command size={9} />K
          </Badge>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <div className="text-xs text-[#a2acba]">No matching commands</div>
              <div className="mt-1 text-[10px] text-[#5c6675]">Try a workspace name, dataset, or column.</div>
            </div>
          ) : (
            results.map((command, index) => {
              const showCategory = command.category !== lastCategory;
              lastCategory = command.category;
              const Icon = command.icon;
              const isSelected = index === selected;
              return (
                <div key={command.id}>
                  {showCategory && <div className="label px-2.5 pb-1 pt-2.5">{command.category}</div>}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onMouseEnter={() => setSelected(index)}
                    onClick={() => runCommand(command)}
                    className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                      isSelected ? 'bg-[var(--accent-cyan)]/[0.11] text-[#e9edf3]' : 'text-[#a2acba] hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon size={15} className={isSelected ? 'text-[var(--accent-cyan)]' : 'text-[#6c7685]'} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">{command.label}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-[#6c7685]">{command.detail}</span>
                    </span>
                    {(command.id === 'action-undo' && !canUndo(useAppStore.getState())) ||
                    (command.id === 'action-redo' && !canRedo(useAppStore.getState())) ? (
                      <span className="mono text-[9px] text-[#4b5563]">UNAVAILABLE</span>
                    ) : null}
                    {isSelected && <CornerDownLeft size={12} className="text-[#5c6675]" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-white/[0.07] px-4 py-2 text-[10px] text-[#5c6675]">
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <ArrowUp size={10} />
              <ArrowDown size={10} /> navigate
            </span>
            <span>↵ select</span>
            <span>esc close</span>
          </span>
          <span className="mono">{results.length} RESULTS</span>
        </div>
      </div>
    </div>
  );
}
