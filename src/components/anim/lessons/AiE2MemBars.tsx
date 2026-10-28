import { useState } from 'react';
import { GPU_BYTES, PARTS, TRAIN_MODELS, minGpus, model, stateBytes } from './AiE2MemLogic';

const COLORS = ['var(--accent)', 'var(--warn)', 'var(--ok)', 'var(--muted)', 'var(--fg)'];
const COUNTS = [1, 2, 4, 8, 16, 32, 64, 128];
const fmt = (b: number) => (b >= 1e12 ? `${(b / 1e12).toFixed(2)} TB` : `${(b / 1e9).toFixed(b >= 1e11 ? 0 : 1)} GB`);

/** The 16 bytes per parameter, scaled to a model, against a pool of 80 GB GPUs. Activations are not counted. */
export default function AiE2MemBars() {
  const [mid, setMid] = useState('70b');
  const [n, setN] = useState(8);
  const m = model(mid);
  const total = stateBytes(m.params);
  const pool = n * GPU_BYTES;
  const need = minGpus(m.params);
  const scale = Math.max(total, pool);
  const pct = (v: number) => `${(v / scale) * 100}%`;
  const fits = total <= pool;

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="mem-bars">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Training state per model, against a GPU pool</span>
        <span className="text-xs text-muted">80 GB H100 GPUs, activations not counted</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label htmlFor="mb-model" className="block text-xs text-muted">
          Model
          <select id="mb-model" value={mid} onChange={(e) => setMid(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg">
            {TRAIN_MODELS.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </select>
        </label>
        <label htmlFor="mb-n" className="block text-xs text-muted">
          GPUs in the pool
          <select id="mb-n" value={n} onChange={(e) => setN(+e.target.value)} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm text-fg">
            {COUNTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4" role="img" aria-label="Stacked bar of the five state components against the GPU pool size">
        <div className="relative">
          <div className="flex h-8 overflow-hidden rounded-md border border-line">
            {PARTS.map((p, i) => (
              <div key={p.id} style={{ width: pct(p.bytes * m.params), background: COLORS[i] }} className="opacity-70" title={`${p.label}: ${fmt(p.bytes * m.params)}`} />
            ))}
          </div>
          <div className="absolute inset-y-[-6px] w-[2px] bg-fg" style={{ left: pct(pool) }} title="Pool capacity" />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {PARTS.map((p, i) => (
            <span key={p.id}><span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: COLORS[i] }} />{p.label} {p.bytes} B, {fmt(p.bytes * m.params)}</span>
          ))}
        </div>
        <div className="mt-1 text-xs text-muted">The vertical line is the pool: {n} x 80 GB = {fmt(pool)}.</div>
      </div>

      <p className={`mt-3 text-[15px] ${fits ? 'text-ok' : 'text-bad'}`} data-testid="mb-fit">
        {fits ? `The states fit in ${fmt(pool)}, with ${fmt(pool - total)} left for activations.` : `Does not fit. States need ${fmt(total)} but the pool has ${fmt(pool)}.`}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Total state (16 B per parameter)</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="mb-total">{fmt(total)}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Inference weights only (2 B)</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="mb-inf">{fmt(2 * m.params)}</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Fewest GPUs for states alone</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="mb-min">{need}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model sizes are the nominal ones. The count is a floor: activations, buffers, and fragmentation need room too, and the next lesson shows how to spread the states so one GPU does not hold a full copy.
      </p>
    </div>
  );
}
