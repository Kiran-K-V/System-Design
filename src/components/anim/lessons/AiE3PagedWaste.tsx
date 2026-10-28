import { useState } from 'react';
import { BLOCK_CHOICES, LENGTHS, POOL_TOKENS, RESERVE_CHOICES, contiguous, paged, type Pool } from './AiE3PagedLogic';

const fmt = (n: number) => n.toLocaleString('en-US');

function Bar({ label, p, tid }: { label: string; p: Pool; tid: string }) {
  const w = (n: number) => `${(100 * n) / POOL_TOKENS}%`;
  return (
    <div data-testid={tid}>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted">
          <span data-testid={`${tid}-n`} className="text-fg">{p.admitted}</span> requests running
        </span>
      </div>
      <div className="flex h-7 overflow-hidden rounded-md border border-line" role="img" aria-label={`${label}: ${p.usedTokens} tokens of real data, ${p.wastedTokens} tokens held but empty, ${p.freeTokens} tokens free`}>
        <div style={{ width: w(p.usedTokens), background: 'color-mix(in srgb, var(--ok) 55%, var(--bg))' }} />
        <div style={{ width: w(p.wastedTokens), background: 'color-mix(in srgb, var(--warn) 55%, var(--bg))' }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>real data {fmt(p.usedTokens)}</span>
        <span className="text-warn" data-testid={`${tid}-waste`}>held but empty {p.wastePct.toFixed(1)}%</span>
        <span>free {fmt(p.freeTokens)}</span>
      </div>
    </div>
  );
}

export default function AiE3PagedWaste() {
  const [ri, setRi] = useState(1);
  const [bi, setBi] = useState(2);
  const reserve = RESERVE_CHOICES[ri];
  const block = BLOCK_CHOICES[bi];
  const c = contiguous(reserve);
  const p = paged(block);
  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="e3-paged-waste">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">One KV pool, two ways to hand it out</span>
        <span className="text-xs text-muted">illustrative model, not a benchmark</span>
      </div>
      <p className="mb-3 text-xs text-muted">
        The pool holds {fmt(POOL_TOKENS)} tokens of keys and values. {LENGTHS.length} requests wait, in a fixed order. Each already holds between 30 and 1,830 tokens (prompt plus answer so far; most are short). The left bar books a fixed run per request. The right bar gives whole blocks and stops when the next request does not fit. Paged requests may grow later; the real engine then preempts one, which this model does not show.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="e3pw-res" className="mb-1 flex justify-between text-xs text-muted">
            <span>Booked per request (the max_tokens limit)</span>
            <span className="tabular-nums text-fg" data-testid="e3pw-res">{fmt(reserve)}</span>
          </label>
          <input id="e3pw-res" type="range" min={0} max={RESERVE_CHOICES.length - 1} step={1} value={ri} onChange={(e) => setRi(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="e3pw-blk" className="mb-1 flex justify-between text-xs text-muted">
            <span>Block size (tokens per block)</span>
            <span className="tabular-nums text-fg" data-testid="e3pw-blk">{block}</span>
          </label>
          <input id="e3pw-blk" type="range" min={0} max={BLOCK_CHOICES.length - 1} step={1} value={bi} onChange={(e) => setBi(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Bar label="Book a fixed run per request" p={c} tid="e3pw-c" />
        <Bar label="Paged blocks" p={p} tid="e3pw-p" />
      </div>
      <p className="mt-3 text-xs text-muted">
        At these settings paged blocks keep <span className="tabular-nums text-fg" data-testid="e3pw-ratio">{(p.admitted / Math.max(1, c.admitted)).toFixed(1)}x</span> as many requests running at once. Try a block size of 256: small blocks waste almost nothing, big blocks bring the waste back.
      </p>
    </div>
  );
}
