/** Small form pieces shared by the Module 10 widgets. */
export function Slider({ id, label, value, min, max, step = 1, onChange, show }: { id: string; label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; show: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

export function Card({ title, value, note, tone }: { title: string; value: string; note?: string; tone?: 'bad' | 'ok' | 'warn' }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{title}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone === 'bad' ? 'text-bad' : tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : ''}`}>{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}

export const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

/** Human size with decimal units. */
export function bytesFmt(n: number): string {
  const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i = 0;
  while (n >= 1000 && i < u.length - 1) {
    n /= 1000;
    i++;
  }
  return `${n >= 100 ? Math.round(n) : Math.round(n * 10) / 10} ${u[i]}`;
}
