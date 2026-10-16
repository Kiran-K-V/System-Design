import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { fuse } from './Ai5RrfMath';

const NAMES = ['A', 'B', 'C', 'D', 'E'];
const rk = (v: number): number | null => (v === 0 ? null : v);

/** Set each document's rank in two lists (0 = not in that list) and k. See the fused order. */
export default function Ai5RrfCalc() {
  const [dense, setDense] = useState([1, 2, 3, 0, 5]);
  const [bm25, setBm25] = useState([4, 0, 1, 2, 3]);
  const [k, setK] = useState(60);
  const out = fuse(NAMES.map((id, i) => ({ id, ranks: [rk(dense[i]), rk(bm25[i])] })), k);
  const set = (arr: number[], fn: (v: number[]) => void, i: number, v: number) => fn(arr.map((x, j) => (j === i ? v : x)));
  return (
    <CacheWidgetFrame title="RRF calculator" hint="score = sum of 1 / (k + rank)">
      <div className="mb-4">
        <label htmlFor="a5r-k" className="mb-1 flex justify-between text-xs text-muted"><span>k (rank constant)</span><span className="tabular-nums text-fg" data-testid="a5r-k">{k}</span></label>
        <input id="a5r-k" type="range" min={1} max={100} step={1} value={k} onChange={(e) => setK(+e.target.value)} className="w-full accent-[var(--accent)]" />
      </div>
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs text-muted">Rank in each list (0 = not in the list)</div>
          {NAMES.map((n, i) => (
            <div key={n} className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2">
              <span className="font-mono">doc {n}</span>
              <label className="text-xs text-muted">dense <input aria-label={`dense rank of ${n}`} type="number" min={0} max={10} value={dense[i]} onChange={(e) => set(dense, setDense, i, Math.max(0, Math.min(10, +e.target.value || 0)))} className="ml-1 w-14 rounded-md border border-line bg-bg px-1.5 py-1 text-fg" /></label>
              <label className="text-xs text-muted">BM25 <input aria-label={`bm25 rank of ${n}`} type="number" min={0} max={10} value={bm25[i]} onChange={(e) => set(bm25, setBm25, i, Math.max(0, Math.min(10, +e.target.value || 0)))} className="ml-1 w-14 rounded-md border border-line bg-bg px-1.5 py-1 text-fg" /></label>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-2 text-xs text-muted">Fused order</div>
          <ol className="space-y-1.5" data-testid="a5r-out">
            {out.map((d, i) => (
              <li key={d.id} className={`flex justify-between rounded-md border border-line px-2.5 py-1.5 font-mono ${i === 0 ? 'bg-ok/10' : 'bg-surface'}`}>
                <span>{i + 1}. doc {d.id}</span>
                <span className="tabular-nums">{d.score.toFixed(4)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Try k = 1: rank gaps matter a lot, so a doc that is first in one list beats a doc that is mid-list in both. Try k = 100: the curve flattens and appearing in both lists counts most. Elastic's default is k = 60. Ties break by document name.
      </p>
    </CacheWidgetFrame>
  );
}
