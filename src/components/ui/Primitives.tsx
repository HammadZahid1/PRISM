import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'border-white/[0.09] bg-white/[0.04] text-[#8a94a3]',
    accent: 'border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]',
    success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    warning: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
    danger: 'border-red-400/25 bg-red-400/10 text-red-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-[10px] leading-tight text-[#5c6675]">{hint}</span>}
    </label>
  );
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`control w-full min-w-0 ${className}`} {...rest} />;
}

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`control w-full min-w-0 cursor-pointer appearance-none pr-6 ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-1.5 text-left disabled:opacity-40"
    >
      <span className="min-w-0">
        <span className="block truncate text-xs text-[#dbe3ec]">{label}</span>
        {description && <span className="mt-0.5 block text-[10px] leading-tight text-[#6c7685]">{description}</span>}
      </span>
      <span
        className={`relative h-[18px] w-8 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-[var(--accent-cyan)]/50 bg-[var(--accent-cyan)]/25' : 'border-white/10 bg-white/[0.06]'
        }`}
      >
        <span
          className={`absolute top-[2px] h-3 w-3 rounded-full transition-all ${
            checked ? 'left-[16px] bg-[var(--accent-cyan)]' : 'left-[2px] bg-[#6c7685]'
          }`}
        />
      </span>
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded-md border border-white/[0.07] bg-[#0d0f13] p-0.5 ${className}`}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`inline-flex h-6 items-center gap-1.5 rounded px-2 text-[10px] font-medium transition-colors ${
            value === option.value
              ? 'bg-white/[0.09] text-[#e9edf3] shadow-sm'
              : 'text-[#6c7685] hover:text-[#a2acba]'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
