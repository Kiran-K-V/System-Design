import { useState } from 'react';
import { WidgetFrame } from '../data-kit';

interface Inputs {
  posts: number;
  views: number;
  renames: number;
  writeCost: number;
}

const DEFAULTS: Inputs = { posts: 200, views: 500, renames: 2, writeCost: 5 };

const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(Math.round(n)));

function Slider(props: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; hint: string }) {
  return (
    <label className="block">
      <span className="flex justify-between">
        <span>{props.label}</span>
        <span className="font-mono tabular-nums">
          {props.value}
          {props.unit}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(+e.target.value)}
        className="w-full accent-[var(--accent)]"
      />
      <span className="text-xs text-muted">{props.hint}</span>
    </label>
  );
}

export default function NormalizeCost() {
  const [v, setV] = useState<Inputs>(DEFAULTS);
  const set = (k: keyof Inputs) => (n: number) => setV((p) => ({ ...p, [k]: n }));

  // Cost of one author over one year, in "row lookups".
  // Normalized: each view reads the post row and the user row. A rename writes one row.
  // Denormalized: each view reads one row. A rename rewrites every post of that author.
  const totalViews = v.posts * v.views;
  const normReads = 2 * totalViews;
  const normWrites = v.renames * 1;
  const denReads = totalViews;
  const denWrites = v.renames * v.posts;
  const norm = normReads + normWrites * v.writeCost;
  const den = denReads + denWrites * v.writeCost;
  const max = Math.max(norm, den, 1);
  const winner = den < norm ? 'den' : norm < den ? 'norm' : 'tie';

  const rows = [
    { key: 'norm', name: 'Normalized', sub: 'author name lives only in User', reads: normReads, writes: normWrites, cost: norm, color: 'var(--accent)' },
    { key: 'den', name: 'Denormalized', sub: 'author name copied into every Post', reads: denReads, writes: denWrites, cost: den, color: 'var(--warn)' },
  ];

  return (
    <WidgetFrame
      title="Normalize or copy? One author, one year"
      caption={
        <>
          Task: show each post with its author’s name. Raise <b>views per post</b> and the copy wins. Raise <b>renames</b> or <b>posts</b> and the single copy wins. The access pattern decides, not taste.
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[17rem_1fr]">
        <div className="space-y-3 text-sm">
          <Slider label="Posts by this author" value={v.posts} min={10} max={5000} step={10} onChange={set('posts')} hint="rows that hold the author name" />
          <Slider label="Views per post" value={v.views} min={1} max={10000} onChange={set('views')} hint="reads per year" />
          <Slider label="Renames per year" value={v.renames} min={0} max={50} onChange={set('renames')} hint="writes that change the name" />
          <Slider label="A write costs" value={v.writeCost} min={1} max={20} unit="× a read" onChange={set('writeCost')} hint="writes pay for logs, indexes, locks" />
          <button type="button" onClick={() => setV(DEFAULTS)} className="text-xs text-accent hover:underline">
            Reset to example
          </button>
        </div>
        <div className="space-y-5">
          {rows.map((r) => (
            <div key={r.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">
                  {r.name} <span className="font-normal text-muted">· {r.sub}</span>
                </span>
                <span className="font-mono text-sm tabular-nums">{fmt(r.cost)} units</span>
              </div>
              <div className="mt-1 h-5 overflow-hidden rounded bg-surface">
                <div className="h-full rounded transition-[width] duration-300" style={{ width: `${(r.cost / max) * 100}%`, background: r.color }} />
              </div>
              <div className="mt-1 font-mono text-xs text-muted">
                {fmt(r.reads)} row reads + {fmt(r.writes)} row writes × {v.writeCost}
              </div>
            </div>
          ))}
          <p className="text-sm font-medium" aria-live="polite">
            {winner === 'tie'
              ? 'A tie.'
              : winner === 'den'
                ? `Copy the name: ${(norm / den).toFixed(1)}× cheaper. Reads dominate.`
                : `Keep one copy: ${(den / norm).toFixed(1)}× cheaper. Updates dominate.`}
          </p>
        </div>
      </div>
    </WidgetFrame>
  );
}
