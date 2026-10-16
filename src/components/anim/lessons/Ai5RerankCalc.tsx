import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { budget } from './Ai5RerankMath';

const money = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(5)}`);

/** Rerank latency and cost. Per-pair latency is a slider with illustrative values: no sourced figure exists. */
export default function Ai5RerankCalc() {
  const [n, setN] = useState(50);
  const [k, setK] = useState(5);
  const [ms, setMs] = useState(4);
  const [par, setPar] = useState(10);
  const [first, setFirst] = useState(30);
  const [limit, setLimit] = useState(300);
  const kk = Math.min(k, n);
  const b = budget({ n, k: kk, docTok: 500, msPerPair: ms, parallel: par, firstStageMs: first });
  const over = b.totalMs > limit;
  const sl = (id: string, label: string, v: number, set: (x: number) => void, min: number, max: number, step: number, unit = '') => (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted"><span>{label}</span><span className="tabular-nums text-fg">{v}{unit}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
  return (
    <CacheWidgetFrame title="Rerank budget: latency and cost" hint="prices as of 2026-10-16">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          {sl('a5k-n', 'Candidates to rerank (N)', n, setN, 5, 200, 5)}
          {sl('a5k-k', 'Chunks kept for the LLM (K)', k, setK, 1, 20, 1)}
          {sl('a5k-m', 'Reranker time per pair, illustrative', ms, setMs, 1, 20, 1, ' ms')}
          {sl('a5k-p', 'Pairs scored in parallel', par, setPar, 1, 50, 1)}
          {sl('a5k-f', 'Stage 1 time, illustrative', first, setFirst, 5, 100, 5, ' ms')}
          {sl('a5k-l', 'Latency budget for retrieval', limit, setLimit, 50, 1000, 50, ' ms')}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Rerank time</div><div className="text-lg font-semibold tabular-nums" data-testid="a5k-rms">{b.rerankMs.toFixed(0)} ms</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Retrieval total</div><div className="text-lg font-semibold tabular-nums" style={{ color: over ? 'var(--bad)' : 'var(--ok)' }} data-testid="a5k-tot">{b.totalMs.toFixed(0)} ms</div><div className="text-xs text-muted">{over ? 'over budget' : 'within budget'}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Rerank cost per query</div><div className="text-lg font-semibold tabular-nums" data-testid="a5k-rc">{money(b.rerankCost)}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Per 1M queries</div><div className="text-lg font-semibold tabular-nums" data-testid="a5k-rc1m">{money(b.rerankCost * 1e6).replace(/\.\d+$/, '')}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">LLM input, K chunks</div><div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--ok)' }} data-testid="a5k-top">{money(b.llmCostTop)}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">LLM input, all N chunks</div><div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--warn)' }} data-testid="a5k-all">{money(b.llmCostAll)}</div></div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Model (ours): rerank time = N x time per pair / pairs in parallel. The per-pair time, the parallelism and the stage 1 time are illustrative: we found no published figure, so measure your own reranker. Cost assumes 500 tokens per chunk, Voyage rerank-3 at $0.05 per 1M tokens (billed on document tokens, our assumption), and Claude Sonnet 5.5 input at $2 per 1M tokens. The query tokens and the LLM output are left out. The calculator says nothing about quality: a larger N finds more right chunks, and you must measure how many.
      </p>
    </CacheWidgetFrame>
  );
}
