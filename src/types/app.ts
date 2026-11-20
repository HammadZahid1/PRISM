export type ModuleId =
  | 'dashboard'
  | 'explorer'
  | 'studio'
  | 'universe'
  | 'statistics'
  | 'patterns'
  | 'transform'
  | 'timeline'
  | 'playground'
  | 'presets'
  | 'export'
  | 'settings';

export type Accent = 'cyan' | 'violet' | 'ice';

export interface Settings {
  accent: Accent;
  sidebarCollapsed: boolean;
  animations: boolean;
  density: 'comfortable' | 'compact';
  defaultChart: string;
  maxTableRows: number;
  universePoints: number;
  persistDatasets: boolean;
  showGrid: boolean;
}

export interface Toast {
  id: string;
  title: string;
  detail?: string;
  tone: 'info' | 'success' | 'warning' | 'error';
  at: number;
}
