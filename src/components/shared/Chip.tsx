import type { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  color?: 'default' | 'brand' | 'warning' | 'schema';
}

const colors = {
  default: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-100 text-brand-700',
  warning: 'bg-amber-100 text-amber-800',
  schema: 'bg-violet-100 text-violet-800',
};

export function Chip({ children, onRemove, color = 'default' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full hover:bg-black/10 focus:outline-none focus:ring-1"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
