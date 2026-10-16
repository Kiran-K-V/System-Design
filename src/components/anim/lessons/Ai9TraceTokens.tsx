import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { fakeDrop, tokenFields } from './Ai9TraceMath';

function Slider({ id, label, value, max, onChange }: { id: string; label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value}%</span>
      </label>
      <input id={id} type="range" min={0} max={max} step={5} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const n = (v: number) => v.toLocaleString('en-US');

/** Shows how a dashboard that reads only the provider's input count falls when caching turns on. */
export default function Ai9TraceTokens() {
  const [read, setRead] = useState(75);
  const [write, setWrite] = useState(0);
  const f = tokenFields(8000, read / 100, Math.min(write, 100 - read) / 100);
  const drop = fakeDrop(f);
  const rows = [
    { name: 'Fresh input (the provider reports this as the input count)', v: f.wireInput, color: 'var(--accent)' },
    { name: 'Read from cache', v: f.cacheRead, color: 'var(--ok)' },
    { name: 'Written to cache', v: f.cacheWrite, color: 'var(--warn)' },
  ];
  return (
    <CacheWidgetFrame title="The input-token trap" hint="Illustrative: one prompt of 8,000 tokens">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="a9t-read" label="Share of the prompt read from cache" value={read} max={100} onChange={(v) => { setRead(v); if (v + write > 100) setWrite(100 - v); }} />
        <Slider id="a9t-write" label="Share of the prompt written to cache" value={Math.min(write, 100 - read)} max={100 - read} onChange={setWrite} />
      </div>
      <div className="space-y-2 text-sm" aria-live="polite">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="mb-1 flex justify-between gap-3 text-xs text-muted">
              <span>{r.name}</span>
              <span className="tabular-nums text-fg">{n(r.v)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded bg-surface">
              <div className="h-full" style={{ width: `${(r.v / f.total) * 100}%`, background: r.color }} />
            </div>
          </div>
        ))}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border p-3" style={{ borderColor: drop > 0 ? 'var(--bad)' : 'var(--border)' }}>
            <p className="text-xs uppercase tracking-wide text-muted">Dashboard that reads only fresh input</p>
            <p className="mt-1 font-mono text-[15px]">{n(f.wireInput)} tokens</p>
            <p className="mt-1 text-muted">{drop > 0 ? `Looks like a ${Math.round(drop * 100)}% drop in prompt size. Nothing changed but the cache.` : 'Matches the real size, because nothing is cached.'}</p>
          </div>
          <div className="rounded-lg border border-ok p-3" style={{ borderColor: 'var(--ok)' }}>
            <p className="text-xs uppercase tracking-wide text-muted">Total stored in the trace</p>
            <p className="mt-1 font-mono text-[15px]">{n(f.total)} tokens</p>
            <p className="mt-1 text-muted">fresh + read + written = {n(f.wireInput)} + {n(f.cacheRead)} + {n(f.cacheWrite)}</p>
          </div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
