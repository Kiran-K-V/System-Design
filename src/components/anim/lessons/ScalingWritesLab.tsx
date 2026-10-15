import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { batchedQps, burstBacklog, clusterMaxQps, shardShares } from './scalingWrites';

const fmt = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(Math.round(n)));
const BASE_WRITES = 4_000;

function Slider({ id, label, value, min, max, step, shown, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; shown: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Before and after write meter: batching, shards, a hot key, salts, and a burst. Math is in scalingWrites.ts. */
export default function ScalingWritesLab() {
  const [batch, setBatch] = useState(100);
  const [shards, setShards] = useState(8);
  const [hot, setHot] = useState(0.2);
  const [salts, setSalts] = useState(1);
  const [burst, setBurst] = useState(60_000);
  const [secs, setSecs] = useState(10);

  const one = batchedQps(1);
  const batched = batchedQps(batch);
  const sharded = clusterMaxQps(shards, batched, hot, 1);
  const salted = clusterMaxQps(shards, batched, hot, salts);
  const rows = [
    { label: 'One node, 1 row per commit', qps: one },
    { label: `+ batches of ${batch}`, qps: batched },
    { label: `+ ${shards} shards, hot key unsalted`, qps: sharded },
    { label: `+ ${Math.min(salts, shards)} salts on the hot key`, qps: salted },
  ];
  const top = Math.max(...rows.map((r) => r.qps));
  const shares = shardShares(shards, hot, salts);
  const peak = Math.max(...shares);
  const b = burstBacklog(burst, salted, secs, BASE_WRITES);

  return (
    <CacheWidgetFrame title="Write capacity: batching, shards, and a hot key" hint="writes per second, illustrative costs">
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <Slider id="sw-batch" label="Rows per commit" value={batch} min={1} max={200} step={1} shown={String(batch)} onChange={setBatch} />
          <Slider id="sw-shards" label="Shards" value={shards} min={1} max={16} step={1} shown={String(shards)} onChange={(v) => { setShards(v); if (salts > v) setSalts(v); }} />
          <Slider id="sw-hot" label="Share of writes on one hot key" value={hot} min={0} max={0.8} step={0.05} shown={`${Math.round(hot * 100)}%`} onChange={setHot} />
          <Slider id="sw-salts" label="Salts on the hot key" value={Math.min(salts, shards)} min={1} max={shards} step={1} shown={String(Math.min(salts, shards))} onChange={setSalts} />
          <Slider id="sw-burst" label="Burst arrival (writes/s)" value={burst} min={10_000} max={200_000} step={5_000} shown={fmt(burst)} onChange={setBurst} />
          <Slider id="sw-secs" label="Burst length" value={secs} min={1} max={60} step={1} shown={`${secs} s`} onChange={setSecs} />
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="mb-2 text-xs text-muted">Most writes per second the system takes</div>
            <div className="space-y-1.5" role="img" aria-label="Bar chart of write capacity before and after each technique">
              {rows.map((r, i) => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="w-40 shrink-0 text-xs text-muted">{r.label}</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
                    <div className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: `${(r.qps / top) * 100}%`, background: i === 3 ? 'var(--accent)' : 'var(--muted)', opacity: i === 3 ? 0.8 : 0.4 }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums">{fmt(r.qps)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="mb-2 text-xs text-muted">Share of writes on each shard (the tallest one sets the limit)</div>
            <div className="flex h-16 items-end gap-1" role="img" aria-label="Share of writes on each shard">
              {shares.map((s, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${(s / peak) * 100}%`, background: s === peak && shares.filter((x) => x === peak).length < shards ? 'var(--bad)' : 'var(--ok)', opacity: 0.6 }} title={`Shard ${i + 1}: ${(s * 100).toFixed(1)}%`} />
              ))}
            </div>
            <div className="mt-1 text-xs tabular-nums text-muted">Hottest shard: {(peak * 100).toFixed(1)}% of writes. Even spread would be {(100 / shards).toFixed(1)}%.</div>
          </div>

          <p className="rounded-lg border border-line p-2.5 text-xs leading-relaxed text-muted">
            {b.backlog === 0
              ? `A burst of ${fmt(burst)}/s is below the ${fmt(salted)}/s the cluster drains, so no backlog forms.`
              : Number.isFinite(b.clearSeconds)
                ? `A burst of ${fmt(burst)}/s for ${secs} s leaves a queue of ${fmt(b.backlog)} writes. With ${fmt(BASE_WRITES)}/s of normal traffic still arriving, the cluster clears it in about ${Math.round(b.clearSeconds)} s.`
                : 'The queue never drains: normal traffic already uses all the capacity.'}
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
