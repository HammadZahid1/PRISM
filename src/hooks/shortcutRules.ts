export interface OverlayState {
  commandOpen: boolean;
  importOpen: boolean;
  shortcutsOpen: boolean;
  mobileNavOpen: boolean;
}

export interface ShortcutEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget | null;
}

export type ShortcutAction =
  | { type: 'close-overlays' }
  | { type: 'shortcuts' }
  | { type: 'navigate'; id: string }
  | { type: 'command' }
  | { type: 'import' }
  | { type: 'undo' }
  | { type: 'redo' };

export function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable
  );
}

export function resolveShortcut(
  event: ShortcutEvent,
  state: OverlayState,
  navigation: { id: string; shortcut?: string }[],
): ShortcutAction | null {
  if (event.key === 'Escape') {
    const anyOpen = state.commandOpen || state.importOpen || state.shortcutsOpen || state.mobileNavOpen;
    return anyOpen ? { type: 'close-overlays' } : null;
  }

  const mod = Boolean(event.metaKey || event.ctrlKey);
  const typing = isTypingTarget(event.target ?? null);

  if (!mod && !typing) {
    if (event.key === '?') return { type: 'shortcuts' };
    const destination = navigation.find((item) => item.shortcut === event.key);
    if (destination) return { type: 'navigate', id: destination.id };
    return null;
  }

  if (!mod || typing && event.key.toLowerCase() !== 'k' && event.key.toLowerCase() !== 'o') return null;

  const key = event.key.toLowerCase();
  if (key === 'k') return { type: 'command' };
  if (key === 'o') return { type: 'import' };
  if (key === 'z' && !typing) return event.shiftKey ? { type: 'redo' } : { type: 'undo' };
  if (key === 'y' && !typing) return { type: 'redo' };
  return null;
}
