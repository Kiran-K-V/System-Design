import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { meanPrecisionAtRelevant, ndcgAtK, precisionAtK, recallAtK, reciprocalRank } from './Ai5EvalMath';

/** Click ranks to mark them relevant. See recall, precision, MRR, nDCG and RAGAS-style context precision move. */
export default function Ai5EvalCalc() {
  const [rel, setRel] = useState<boolean[]>([true, false, true, false, false, false, false, false, false, false]);
  const [k, setK] = useState(5);
  const [total, setTotal] = useState(3);
  const hits = rel.slice(0, k).filter(Boolean).length;
  const shown = Math.max(total, rel.filter(Boolean).length);
  const m = [
    { name: 'recall@k', v: recallAtK(rel, k, shown), note: `${hits} found / ${shown} relevant in corpus` },
    { name: 'precision@k', v: precisionAtK(rel, k), note: `${hits} relevant / ${k} returned` },
    { name: 'reciprocal rank', v: reciprocalRank(rel, k), note: 'one over the rank of the first relevant chunk' },
    { name: 'nDCG@k', v: ndcgAtK(rel, k, shown), note: 'discounted gain over the best possible list' },
    { name: 'context precision', v: meanPrecisionAtRelevant(rel, k), note: 'mean of precision@i at each relevant rank' },
  ];
  return (
    <CacheWidgetFrame title="Retrieval metrics by hand" hint="one query; click a rank to flip it">
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ranks">
          {rel.map((r, i) => (
            <button
              key={i}
              type="button"
              aria-pressed={r}
              data-testid={`ev-r${i + 1}`}
              onClick={() => setRel(rel.map((x, j) => (j === i ? !x : x)))}
              className="h-12 w-12 rounded-md border text-xs"
              style={{ opacity: i < k ? 1 : 0.4, borderColor: r ? 'var(--ok)' : 'var(--border)', background: r ? 'color-mix(in srgb, var(--ok) 20%, var(--bg))' : 'var(--surface)' }}
            >
              <div className="text-muted">#{i + 1}</div>
              <div>{r ? 'rel' : 'no'}</div>
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="a510-k" className="mb-1 flex justify-between text-xs text-muted">
              <span>k (how many ranks count)</span>
              <span className="tabular-nums text-fg">{k}</span>
            </label>
            <input id="a510-k" type="range" min={1} max={10} step={1} value={k} onChange={(e) => setK(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a510-t" className="mb-1 flex justify-between text-xs text-muted">
              <span>Relevant chunks that exist</span>
              <span className="tabular-nums text-fg">{shown}</span>
            </label>
            <input id="a510-t" type="range" min={1} max={10} step={1} value={total} onChange={(e) => setTotal(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {m.map((x) => (
            <div key={x.name} className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">{x.name}</div>
              <div className="text-lg font-semibold tabular-nums" data-testid={`ev-${x.name.replace(/[^a-z]/gi, '')}`}>{x.v.toFixed(3)}</div>
              <div className="text-xs text-muted">{x.note}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">Binary relevance. nDCG uses gain 1 and discount 1 / log2(rank + 1). MRR is the mean of reciprocal rank over many queries; one query gives one value.</p>
      </div>
    </CacheWidgetFrame>
  );
}
