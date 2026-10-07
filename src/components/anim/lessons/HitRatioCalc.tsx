import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';

const PRESETS = [0.5, 0.8, 0.9, 0.95, 0.99, 0.999];

export default function HitRatioCalc() {
  const [hit, setHit] = useState(0.9);
  const [cacheMs, setCacheMs] = useState(0.5);
  const [dbMs, setDbMs] = useState(10);
  const [qps, setQps] = useState(20000);

  // A miss pays the cache lookup first, then the database read, then a cache write (ignored here: it is off the critical path in many designs).
  const missMs = cacheMs + dbMs;
  const avg = hit * cacheMs + (1 - hit) * missMs;
  const noCache = dbMs;
  const dbLoad = qps * (1 - hit);
  const p99 = 1 - hit > 0.01 ? missMs : cacheMs;

  const W = 360;
  const H = 170;
  const P = { l: 44, r: 10, t: 10, b: 30 };
  const yMax = Math.max(noCache, missMs) * 1.05;
  const x = (h: number) => P.l + h * (W - P.l - P.r);
  const y = (ms: number) => H - P.b - (ms / yMax) * (H - P.t - P.b);
  const curve = Array.from({ length: 101 }, (_, i) => {
    const h = i / 100;
    return `${x(h).toFixed(1)},${y(h * cacheMs + (1 - h) * missMs).toFixed(1)}`;
  }).join(' ');

  return (
    <CacheWidgetFrame
      title="Hit ratio calculator"
      hint="average latency = hit × cache + miss × (cache + database)"
      caption={
        <>
          Set the hit ratio to 90%, then 99%. The average barely moves (from ~1.5 ms to ~0.6 ms) but the database load drops 10 times. Now look at
          p99: while more than 1% of reads miss, the slowest 1% of users still pay the full database price. Hit ratio protects the database first and
          the average second.
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_15rem]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Average latency versus hit ratio">
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={P.l} x2={W - P.r} y1={y(f * yMax)} y2={y(f * yMax)} stroke="var(--border)" />
              <text x={P.l - 5} y={y(f * yMax) + 4} textAnchor="end" fontSize={10} fill="var(--muted)">
                {(f * yMax).toFixed(yMax > 20 ? 0 : 1)} ms
              </text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((h) => (
            <text key={h} x={x(h)} y={H - P.b + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">
              {h * 100}%
            </text>
          ))}
          <text x={(P.l + W - P.r) / 2} y={H - 3} textAnchor="middle" fontSize={10} fill="var(--muted)">
            hit ratio
          </text>
          <line x1={P.l} x2={W - P.r} y1={y(noCache)} y2={y(noCache)} stroke="var(--bad)" strokeDasharray="4 3" />
          <text x={P.l + 4} y={y(noCache) - 4} textAnchor="start" fontSize={10} fill="var(--bad)">
            no cache: {noCache} ms
          </text>
          <polyline points={curve} fill="none" stroke="var(--accent)" strokeWidth={2} />
          <line x1={x(hit)} x2={x(hit)} y1={P.t} y2={H - P.b} stroke="var(--muted)" strokeDasharray="3 3" />
          <circle cx={x(hit)} cy={y(avg)} r={5} fill="var(--accent)" />
        </svg>

        <div className="space-y-3 text-sm">
          <Slider label="Hit ratio" value={`${(hit * 100).toFixed(1)}%`} min={0} max={0.999} step={0.001} v={hit} on={setHit} />
          <Slider label="Cache latency" value={`${cacheMs} ms`} min={0.1} max={2} step={0.1} v={cacheMs} on={setCacheMs} />
          <Slider label="Database latency" value={`${dbMs} ms`} min={2} max={50} step={1} v={dbMs} on={setDbMs} />
          <Slider label="Read traffic" value={`${qps.toLocaleString('en-US')}/s`} min={1000} max={100000} step={1000} v={qps} on={setQps} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Hit ratio presets">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setHit(p)}
            className={`rounded-md border px-2.5 py-1 text-xs ${Math.abs(hit - p) < 0.0005 ? 'border-accent bg-accent text-white' : 'border-line hover:bg-surface'}`}
          >
            {p * 100}%
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <Out label="Average latency" value={`${avg.toFixed(2)} ms`} sub={`${(noCache / avg).toFixed(1)}x faster than none`} tone="ok" />
        <Out label="p99 latency" value={`${p99.toFixed(1)} ms`} sub={1 - hit > 0.01 ? 'a miss (≥1% miss)' : 'a hit (<1% miss)'} tone={1 - hit > 0.01 ? 'bad' : 'ok'} />
        <Out label="Database reads" value={`${Math.round(dbLoad).toLocaleString('en-US')}/s`} sub={`was ${qps.toLocaleString('en-US')}/s`} />
        <Out label="Database load" value={`${((1 - hit) * 100).toFixed(1)}%`} sub="of no-cache load" />
      </div>
    </CacheWidgetFrame>
  );
}

function Slider({ label, value, min, max, step, v, on }: { label: string; value: string; min: number; max: number; step: number; v: number; on: (n: number) => void }) {
  return (
    <label className="block">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
    </label>
  );
}

function Out({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="rounded-lg border border-line px-2 py-2">
      <div className={`text-xl font-semibold tabular-nums ${tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : ''}`}>{value}</div>
      <div className="text-xs">{label}</div>
      <div className="text-[0.7rem] text-muted">{sub}</div>
    </div>
  );
}
