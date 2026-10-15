import { useState } from 'react';
import { CFG, LENGTHS, N, attnFlops, crossover, flashExtraBytes, kvBytes, linearFlops, naiveScoreBytes, ratio } from './Ai1AttnMath';

const fl = (v: number) => (v >= 1e18 ? `${(v / 1e18).toFixed(2)} EFLOPs` : `${(v / 1e15).toFixed(2)} PFLOPs`);
const bytes = (v: number) => {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)} TB`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} GB`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} MB`;
  return `${(v / 1e3).toFixed(0)} KB`;
};
const kib = (n: number) => (n >= 1024 ? `${n / 1024}K` : String(n));

/** Log-width bar, so values that differ by 1000x still fit. */
function Bar({ label, value, text, min, max, color }: { label: string; value: number; text: string; min: number; max: number; color: string }) {
  const w = Math.max(2, Math.min(100, (Math.log10(Math.max(value, min) / min) / Math.log10(max / min)) * 100));
  return (
    <div className="grid grid-cols-[8.5rem_1fr_6.5rem] items-center gap-2 text-xs sm:grid-cols-[11rem_1fr_7.5rem]">
      <span className="text-muted">{label}</span>
      <span className="h-3.5 rounded bg-line/40">
        <span className="block h-3.5 rounded" style={{ width: `${w}%`, background: color }} />
      </span>
      <span className="text-right tabular-nums">{text}</span>
    </div>
  );
}

export default function Ai1AttnCost() {
  const [idx, setIdx] = useState(3);
  const [causal, setCausal] = useState(false);
  const n = LENGTHS[idx];
  const lin = linearFlops(n);
  const att = attnFlops(n, causal);
  const r = ratio(n, causal);
  const naive = naiveScoreBytes(n);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="attn-cost">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">Attention cost vs context length (Llama 3 70B)</span>
        <span className="text-xs text-muted">prefill of one prompt</span>
      </div>
      <label htmlFor="ac-n" className="mb-1 flex justify-between text-xs text-muted">
        <span>Prompt length n (tokens)</span>
        <span className="tabular-nums text-fg" data-testid="ac-n">{n.toLocaleString('en-US')} ({kib(n)})</span>
      </label>
      <input id="ac-n" type="range" min={0} max={LENGTHS.length - 1} step={1} value={idx} onChange={(e) => setIdx(+e.target.value)} className="w-full accent-[var(--accent)]" />
      <label className="mt-3 flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={causal} onChange={(e) => setCausal(e.target.checked)} className="accent-[var(--accent)]" />
        Skip the masked half (causal kernels do this). Off = full n × n square.
      </label>

      <div className="mt-4 space-y-2" aria-label="FLOPs">
        <div className="text-xs font-medium text-muted">Compute (log scale)</div>
        <Bar label="Linear part, 2·N·n" value={lin} text={fl(lin)} min={1e12} max={1e18} color="var(--ok)" />
        <Bar label={causal ? 'Attention, causal' : 'Attention, full mask'} value={att} text={fl(att)} min={1e12} max={1e18} color="var(--accent)" />
      </div>
      <p className="mt-2 text-[15px] tabular-nums" data-testid="ac-ratio">
        Attention is <strong className={r >= 1 ? 'text-bad' : 'text-ok'}>{r >= 1 ? `${r.toFixed(2)}x` : `${(r * 100).toFixed(1)}%`}</strong> of the linear compute at {kib(n)} tokens.
      </p>

      <div className="mt-4 space-y-2">
        <div className="text-xs font-medium text-muted">Memory, one layer, one sequence (log scale)</div>
        <Bar label="Naive scores, 64 heads, BF16" value={naive} text={bytes(naive)} min={1e6} max={1e13} color="var(--bad)" />
        <Bar label="FlashAttention extra (~)" value={flashExtraBytes(n)} text={bytes(flashExtraBytes(n))} min={1e6} max={1e13} color="var(--ok)" />
        <Bar label="KV cache, all 80 layers" value={kvBytes(n)} text={`${(kvBytes(n) / 2 ** 30).toFixed(1)} GiB`} min={1e6} max={1e13} color="var(--warn)" />
      </div>

      <div className="mt-3 rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-muted" data-testid="ac-derive">
        Derivation. N = {(N / 1e9).toFixed(1)}B, d = {CFG.dModel} (64 heads × 128), L = {CFG.layers}. Linear: 2·N·n = 2 × {(N / 1e9).toFixed(1)}B × {n.toLocaleString('en-US')} = {fl(lin)}.
        Attention: QKᵀ and AV each cost 2·n²·d per layer, so 4·n²·d·L = 4 × {n.toLocaleString('en-US')}² × {CFG.dModel} × {CFG.layers}{causal ? ' × ½' : ''} = {fl(att)}.
        Ratio = 2·n·d·L / N{causal ? ' × ½' : ''}. It reaches 1 at n ≈ {Math.round(crossover(causal)).toLocaleString('en-US')} tokens.
      </div>
    </div>
  );
}
