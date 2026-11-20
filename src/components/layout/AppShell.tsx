import { useEffect, type ReactNode } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastStack } from './ToastStack';
import { CommandPalette } from './CommandPalette';
import { ShortcutsDialog } from './ShortcutsDialog';

export function AppShell({ children }: { children: ReactNode }) {
  const hydrate = useAppStore((state) => state.hydrate);
  const mobileNavOpen = useAppStore((state) => state.mobileNavOpen);
  const setMobileNav = useAppStore((state) => state.setMobileNav);
  const settings = useAppStore((state) => state.settings);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

  useKeyboardShortcuts();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.dataset.accent = settings.accent;
    document.documentElement.dataset.density = settings.density;
    document.documentElement.style.setProperty('--surface-grid-opacity', settings.showGrid ? '1' : '0');
  }, [settings.accent, settings.density, settings.showGrid]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNav(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, setMobileNav]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-base">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
          <div className="relative h-full w-[min(280px,86vw)] animate-fade-in shadow-2xl">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          className={`min-h-0 flex-1 overflow-hidden surface-grid transition-[opacity] ${
            settings.showGrid ? '' : '[&]:bg-none'
          }`}
          style={{ backgroundSize: '32px 32px' }}
        >
          <div className={`h-full w-full ${settings.animations ? 'animate-fade-in' : ''}`} key={`${sidebarCollapsed}`}>
            {children}
          </div>
        </main>
      </div>
      <ToastStack />
      <CommandPalette />
      <ShortcutsDialog />
    </div>
  );
}
