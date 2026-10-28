import { useState } from 'react';
import { HORIZON_S, MAX_BATCH, STEP_BASE_MS, STEP_PER_SEQ_MS, SWEEP, type SimResult } from './AiE3BatchLogic';

const W = 320;
const H = 190;
const PAD = { l: 44, r: 12, t: 14, b: 32 };
const LOADS = SWEEP.map((p) => p.load);
const X_MAX = LOADS[LOADS.length - 1];
const fx = (load: number) => PAD.l + (load / X_MAX) * (W - PAD.l - PAD.r);

function Chart({ title, unit, pick, log, yMax, yMin, ticks, sel }: { title: string; unit: string; pick: (r: SimResult) => number; log?: boolean; yMax: number; yMin: number; ticks: number[]; sel: number }) {
  const fy = (v: number) => {
    const t = log ? (Math.log10(Math.max(v, yMin)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin)) : (v - yMin) / (yMax - yMin);
    return H - PAD.b - Math.min(1, Math.max(0, t)) * (H - PAD.t - PAD.b);
  };
  const line = (key: 'stat' | 'cont') => SWEEP.map((p, i) => `${i ? 'L' : 'M'}${fx(p.load).toFixed(1)} ${fy(pick(p[key])).toFixed(1)}`).join(' ');
  return (
    <div>
      <p className="mb-1 text-xs font-medium">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title}: static batching and continuous batching against load`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={fy(t)} y2={fy(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.l - 6} y={fy(t) + 4} textAnchor="end" fontSize={13} fill="var(--muted)">{t >= 1000 ? `${t / 1000}k` : t}</text>
          </g>
        ))}
        {[0.5, 1, 1.5, 2, 2.5, 3].map((x) => (
          <text key={x} x={fx(x)} y={H - 14} textAnchor="middle" fontSize={13} fill="var(--muted)">{x}</text>
        ))}
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 1} textAnchor="middle" fontSize={13} fill="var(--muted)">arrivals per second</text>
        <path d={line('stat')} fill="none" stroke="var(--warn)" strokeWidth={2.2} />
        <path d={line('cont')} fill="none" stroke="var(--ok)" strokeWidth={2.2} />
        <line x1={fx(LOADS[sel])} x2={fx(LOADS[sel])} y1={PAD.t} y2={H - PAD.b} stroke="var(--accent)" strokeWidth={1.4} strokeDasharray="4 4" />
        <circle cx={fx(LOADS[sel])} cy={fy(pick(SWEEP[sel].stat))} r={4} fill="var(--warn)" />
        <circle cx={fx(LOADS[sel])} cy={fy(pick(SWEEP[sel].cont))} r={4} fill="var(--ok)" />
      </svg>
      <p className="text-[11px] text-muted">{unit}</p>
    </div>
  );
}

function Card({ label, r, color, tid }: { label: string; r: SimResult; color: string; tid: string }) {
  const ms = (x: number) => (x >= 1000 ? `${(x / 1000).toFixed(1)} s` : `${Math.round(x)} ms`);
  return (
    <div className="rounded-lg border border-line bg-surface p-3" style={{ borderLeft: `3px solid ${color}` }} data-testid={tid}>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 flex justify-between text-sm"><span className="text-muted">finished per second</span><span className="tabular-nums font-semibold" data-testid={`${tid}-thr`}>{r.throughput.toFixed(2)}</span></div>
      <div className="flex justify-between text-sm"><span className="text-muted">median time per output token</span><span className="tabular-nums font-semibold" data-testid={`${tid}-p50`}>{ms(r.p50)}</span></div>
      <div className="flex justify-between text-sm"><span className="text-muted">95th percentile</span><span className="tabular-nums font-semibold">{ms(r.p95)}</span></div>
    </div>
  );
}

export default function AiE3BatchSim() {
  const [sel, setSel] = useState(3);
  const p = SWEEP[sel];
  const ratio = p.stat.throughput > 0 ? p.cont.throughput / p.stat.throughput : 0;
  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="e3-batch-sim">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Same GPU, same traffic, two schedulers</span>
        <span className="text-xs text-muted">illustrative model, not a benchmark</span>
      </div>
      <p className="mb-3 text-xs text-muted">
        Up to {MAX_BATCH} requests at a time. One decode step costs {STEP_BASE_MS} ms plus {STEP_PER_SEQ_MS} ms per request in the batch. Output lengths: 70% short (20 to 80 tokens), 25% medium (100 to 300), 5% long (800 to 1,500). Requests arrive at random. We simulate {HORIZON_S} seconds of traffic. Latency is the time a request spends in the system divided by its output tokens, the way the Orca paper reports it.
      </p>
      <label htmlFor="e3bs-load" className="mb-1 flex justify-between text-xs text-muted">
        <span>Load (requests arriving per second)</span>
        <span className="tabular-nums text-fg" data-testid="e3bs-load">{p.load}</span>
      </label>
      <input id="e3bs-load" type="range" min={0} max={SWEEP.length - 1} step={1} value={sel} onChange={(e) => setSel(+e.target.value)} className="w-full accent-[var(--accent)]" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card label="Request-level (static) batching" r={p.stat} color="var(--warn)" tid="e3bs-stat" />
        <Card label="Iteration-level (continuous) batching" r={p.cont} color="var(--ok)" tid="e3bs-cont" />
      </div>
      <p className="mt-2 text-xs text-muted">
        At this load continuous batching finishes <span className="tabular-nums text-fg" data-testid="e3bs-ratio">{ratio.toFixed(1)}x</span> as many requests per second as static batching.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Chart title="Finished requests per second" unit="higher is better. Dashed line: the load you picked." pick={(r) => r.throughput} yMin={0} yMax={3} ticks={[0, 1, 2, 3]} sel={sel} />
        <Chart title="Median time per output token (ms)" unit="lower is better. Log scale." pick={(r) => r.p50} log yMin={10} yMax={10000} ticks={[10, 100, 1000, 10000]} sel={sel} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--warn)' }} />static batching</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--ok)' }} />continuous batching</span>
      </div>
    </div>
  );
}
