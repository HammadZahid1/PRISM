import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  active?: boolean;
  size?: 'sm' | 'md';
}

export function IconButton({
  label,
  icon,
  active = false,
  size = 'md',
  className = '',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
      } ${
        active
          ? 'border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]'
          : 'border-transparent text-[#8a94a3] hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-[#e9edf3]'
      } ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
