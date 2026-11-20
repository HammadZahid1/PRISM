import type { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}

export function Panel({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = '',
  bodyClassName = '',
  flush = false,
}: PanelProps) {
  return (
    <section className={`panel flex min-h-0 flex-col ${className}`}>
      {(title || actions) && (
        <header className="panel-header shrink-0">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && <span className="text-[var(--accent-cyan)]">{icon}</span>}
            <div className="min-w-0">
              {title && <h2 className="truncate text-xs font-semibold tracking-wide text-[#dbe3ec]">{title}</h2>}
              {subtitle && <p className="mt-0.5 truncate text-[10px] text-[#6c7685]">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={`min-h-0 flex-1 ${flush ? '' : 'p-4'} ${bodyClassName}`}>{children}</div>
    </section>
  );
}
