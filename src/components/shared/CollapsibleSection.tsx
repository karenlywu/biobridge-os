import { useState, type DragEvent, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  visible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  panelId: string;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
}

function DragHandle() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}

export function CollapsibleSection({
  title,
  subtitle,
  badge,
  visible = true,
  defaultOpen = true,
  children,
  className = '',
  panelId,
  draggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!visible) return null;

  return (
    <section
      data-panel-id={panelId}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
        isDragging
          ? 'border-brand-300 opacity-60 shadow-md ring-2 ring-brand-200'
          : isDropTarget
            ? 'border-brand-400 ring-2 ring-brand-100'
            : 'border-slate-200'
      } ${className}`}
    >
      <div
        className={`flex items-stretch ${open ? 'border-b border-slate-200' : ''} bg-slate-50/90`}
      >
        {draggable && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="flex cursor-grab items-center border-r border-slate-200 px-3 text-slate-400 active:cursor-grabbing hover:bg-slate-100 hover:text-slate-600"
            title="Drag to reorder"
            aria-label={`Drag to reorder ${title}`}
          >
            <DragHandle />
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <span className="shrink-0 text-slate-400" aria-hidden>
            {open ? (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.25 4.24a.75.75 0 010 1.06l-4.25 4.24a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        </button>
      </div>
      {open && <div className="bg-white">{children}</div>}
    </section>
  );
}
