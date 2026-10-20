import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { MIB, SLOT_STEPS, SOURCES, TENANTS, curve, readout, type Source, type Target } from './Ai13PlatformAdapterMath';

const W = 720;
const H = 250;
const L = 56;
const R = 18;
const T = 16;
const B = 44;
const BUDGET_GIB = 24;

function Slider({ id, label, value, min, max, step, shown, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; shown: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between gap-2 text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const fmtMs = (ms: number) => (ms >= 100 ? `${Math.round(ms)} ms` : ms >= 10 ? `${ms.toFixed(0)} ms` : `${ms.toFixed(2)} ms`);

/** Adapter cache simulator: 500 tenants, a limited number of GPU slots, a miss loads the adapter from slower memory. */
export default function Ai13PlatformAdapterSim() {
  const [slotIdx, setSlotIdx] = useState(2);
  const [skew, setSkew] = useState(1);
  const [rank, setRank] = useState(16);
  const [target, setTarget] = useState<Target>('qkvo');
  const [source, setSource] = useState<Source>('cpu');

  const slots = SLOT_STEPS[slotIdx];
  const gbps = SOURCES.find((s) => s.id === source)!.gbps;
  const res = useMemo(() => readout(slots, skew, rank, target, gbps), [slots, skew, rank, target, gbps]);
  const pts = useMemo(() => curve(skew), [skew]);

  const px = (i: number) => L + (i / (SLOT_STEPS.length - 1)) * (W - L - R);
  const py = (v: number) => T + (1 - v) * (H - T - B);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(p.hit).toFixed(1)}`).join(' ');
  const over = res.slotGiB > BUDGET_GIB;
  const tone = res.p95Ms > 50 ? 'var(--bad)' : res.p95Ms > 5 ? 'var(--warn)' : 'var(--ok)';

  return (
    <CacheWidgetFrame title="Adapter cache: hit rate against swap time" hint="500 tenants, LRU, seeded">
      <div className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Slider id="a13ad-s" label="Adapters kept on the GPU" value={slotIdx} min={0} max={SLOT_STEPS.length - 1} step={1} shown={`${slots} of ${TENANTS}`} onChange={setSlotIdx} />
          <Slider id="a13ad-k" label="Traffic skew (0 = all tenants equal)" value={skew} min={0} max={1.4} step={0.1} shown={skew.toFixed(1)} onChange={setSkew} />
          <Slider id="a13ad-r" label="LoRA rank" value={rank} min={8} max={64} step={8} shown={`r = ${rank}`} onChange={setRank} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted">Adapted matrices:</span>
          <Seg
            label="Adapted matrices"
            value={target}
            options={[
              { id: 'qkvo' as Target, label: 'Attention only (q, k, v, o)' },
              { id: 'all' as Target, label: 'All linear layers' },
            ]}
            onChange={setTarget}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted">A miss loads from:</span>
          <Seg label="Load source" value={source} options={SOURCES.map((s) => ({ id: s.id, label: `${s.label}, ${s.gbps} GB/s` }))} onChange={setSource} />
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Adapter hit rate for each number of GPU slots at the chosen traffic skew">
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--border)" />
              <text x={L - 8} y={py(v) + 5} textAnchor="end" fontSize={14} fill="var(--muted)">{Math.round(v * 100)}%</text>
            </g>
          ))}
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
          {pts.map((p, i) => (
            <g key={p.slots}>
              <circle cx={px(i)} cy={py(p.hit)} r={i === slotIdx ? 7 : 3.5} fill={i === slotIdx ? tone : 'var(--accent)'} stroke="var(--bg)" strokeWidth={1.5} />
              <text x={px(i)} y={H - B + 20} textAnchor="middle" fontSize={14} fill={i === slotIdx ? 'var(--fg)' : 'var(--muted)'}>{p.slots}</text>
            </g>
          ))}
          <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize={14} fill="var(--muted)">adapters kept on the GPU (hit rate on the vertical axis)</text>
        </svg>

        <div className="grid gap-2 sm:grid-cols-4" aria-live="polite">
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">One adapter</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="a13ad-size">{(res.bytes / MIB).toFixed(1)} MiB</div>
            <div className="text-xs text-muted">swap-in {fmtMs(res.swap)}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Hit rate</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="a13ad-hit">{(res.hit * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted">{(100 - res.hit * 100).toFixed(1)}% of requests wait</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Wait added, mean and p95</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: tone }} data-testid="a13ad-lat">{fmtMs(res.meanMs)} / {fmtMs(res.p95Ms)}</div>
            <div className="text-xs text-muted">p95 is 0 while misses stay under 5%</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">GPU memory for slots</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: over ? 'var(--bad)' : 'var(--fg)' }} data-testid="a13ad-mem">{res.slotGiB.toFixed(1)} GiB</div>
            <div className="text-xs text-muted">{over ? `over the ${BUDGET_GIB} GiB we assume is free` : `of ${BUDGET_GIB} GiB assumed free`}</div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Model, mostly illustrative. Adapter size is sourced arithmetic for Llama-3.1-8B at 2 bytes per number: r x (d_in + d_out) per matrix, 32 layers. Traffic follows a Zipf law over 500 tenants: tenant number k gets a share proportional to 1 / k to the power of the skew. The cache is a plain least-recently-used list, run for 30,000 seeded requests with the first 5,000 left out. A miss waits for the whole adapter at the chosen speed; the speeds (20, 3, and 0.1 GB/s) are assumptions, not measurements. The {BUDGET_GIB} GiB budget assumes an 80 GB GPU with 16 GB of base weights and about 40 GB kept for the KV cache and activations. Real servers also batch across adapters and overlap loads with compute, so a real miss can hurt less. The model shows the shape, not your numbers.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
