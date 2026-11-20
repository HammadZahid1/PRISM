import {
  Activity,
  Boxes,
  ChartNoAxesCombined,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Download,
  GitBranch,
  Grid2X2,
  LayoutDashboard,
  Orbit,
  Settings2,
  Sparkles,
  Table2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ModuleId } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { IconButton } from '@/components/ui/IconButton';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  group: string;
  shortcut?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Workspace', shortcut: '1' },
  { id: 'explorer', label: 'Data Explorer', icon: Table2, group: 'Workspace', shortcut: '2' },
  { id: 'studio', label: 'Visualization Studio', icon: ChartNoAxesCombined, group: 'Workspace', shortcut: '3' },
  { id: 'universe', label: 'Data Universe', icon: Orbit, group: 'Workspace', shortcut: '4' },
  { id: 'statistics', label: 'Statistics', icon: Activity, group: 'Analysis', shortcut: '5' },
  { id: 'patterns', label: 'Pattern Explorer', icon: GitBranch, group: 'Analysis', shortcut: '6' },
  { id: 'timeline', label: 'Timeline', icon: Grid2X2, group: 'Analysis', shortcut: '7' },
  { id: 'transform', label: 'Transformations', icon: Sparkles, group: 'Data' },
  { id: 'playground', label: 'Data Playground', icon: Database, group: 'Data' },
  { id: 'presets', label: 'Presets', icon: Boxes, group: 'Data' },
  { id: 'export', label: 'Export Studio', icon: Download, group: 'Output' },
  { id: 'settings', label: 'Settings', icon: Settings2, group: 'Output' },
];

const GROUPS = ['Workspace', 'Analysis', 'Data', 'Output'];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const module = useAppStore((state) => state.module);
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const setModule = useAppStore((state) => state.setModule);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const setMobileNav = useAppStore((state) => state.setMobileNav);
  const datasetCount = useAppStore((state) => state.datasets.length);
  const chartCount = useAppStore((state) => state.visualizations.length);
  const isCollapsed = collapsed && !mobile;

  const counts: Partial<Record<ModuleId, number>> = {
    explorer: datasetCount,
    studio: chartCount,
  };

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0b0e] transition-[width] duration-200 ${
        mobile ? 'w-[260px]' : isCollapsed ? 'w-[62px]' : 'w-[var(--sidebar-width)]'
      }`}
    >
      <div className={`flex h-[var(--topbar-height)] shrink-0 items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <button
          type="button"
          onClick={() => setModule('dashboard')}
          className="flex min-w-0 items-center gap-2.5"
          aria-label="PRISM dashboard"
        >
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/[0.08]">
            <span className="h-3 w-3 rotate-45 rounded-[2px] bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-violet)] shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
          </span>
          {!isCollapsed && (
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold tracking-[0.24em] text-[#e9edf3]">PRISM</span>
              <span className="block text-[8px] tracking-[0.16em] text-[#5c6675]">DATA STUDIO</span>
            </span>
          )}
        </button>
        {mobile ? (
          <IconButton label="Close navigation" icon={<X size={15} />} onClick={() => setMobileNav(false)} />
        ) : (
          !isCollapsed && (
            <IconButton
              label="Collapse sidebar"
              icon={<ChevronsLeft size={15} />}
              onClick={toggleSidebar}
            />
          )
        )}
      </div>

      {!mobile && isCollapsed && (
        <div className="flex justify-center pb-2">
          <IconButton label="Expand sidebar" icon={<ChevronsRight size={15} />} onClick={toggleSidebar} />
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label="Primary navigation">
        {GROUPS.map((group) => (
          <div key={group} className="mb-4">
            {!isCollapsed && <div className="label mb-1.5 px-2.5">{group}</div>}
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon;
                const active = module === item.id;
                const count = counts[item.id];
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setModule(item.id);
                      if (mobile) setMobileNav(false);
                    }}
                    title={isCollapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] transition-colors ${
                      active
                        ? 'bg-[var(--accent-cyan)]/[0.09] text-[var(--accent-cyan)]'
                        : 'text-[#8791a0] hover:bg-white/[0.045] hover:text-[#dbe3ec]'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    {active && <span className="absolute left-0 top-1.5 h-5 w-[2px] rounded-r bg-[var(--accent-cyan)]" />}
                    <Icon size={15} strokeWidth={active ? 2 : 1.7} className="shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                        {count !== undefined && count > 0 && (
                          <span className="mono rounded bg-white/[0.06] px-1 text-[9px] text-[#6c7685]">{count}</span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`shrink-0 border-t border-white/[0.06] ${isCollapsed ? 'px-2 py-3' : 'px-4 py-3'}`}>
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-[10px] text-[#8a94a3]">Local workspace</div>
              <div className="mono text-[9px] text-[#5c6675]">ALL DATA STAYS LOCAL</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
