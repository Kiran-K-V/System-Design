import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { BUDGET_MS, FIXED_MS, maxCandidates, rankerMs, recall, totalMs } from './AiE1RetrievalLogic';

/** Sliders: candidates passed to the ranker and the ranker's cost per item. Shows time against budget and recall. */
export default function AiE1CascadeBudget() {
  const [k, setK] = useState(1000);
  const [cost, setCost] = useState(0.05);
  const [lanes, setLanes] = useState(1);
  const plan = { candidates: k, perItemMs: cost, lanes };
  const rk = rankerMs(plan);
  const total = totalMs(plan);
  const over = total > BUDGET_MS;
  const cap = maxCandidates(cost, lanes);
  const parts = [
    { name: 'Network and glue', ms: FIXED_MS.network, color: 'var(--muted)' },
    { name: 'Candidate generation', ms: FIXED_MS.ann, color: 'var(--accent)' },
    { name: 'Ranker', ms: rk, color: over ? 'var(--bad)' : 'var(--ok)' },
    { name: 'Re-rank', ms: FIXED_MS.rerank, color: 'var(--warn)' },
  ];
  const scale = Math.max(total, BUDGET_MS);

  return (
    <CacheWidgetFrame title="Budget against recall" hint="Illustrative model. Change the sliders.">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-muted">
          <span className="flex justify-between"><span>Candidates sent to ranker</span><span className="text-fg tabular-nums">{k.toLocaleString('en-US')}</span></span>
          <input type="range" min={50} max={5000} step={50} value={k} onChange={(e) => setK(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </label>
        <label className="text-xs text-muted">
          <span className="flex justify-between"><span>Ranker cost per item</span><span className="text-fg tabular-nums">{`${cost} ms`}</span></span>
          <input type="range" min={0.01} max={0.5} step={0.01} value={cost} onChange={(e) => setCost(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </label>
        <label className="text-xs text-muted">
          <span className="flex justify-between"><span>Parallel lanes (GPUs)</span><span className="text-fg tabular-nums">{lanes}</span></span>
          <input type="range" min={1} max={8} step={1} value={lanes} onChange={(e) => setLanes(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </label>
      </div>
      <div className="mt-4" aria-live="polite">
        <div className="flex h-5 w-full overflow-hidden rounded bg-surface">
          {parts.map((p) => (
            <div key={p.name} title={`${p.name}: ${p.ms} ms`} style={{ width: `${(p.ms / scale) * 100}%`, background: p.color }} />
          ))}
        </div>
        <div className="relative mt-1 h-3 text-xs text-muted">
          <span className="absolute -translate-x-full" style={{ left: `${(BUDGET_MS / scale) * 100}%` }}>{`budget ${BUDGET_MS} ms`}</span>
        </div>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {parts.map((p) => (
            <li key={p.name} className="flex justify-between gap-2">
              <span><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
              <span className="font-mono tabular-nums">{`${p.ms} ms`}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <span className="font-mono tabular-nums" style={{ color: over ? 'var(--bad)' : 'var(--ok)' }}>{`Total ${total} ms`}</span>
          {over ? ' is over the budget. Send fewer candidates, make the ranker cheaper, or add lanes.' : ' fits the budget.'}
        </p>
        <p className="mt-1 text-sm">
          {`Share of the good items still inside the candidate set: ${Math.round(recall(k) * 100)}%. At this ranker cost the budget allows at most ${cap.toLocaleString('en-US')} candidates, which gives ${Math.round(recall(cap) * 100)}%.`}
        </p>
      </div>
      <p className="mt-3 text-xs text-muted">Model: ranker time is candidates times cost per item, divided by lanes. Fixed costs are 10 ms network and glue, 15 ms candidate generation, 5 ms re-rank. The recall curve is an illustrative shape that rises fast and then flattens. No value here is measured.</p>
    </CacheWidgetFrame>
  );
}
