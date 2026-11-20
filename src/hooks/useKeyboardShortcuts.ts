import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { NAV_ITEMS } from '@/components/layout/Sidebar';
import { resolveShortcut } from './shortcutRules';

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const store = useAppStore.getState();
      const action = resolveShortcut(event, store, NAV_ITEMS);
      if (!action) return;

      switch (action.type) {
        case 'close-overlays':
          if (store.commandOpen) store.setCommandOpen(false);
          if (store.importOpen) store.setImportOpen(false);
          if (store.shortcutsOpen) store.setShortcutsOpen(false);
          if (store.mobileNavOpen) store.setMobileNav(false);
          break;
        case 'shortcuts':
          event.preventDefault();
          store.setShortcutsOpen(true);
          break;
        case 'navigate':
          event.preventDefault();
          store.setModule(action.id as Parameters<typeof store.setModule>[0]);
          break;
        case 'command':
          event.preventDefault();
          store.setCommandOpen(!store.commandOpen);
          break;
        case 'import':
          event.preventDefault();
          store.setImportOpen(true);
          break;
        case 'undo':
          event.preventDefault();
          store.undo();
          break;
        case 'redo':
          event.preventDefault();
          store.redo();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
