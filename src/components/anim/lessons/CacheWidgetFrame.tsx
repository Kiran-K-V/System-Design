import type { ReactNode } from 'react';

/** Card shell shared by the Module 5 interactive widgets. Same look as AnimFrame, without the stepper. */
export default function CacheWidgetFrame({
  title,
  hint,
  caption,
  children,
}: {
  title: string;
  hint?: string;
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2">
        <span className="text-sm font-medium">{title}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      <div className="px-3 py-4 sm:px-4">{children}</div>
      {caption && <figcaption className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">{caption}</figcaption>}
    </figure>
  );
}

export function Seg<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap overflow-hidden rounded-md border border-line text-xs">
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1.5 ${o.id === value ? 'bg-accent font-semibold text-white' : 'text-muted hover:bg-surface'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
