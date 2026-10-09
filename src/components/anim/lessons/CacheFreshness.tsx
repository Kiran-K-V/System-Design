import { useState } from 'react';
import { WidgetFrame } from '../data-kit';
import { decide, human, lifetime, type Directives, type Outcome } from './cacheFresh';

/** Widget: slide the age of a cached response and see what a CDN (shared cache) and a browser (private cache) do. */

const PRESETS: { name: string; d: Directives; header: string }[] = [
  { name: 'Hashed static file', d: { maxAge: 31_536_000, sMaxAge: null, swr: 0, sie: 0 }, header: 'Cache-Control: max-age=31536000, immutable' },
  { name: 'Public API', d: { maxAge: 0, sMaxAge: 60, swr: 30, sie: 300 }, header: 'Cache-Control: max-age=0, s-maxage=60, stale-while-revalidate=30, stale-if-error=300' },
  { name: 'Short TTL', d: { maxAge: 60, sMaxAge: null, swr: 0, sie: 0 }, header: 'Cache-Control: max-age=60' },
];

const OUTCOME_TEXT: Record<Outcome, { label: string; tone: string; text: string }> = {
  fresh: { label: 'HIT (fresh)', tone: 'var(--ok)', text: 'Served from cache. The origin is not called.' },
  'stale-while-revalidate': { label: 'HIT (stale, revalidating)', tone: 'var(--warn)', text: 'Served stale at once. A background request refreshes the copy. The user does not wait.' },
  'stale-if-error': { label: 'STALE served on error', tone: 'var(--warn)', text: 'The cache asked the origin, got an error, and served the stale copy inside the stale-if-error window.' },
  revalidate: { label: 'MISS (stale)', tone: 'var(--bad)', text: 'Stale and out of window. The user waits while the cache asks the origin.' },
  error: { label: 'ERROR to user', tone: 'var(--bad)', text: 'Origin is down and the copy is too old for stale-if-error. The user gets the error.' },
};

const COLORS = { fresh: 'var(--ok)', swr: 'var(--warn)', sie: 'var(--accent)' };

function Bar({ d, shared, age, total }: { d: Directives; shared: boolean; age: number; total: number }) {
  const life = lifetime(d, shared);
  const pct = (v: number) => `${Math.min(100, (v / total) * 100)}%`;
  const swrEnd = life + d.swr;
  const sieEnd = life + Math.max(d.sie, d.swr);
  return (
    <div className="relative mt-1 h-6 overflow-hidden rounded bg-surface" role="img" aria-label={`Freshness timeline, ${shared ? 'shared' : 'private'} cache`}>
      <div className="absolute inset-y-0 left-0" style={{ width: pct(life), background: COLORS.fresh, opacity: 0.85 }} />
      <div className="absolute inset-y-0" style={{ left: pct(life), width: pct(d.swr), background: COLORS.swr, opacity: 0.85 }} />
      <div className="absolute inset-y-0" style={{ left: pct(swrEnd), width: pct(Math.max(0, sieEnd - swrEnd)), background: COLORS.sie, opacity: 0.6 }} />
      <div className="absolute inset-y-0" style={{ left: pct(age), width: 3, background: 'var(--fg)' }} />
    </div>
  );
}

export default function CacheFreshness() {
  const [p, setP] = useState(1);
  const [d, setD] = useState<Directives>(PRESETS[1].d);
  const [age, setAge] = useState(75);
  const [down, setDown] = useState(false);

  const lifeS = lifetime(d, true);
  const lifeP = lifetime(d, false);
  const total = Math.max(1, Math.max(lifeS, lifeP) + Math.max(d.swr, d.sie)) * 1.15;
  const step = Math.max(1, Math.round(total / 400));
  const a = Math.min(age, Math.round(total));

  const pick = (i: number) => {
    setP(i);
    setD(PRESETS[i].d);
    const t = Math.max(1, Math.max(lifetime(PRESETS[i].d, true), lifetime(PRESETS[i].d, false)) + Math.max(PRESETS[i].d.swr, PRESETS[i].d.sie)) * 1.15;
    setAge(Math.round(t * 0.4));
  };

  const rows: { who: string; shared: boolean }[] = [
    { who: 'CDN edge (shared cache)', shared: true },
    { who: 'Browser (private cache)', shared: false },
  ];

  return (
    <WidgetFrame
      title="Freshness: what does each cache do at this age?"
      caption={
        <>
          A shared cache obeys <code>s-maxage</code> when present. A private cache ignores it. With the Public API preset, the browser's copy is stale at once (<code>max-age=0</code>), so the browser checks back, usually
          with the CDN. The CDN absorbs those checks: for 60 s it answers without calling the origin.
          </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((x, i) => (
          <button key={x.name} type="button" onClick={() => pick(i)} className={`rounded-md border px-3 py-1 text-sm ${i === p ? 'border-accent bg-accent-soft font-semibold' : 'border-line hover:bg-surface'}`}>
            {x.name}
          </button>
        ))}
      </div>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-surface px-3 py-2 font-mono text-xs leading-relaxed">{PRESETS[p].header}</pre>

      <label className="mt-4 block text-sm">
        <span className="flex justify-between">
          <span>Age of the stored response</span>
          <span className="font-mono tabular-nums">{human(a)} ({a} s)</span>
        </span>
        <input type="range" min={0} max={Math.round(total)} step={step} value={a} onChange={(e) => setAge(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={down} onChange={(e) => setDown(e.target.checked)} className="accent-[var(--accent)]" />
        <span>Origin is down (returns 503)</span>
      </label>

      <div className="mt-4 space-y-4">
        {rows.map((r) => {
          const res = decide(d, r.shared, a, down);
          const o = OUTCOME_TEXT[res.outcome];
          return (
            <div key={r.who} data-testid={r.shared ? 'shared' : 'private'}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">
                  {r.who} <span className="text-xs font-normal text-muted">lifetime {human(lifetime(d, r.shared))}</span>
                </span>
                <span className="font-mono text-xs font-semibold" style={{ color: o.tone }} data-testid="outcome">
                  {o.label}
                </span>
              </div>
              <Bar d={d} shared={r.shared} age={a} total={total} />
              <p className="mt-1 text-sm text-muted">{o.text}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
        <span><span style={{ display: 'inline-block', width: 12, height: 8, borderRadius: 2, marginRight: 4, background: COLORS.fresh }} />fresh</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 8, borderRadius: 2, marginRight: 4, background: COLORS.swr }} />stale-while-revalidate</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 8, borderRadius: 2, marginRight: 4, background: COLORS.sie }} />stale-if-error only</span>
      </div>
    </WidgetFrame>
  );
}
