import { useState } from 'react';
import { PRESETS, flopsPerToken, kvBytesPerToken, params, type Config } from './Ai1FwdMath';

const M = (n: number) => `${(n / 1e6).toFixed(1)}M`;
const B = (n: number) => `${(n / 1e9).toFixed(2)}B`;

function Num({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id} className="block text-xs text-muted">
      {label}
      <input id={id} type="number" min={1} value={value} onChange={(e) => onChange(Math.max(1, Math.round(+e.target.value || 1)))} className="mt-1 w-full rounded-md border border-line bg-bg p-1.5 text-sm tabular-nums text-fg" />
    </label>
  );
}

function Card({ title, value, note, tone }: { title: string; value: string; note?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{title}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}

export default function Ai1FwdCalc() {
  const [cfg, setCfg] = useState<Config>(PRESETS[0].cfg);
  const [preset, setPreset] = useState<string | null>('8b');
  const set = (k: keyof Config, v: number | boolean) => {
    setCfg({ ...cfg, [k]: v });
    setPreset(null);
  };
  const p = params(cfg);
  const f = flopsPerToken(cfg);
  const paper = PRESETS.find((x) => x.id === preset);
  const err = paper ? (p.total / 1e9 / paper.paperB - 1) * 100 : null;
  const headOk = Number.isInteger(p.headDim) && Number.isInteger(cfg.heads / cfg.kvHeads);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="param-calc">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Parameter calculator</span>
        <span className="text-xs text-muted">Llama-style: SwiGLU MLP (3 matrices), grouped-query attention</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              setCfg(x.cfg);
              setPreset(x.id);
            }}
            aria-pressed={preset === x.id}
            className={`rounded-md border px-2.5 py-1.5 text-xs ${preset === x.id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface'}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Num id="pc-layers" label="Layers" value={cfg.layers} onChange={(v) => set('layers', v)} />
        <Num id="pc-d" label="d_model" value={cfg.dModel} onChange={(v) => set('dModel', v)} />
        <Num id="pc-ffn" label="FFN dim" value={cfg.ffn} onChange={(v) => set('ffn', v)} />
        <Num id="pc-heads" label="Query heads" value={cfg.heads} onChange={(v) => set('heads', v)} />
        <Num id="pc-kv" label="KV heads" value={cfg.kvHeads} onChange={(v) => set('kvHeads', v)} />
        <Num id="pc-vocab" label="Vocabulary" value={cfg.vocab} onChange={(v) => set('vocab', v)} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={cfg.tied} onChange={(e) => set('tied', e.target.checked)} className="accent-[var(--accent)]" />
        Tie input and output embeddings (share one table)
      </label>
      {!headOk && <p className="mt-2 text-xs text-bad">Heads must divide d_model, and KV heads must divide query heads.</p>}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="pc-out">
        <Card title="Attention per layer" value={M(p.attn)} note={`head dim ${p.headDim}`} />
        <Card title="MLP per layer" value={M(p.mlp)} />
        <Card title="Embedding table(s)" value={B(p.embed + p.out)} />
        <Card title="Total parameters" value={B(p.total)} tone="text-ok" />
        <Card title="MLP share of total" value={`${(p.mlpShare * 100).toFixed(0)}%`} />
        <Card title="FLOPs per token (2N)" value={`${(f.rule2N / 1e9).toFixed(1)} G`} note={`matmul only: ${(f.matmul / 1e9).toFixed(1)} G`} />
        <Card title="Weights in BF16" value={`${((p.total * 2) / 1e9).toFixed(1)} GB`} note="2 bytes each" />
        <Card title="KV cache per token" value={`${(kvBytesPerToken(cfg) / 1024).toFixed(0)} KiB`} note="BF16, all layers" />
      </div>
      <p className="mt-3 text-xs text-muted" data-testid="pc-check">
        {paper && err !== null
          ? `Check: the Llama 3 paper (Table 3) names this model ${paper.paperB}B. Our count is ${B(p.total)}, which is ${err >= 0 ? '+' : ''}${err.toFixed(2)}% off. We skip the small norm weights.`
          : 'Edit a preset to see how each number moves. Pick a preset to compare with the published size.'}
      </p>
    </div>
  );
}
