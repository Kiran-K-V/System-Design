import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { GPU_GB, MODELS, budget, type Method } from './Ai11LoraMath';

const METHODS: { id: Method; label: string }[] = [
  { id: 'full', label: 'Full fine-tune' },
  { id: 'lora', label: 'LoRA' },
  { id: 'qlora', label: 'QLoRA' },
];
const RANKS = [4, 8, 16, 32, 64, 128, 256];
const COLORS: Record<string, string> = {
  w: 'var(--accent)',
  g: 'var(--warn)',
  m: 'var(--bad)',
  a: 'var(--muted)',
  t: 'var(--ok)',
  act: 'var(--border)',
};

const fmt = (g: number) => (g >= 1000 ? `${(g / 1000).toFixed(2)} TB` : `${g.toFixed(g >= 100 ? 0 : 1)} GB`);

function Slider({ id, label, value, min, max, step, show, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
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

export default function Ai11LoraMemCalc() {
  const [mid, setMid] = useState('70b');
  const [method, setMethod] = useState<Method>('qlora');
  const [ri, setRi] = useState(2);
  const [act, setAct] = useState(10);
  const m = MODELS.find((x) => x.id === mid)!;
  const rank = RANKS[ri];
  const b = budget(m.paramsB * 1e9, m.cfg, method, rank, act);
  const full = budget(m.paramsB * 1e9, m.cfg, 'full', rank, act);
  const scale = b.totalGB;

  return (
    <CacheWidgetFrame title="Training memory: full, LoRA, QLoRA" hint="Memory only. Assumptions are listed below.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Model" value={mid} options={MODELS.map((x) => ({ id: x.id, label: x.label }))} onChange={setMid} />
        <Seg label="Method" value={method} options={METHODS} onChange={setMethod} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="a11m-r" label="LoRA rank (ignored for full fine-tune)" value={ri} min={0} max={RANKS.length - 1} step={1} show={String(rank)} onChange={setRi} />
        <Slider id="a11m-a" label="Activations and runtime reserve (assumption)" value={act} min={0} max={40} step={1} show={`${act} GB`} onChange={setAct} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-3">
          <div className="flex h-6 overflow-hidden rounded bg-bg" role="img" aria-label="Memory bar for the chosen method">
            {b.segs.map((s) => (
              <div key={s.id} style={{ width: `${(s.gb / scale) * 100}%`, background: COLORS[s.id] }} title={`${s.label}: ${fmt(s.gb)}`} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {b.segs.map((s) => (
              <span key={s.id}>
                <span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: COLORS[s.id] }} />
                {s.label} {fmt(s.gb)}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">The bar shows what the total is made of.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Total</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="lm-total">{fmt(b.totalGB)}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">80 GB GPUs, at least</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="lm-gpus">{b.gpus80}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Trained numbers</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="lm-train">{b.trainable >= 1e9 ? `${(b.trainable / 1e9).toFixed(0)}B` : `${(b.trainable / 1e6).toFixed(0)}M`}</div>
            <div className="text-xs text-muted">{((b.trainable / (m.paramsB * 1e9)) * 100).toFixed(2)}% of the model</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Versus full fine-tune</div>
            <div className="text-lg font-semibold tabular-nums" data-testid="lm-ratio">{(full.totalGB / b.totalGB).toFixed(1)}x less</div>
          </div>
        </div>
        <p className={b.fits48 ? 'text-ok' : 'text-warn'}>
          {b.fits48 ? 'Fits one 48 GB GPU.' : `Does not fit one 48 GB GPU.`} {b.totalGB <= GPU_GB ? 'Fits one 80 GB GPU.' : `Needs ${b.gpus80} GPUs of 80 GB, and the work must be split across them.`}
        </p>
        <p className="text-muted">
          Model: full fine-tune keeps 16 bytes per number (2 weight + 2 gradient + 4 master copy + 8 optimizer notes). LoRA keeps the base at 2 bytes per number and gives 16 bytes only to the adapter numbers. QLoRA keeps the base at 4.127 bits per number (4 bits plus 0.127 bits for scale constants). Adapters go on all seven matrices of every layer. Activations are an assumed flat number: they grow with batch size and text length, and checkpointing shrinks them. GB means 10^9 bytes. Splitting across GPUs adds overhead this model ignores.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
