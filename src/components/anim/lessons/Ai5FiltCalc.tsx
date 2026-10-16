import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { MAX_SCAN_TUPLES, exactRows, exactScanned, iterRows, iterScanned, postRows } from './Ai5FiltMath';

const num = (v: number) => (v >= 10 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1));

/** Selectivity slider: expected rows returned per strategy. */
export default function Ai5FiltCalc() {
  const [logSel, setLogSel] = useState(-1);
  const [ef, setEf] = useState(40);
  const [limit, setLimit] = useState(10);
  const [logN, setLogN] = useState(6);
  const sel = Math.pow(10, logSel);
  const n = Math.round(Math.pow(10, logN));

  const rows = [
    { name: 'Post-filter (default HNSW)', r: postRows(ef, sel, limit), work: `${ef} candidates scanned`, id: 'post' },
    { name: 'Iterative scan', r: iterRows(sel, limit), work: `${num(iterScanned(sel, limit))} candidates scanned (cap ${MAX_SCAN_TUPLES.toLocaleString('en-US')})`, id: 'iter' },
    { name: 'Pre-filter, exact scan', r: exactRows(n, sel, limit), work: `${num(exactScanned(n, sel))} vectors compared`, id: 'exact' },
  ];

  return (
    <CacheWidgetFrame title="Filter selectivity: rows returned" hint="expected values, pgvector defaults">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label htmlFor="a5f-s" className="mb-1 flex justify-between text-xs text-muted"><span>Share of rows that match the filter</span><span className="tabular-nums text-fg" data-testid="a5f-sel">{(sel * 100) < 1 ? (sel * 100).toFixed(2) : (sel * 100).toFixed(1)}%</span></label>
            <input id="a5f-s" type="range" min={-3} max={0} step={0.05} value={logSel} onChange={(e) => setLogSel(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5f-e" className="mb-1 flex justify-between text-xs text-muted"><span>ef_search</span><span className="tabular-nums text-fg">{ef}</span></label>
            <input id="a5f-e" type="range" min={10} max={400} step={10} value={ef} onChange={(e) => setEf(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5f-k" className="mb-1 flex justify-between text-xs text-muted"><span>LIMIT (rows wanted)</span><span className="tabular-nums text-fg">{limit}</span></label>
            <input id="a5f-k" type="range" min={1} max={50} step={1} value={limit} onChange={(e) => setLimit(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a5f-n" className="mb-1 flex justify-between text-xs text-muted"><span>Total rows (N)</span><span className="tabular-nums text-fg">{n.toLocaleString('en-US')}</span></label>
            <input id="a5f-n" type="range" min={4} max={8} step={0.1} value={logN} onChange={(e) => setLogN(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="space-y-2">
          {rows.map((x) => (
            <div key={x.id} className="rounded-lg border border-line bg-surface p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted">{x.name}</span>
                <span className="text-lg font-semibold tabular-nums" style={{ color: x.r >= limit ? 'var(--ok)' : 'var(--bad)' }} data-testid={`a5f-${x.id}`}>{num(x.r)} of {limit}</span>
              </div>
              <div className="text-xs text-muted">{x.work}</div>
            </div>
          ))}
          <p className="text-xs leading-relaxed text-muted">
            Expected values. They assume matching rows are spread evenly through the index. If the filter is tied to the query (for example, one tenant owns the whole region of vectors), real results differ. Post-filter rows = ef_search x share, capped at LIMIT. Iterative rows = max_scan_tuples x share, capped at LIMIT.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
