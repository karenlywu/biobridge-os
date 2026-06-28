import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  /** When false, the section is not rendered at all. */
  visible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
  /** Card wraps content in a bordered panel; flush only shows a header bar above children. */
  variant?: 'card' | 'flush';
  className?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  badge,
  visible = true,
  defaultOpen = true,
  children,
  variant = 'card',
  className = '',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!visible) return null;

  const header = (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex w-full items-center justify-between gap-3 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
        variant === 'card'
          ? 'rounded-xl px-4 py-3 hover:bg-slate-50'
          : 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm hover:border-slate-300'
      }`}
      aria-expanded={open}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {badge}
        </div>
        {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      <span className="shrink-0 text-xs text-slate-400" aria-hidden>
        {open ? '▼' : '▶'}
      </span>
    </button>
  );

  if (variant === 'flush') {
    return (
      <section className={className}>
        {header}
        {open && <div className="mt-2">{children}</div>}
      </section>
    );
  }

  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {header}
      {open && <div className="border-t border-slate-100 px-4 py-4">{children}</div>}
    </section>
  );
}
