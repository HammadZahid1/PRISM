import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable
  );
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const store = useAppStore.getState();

      if (event.key === 'Escape') {
        if (store.commandOpen) store.setCommandOpen(false);
        if (store.importOpen) store.setImportOpen(false);
        if (store.mobileNavOpen) store.setMobileNav(false);
        return;
      }
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key === 'k') {
        event.preventDefault();
        store.setCommandOpen(!store.commandOpen);
      } else if (key === 'o') {
        event.preventDefault();
        store.setImportOpen(true);
      } else if (key === 'z' && !isTypingTarget(event.target)) {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
      } else if (key === 'y' && !isTypingTarget(event.target)) {
        event.preventDefault();
        store.redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
