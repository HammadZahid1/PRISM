import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/stores/useAppStore';
import type { Toast } from '@/types';

const icons: Record<Toast['tone'], typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const tones: Record<Toast['tone'], string> = {
  info: 'text-[var(--accent-cyan)] border-[var(--accent-cyan)]/25',
  success: 'text-emerald-300 border-emerald-400/25',
  warning: 'text-amber-300 border-amber-400/25',
  error: 'text-red-300 border-red-400/25',
};

export function ToastStack() {
  const toasts = useAppStore((state) => state.toasts);
  const dismiss = useAppStore((state) => state.dismissToast);
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = icons[toast.tone];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex animate-slide-up items-start gap-2.5 rounded-lg border border-white/[0.1] bg-[#14171c]/95 px-3 py-2.5 shadow-[0_14px_40px_rgba(0,0,0,0.5)] backdrop-blur"
          >
            <span className={`mt-0.5 rounded border p-1 ${tones[toast.tone]}`}>
              <Icon size={12} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-[#e9edf3]">{toast.title}</div>
              {toast.detail && <div className="mt-0.5 text-[10px] leading-tight text-[#8a94a3]">{toast.detail}</div>}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
              className="text-[#5c6675] hover:text-[#e9edf3]"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
