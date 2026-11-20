import { Keyboard } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Modal } from '@/components/ui/Modal';
import { NAV_ITEMS } from './Sidebar';

interface ShortcutRow {
  keys: string[];
  label: string;
}

const GLOBAL_SHORTCUTS: ShortcutRow[] = [
  { keys: ['Ctrl', 'K'], label: 'Open the command palette' },
  { keys: ['Ctrl', 'O'], label: 'Import a local data file' },
  { keys: ['Ctrl', 'Z'], label: 'Undo the last data change' },
  { keys: ['Ctrl', 'Shift', 'Z'], label: 'Redo the last undone change' },
  { keys: ['Ctrl', 'Y'], label: 'Redo (alternative)' },
  { keys: ['?'], label: 'Show this shortcut reference' },
  { keys: ['Esc'], label: 'Close dialogs and overlays' },
];

function Key({ children }: { children: string }) {
  return (
    <kbd className="mono inline-flex min-w-[22px] items-center justify-center rounded border border-white/[0.12] bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-[#c6ced9] shadow-[0_1px_0_rgba(0,0,0,0.5)]">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog() {
  const open = useAppStore((state) => state.shortcutsOpen);
  const setOpen = useAppStore((state) => state.setShortcutsOpen);
  const navigation = NAV_ITEMS.filter((item) => item.shortcut).map((item) => ({
    keys: [item.shortcut as string],
    label: `Open ${item.label}`,
  }));

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Keyboard shortcuts"
      subtitle="Work faster without leaving the keyboard"
      icon={<Keyboard size={16} />}
      width="max-w-xl"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h3 className="label mb-2">Global</h3>
          <ul className="space-y-2">
            {GLOBAL_SHORTCUTS.map((shortcut) => (
              <li key={shortcut.label} className="flex items-center justify-between gap-3 text-[11px] text-[#8a94a3]">
                <span>{shortcut.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {shortcut.keys.map((key) => (
                    <Key key={key}>{key === 'Ctrl' ? '⌘/Ctrl' : key}</Key>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="label mb-2">Modules</h3>
          <ul className="space-y-2">
            {navigation.map((shortcut) => (
              <li key={shortcut.label} className="flex items-center justify-between gap-3 text-[11px] text-[#8a94a3]">
                <span>{shortcut.label}</span>
                <Key>{shortcut.keys[0]}</Key>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[10px] leading-relaxed text-[#5c6675]">
            Number shortcuts are ignored while typing in a text field. Use the command palette to reach every module.
          </p>
        </section>
      </div>
    </Modal>
  );
}
