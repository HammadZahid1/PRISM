import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`surface-grid flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.09] bg-[#0b0d10]/60 text-center ${
        compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-16'
      }`}
    >
      {icon && (
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--accent-cyan)]/20 bg-[var(--accent-cyan)]/[0.07] text-[var(--accent-cyan)]">
          {icon}
        </div>
      )}
      <div>
        <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-[#dbe3ec]`}>{title}</h3>
        <p className={`mx-auto mt-1 max-w-md leading-relaxed text-[#6c7685] ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {description}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Working' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-[#8a94a3]">
      <Loader2 size={13} className="animate-spin text-[var(--accent-cyan)]" />
      {label}
    </span>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning' | 'error' | 'success';
  children: ReactNode;
}) {
  const tones = {
    info: 'border-[var(--accent-cyan)]/20 bg-[var(--accent-cyan)]/[0.06] text-[#9bdcea]',
    warning: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200',
    error: 'border-red-400/20 bg-red-400/[0.06] text-red-200',
    success: 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200',
  };
  return <div className={`rounded-md border px-3 py-2 text-[11px] leading-relaxed ${tones[tone]}`}>{children}</div>;
}

export function StatTile({
  label,
  value,
  detail,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="panel group relative overflow-hidden px-4 py-3.5 transition-colors hover:border-white/[0.14]">
      <div className="flex items-start justify-between gap-3">
        <span className="label">{label}</span>
        {icon && <span className={accent ? 'text-[var(--accent-cyan)]' : 'text-[#5c6675]'}>{icon}</span>}
      </div>
      <div className={`mono mt-2 text-xl font-medium tracking-tight ${accent ? 'text-[var(--accent-cyan)]' : 'text-[#e9edf3]'}`}>
        {value}
      </div>
      {detail && <div className="mt-1 text-[10px] text-[#6c7685]">{detail}</div>}
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-[var(--accent-cyan)]/[0.045] blur-2xl transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse-soft rounded bg-white/[0.06] ${className}`} />;
}
