import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, subtitle, icon, children, footer, width = 'max-w-3xl' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    const previous = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      document.querySelector<HTMLElement>('[data-modal-autofocus]')?.focus();
    }, 30);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.clearTimeout(timer);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92vh] w-full ${width} flex-col overflow-hidden rounded-t-xl border border-white/[0.1] bg-[#0e1014] shadow-[0_30px_120px_rgba(0,0,0,0.7)] animate-slide-up sm:rounded-xl`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <span className="text-[var(--accent-cyan)]">{icon}</span>}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-[#e9edf3]">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[11px] text-[#6c7685]">{subtitle}</p>}
            </div>
          </div>
          <IconButton label="Close dialog" onClick={onClose} icon={<X size={15} />} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.07] bg-[#0b0d10]/60 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
