import { describe, expect, it } from 'vitest';
import { isTypingTarget, resolveShortcut, type OverlayState } from './shortcutRules';
import { pageSlice, toggleSortIndicator } from '@/features/explorer/tableUtils';

const closed: OverlayState = {
  commandOpen: false,
  importOpen: false,
  shortcutsOpen: false,
  mobileNavOpen: false,
};

const navigation = [
  { id: 'dashboard', shortcut: '1' },
  { id: 'explorer', shortcut: '2' },
];

function typingTarget(tagName: string) {
  return { tagName, isContentEditable: false } as unknown as HTMLElement;
}

describe('keyboard shortcut rules', () => {
  it('recognizes typing targets', () => {
    expect(isTypingTarget(typingTarget('INPUT'))).toBe(true);
    expect(isTypingTarget(typingTarget('TEXTAREA'))).toBe(true);
    expect(isTypingTarget(typingTarget('SELECT'))).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true } as unknown as HTMLElement)).toBe(true);
    expect(isTypingTarget(typingTarget('DIV'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });

  it('opens overlays with global shortcuts', () => {
    expect(resolveShortcut({ key: 'k', ctrlKey: true }, closed, navigation)).toEqual({ type: 'command' });
    expect(resolveShortcut({ key: 'O', metaKey: true }, closed, navigation)).toEqual({ type: 'import' });
    expect(resolveShortcut({ key: '?' }, closed, navigation)).toEqual({ type: 'shortcuts' });
  });

  it('only closes overlays when one is open', () => {
    expect(resolveShortcut({ key: 'Escape' }, closed, navigation)).toBeNull();
    expect(resolveShortcut({ key: 'Escape' }, { ...closed, mobileNavOpen: true }, navigation)).toEqual({
      type: 'close-overlays',
    });
  });

  it('resolves module numbers outside text fields', () => {
    expect(resolveShortcut({ key: '2' }, closed, navigation)).toEqual({ type: 'navigate', id: 'explorer' });
    expect(resolveShortcut({ key: '2', target: typingTarget('INPUT') }, closed, navigation)).toBeNull();
  });

  it('handles undo and redo variants', () => {
    expect(resolveShortcut({ key: 'z', ctrlKey: true }, closed, navigation)).toEqual({ type: 'undo' });
    expect(resolveShortcut({ key: 'z', ctrlKey: true, shiftKey: true }, closed, navigation)).toEqual({ type: 'redo' });
    expect(resolveShortcut({ key: 'y', metaKey: true }, closed, navigation)).toEqual({ type: 'redo' });
    expect(resolveShortcut({ key: 'z', ctrlKey: true, target: typingTarget('INPUT') }, closed, navigation)).toBeNull();
  });

  it('ignores unrecognized shortcuts', () => {
    expect(resolveShortcut({ key: 'q' }, closed, navigation)).toBeNull();
    expect(resolveShortcut({ key: 'k' }, closed, navigation)).toBeNull();
  });
});

describe('table utilities', () => {
  it('renders sort indicators', () => {
    expect(toggleSortIndicator()).toBe('↕');
    expect(toggleSortIndicator({ columnId: 'a', direction: 'asc' })).toBe('↑');
    expect(toggleSortIndicator({ columnId: 'a', direction: 'desc' })).toBe('↓');
  });

  it('slices paginated rows', () => {
    const items = [1, 2, 3, 4, 5];
    expect(pageSlice(items, 0, 2)).toEqual([1, 2]);
    expect(pageSlice(items, 2, 2)).toEqual([5]);
    expect(pageSlice(items, 5, 2)).toEqual([]);
  });
});
