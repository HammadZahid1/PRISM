import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  active?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--accent-cyan)] text-[#041014] font-semibold hover:brightness-110 shadow-[0_0_18px_rgba(34,211,238,0.18)]',
  secondary: 'bg-[#14171c] text-[#dbe3ec] border border-white/[0.09] hover:border-white/[0.2] hover:bg-[#191d24]',
  ghost: 'bg-transparent text-[#9aa5b4] hover:bg-white/[0.06] hover:text-[#e9edf3]',
  danger: 'bg-[#3a1b1e] text-[#fca5a5] border border-[#7f2d2d]/60 hover:bg-[#4a2225]',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[11px] gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-xs gap-2 rounded-md',
  lg: 'h-10 px-4 text-sm gap-2 rounded-lg',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  active = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${active ? 'ring-1 ring-[var(--accent-cyan)]' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
