import { useState } from 'react';
import { BLOCK, COLS, NEWCOMER, POOL_TOKENS, REQS, contiguous, paged, type Cell, type Layout } from './ai2KvPagedLogic';

const COLORS: Record<Cell['kind'], string> = {
  used: 'color-mix(in srgb, var(--ok) 55%, var(--bg))',
  reserved: 'color-mix(in srgb, var(--warn) 45%, var(--bg))',
  newcomer: 'var(--accent)',
  free: 'transparent',
};

function Grid({ layout, label, tid }: { layout: Layout; label: string; tid: string }) {
  return (
    <div role="img" aria-label={`${label}: ${layout.usedTokens} tokens used, ${layout.heldTokens} held, ${layout.freeTokens} free`}>
      <div className="grid rounded-md border border-line p-px" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 1 }} data-testid={tid}>
        {layout.cells.map((c, i) => (
          <div
            key={i}
            title={c.id ? `sequence ${c.id}` : 'free'}
            style={{
              aspectRatio: '1',
              background: COLORS[c.kind],
              boxShadow: c.first ? 'inset 2px 0 0 var(--fg)' : c.kind === 'free' ? 'inset 0 0 0 1px var(--border)' : undefined,
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Stats({ layout, tid, kind }: { layout: Layout; tid: string; kind: 'contiguous' | 'paged' }) {
  const need = kind === 'contiguous' ? `a ${NEWCOMER.reserve.toLocaleString('en-US')}-token run` : `${Math.ceil(NEWCOMER.prompt / BLOCK)} blocks`;
  return (
    <div className="mt-2 space-y-0.5 text-xs" data-testid={tid}>
      <div className="flex justify-between"><span className="text-muted">tokens of real data</span><span className="tabular-nums" data-testid={`${tid}-used`}>{layout.usedTokens.toLocaleString('en-US')}</span></div>
      <div className="flex justify-between"><span className="text-muted">tokens held</span><span className="tabular-nums" data-testid={`${tid}-held`}>{layout.heldTokens.toLocaleString('en-US')}</span></div>
      <div className="flex justify-between"><span className="text-muted">wasted (held, unused)</span><span className="tabular-nums text-warn" data-testid={`${tid}-waste`}>{layout.wastePct.toFixed(1)}%</span></div>
      <div className="flex justify-between"><span className="text-muted">free / largest free run</span><span className="tabular-nums" data-testid={`${tid}-free`}>{layout.freeTokens.toLocaleString('en-US')} / {layout.largestFreeRun.toLocaleString('en-US')}</span></div>
      <div className={`font-medium ${layout.admitted ? 'text-ok' : 'text-bad'}`} data-testid={`${tid}-adm`}>
        New request G (needs {need}): {layout.admitted ? 'admitted' : 'rejected'}
      </div>
    </div>
  );
}

export default function Ai2KvPaged() {
  const [pct, setPct] = useState(50);
  const [holes, setHoles] = useState(false);
  const p = pct / 100;
  const c = contiguous(p, holes);
  const g = paged(p, holes);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="kv-paged">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">KV cache memory: contiguous vs paged</span>
        <span className="text-xs text-muted">toy pool: {POOL_TOKENS.toLocaleString('en-US')} tokens = 5 GiB at 320 KiB per token</span>
      </div>
      <p className="mb-3 text-xs text-muted">
        Six requests (A to F) are decoding. Contiguous: each reserves prompt + max new tokens up front, in one run. Paged: each takes {BLOCK}-token blocks only as it grows. Each square is one block of {BLOCK} tokens. Illustrative sizes: {REQS.map((r) => `${r.id} reserves ${r.reserve.toLocaleString('en-US')}`).join(', ')}.
      </p>
      <label htmlFor="kp-prog" className="block text-xs text-muted">
        <span className="flex justify-between"><span>Decode progress (every request is this far through its answer)</span><span className="tabular-nums text-fg" data-testid="kp-prog-v">{pct}%</span></span>
        <input id="kp-prog" type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
      </label>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={holes} onChange={(e) => setHoles(e.target.checked)} className="accent-[var(--accent)]" data-testid="kp-holes" />
        Requests B and D finish and leave (shows external fragmentation)
      </label>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-medium">Contiguous: reserve the maximum</div>
          <Grid layout={c} label="Contiguous pool" tid="kp-grid-c" />
          <Stats layout={c} tid="kp-c" kind="contiguous" />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium">Paged: blocks on demand</div>
          <Grid layout={g} label="Paged pool" tid="kp-grid-p" />
          <Stats layout={g} tid="kp-p" kind="paged" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.used }} />real tokens</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.reserved }} />reserved, not used yet</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.newcomer }} />new request G</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-line" />free</span>
      </div>
    </div>
  );
}
