import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { MEDIAN, bestEta, bestQuantile, evaluate, timeAt } from './AiE1EtaLogic';

const min = (n: number) => `${n.toFixed(1)} min`;

/** One promised ETA for every order, chosen by the cost of being late. Illustrative model. */
export default function AiE1EtaLoss() {
  const [ratio, setRatio] = useState(3);
  const [mode, setMode] = useState<'mae' | 'cost'>('cost');
  const eta = mode === 'mae' ? timeAt(0.5) : bestEta(ratio);
  const r = evaluate(eta, ratio);
  const base = evaluate(timeAt(0.5), ratio);

  // Histogram of delivery times, 15 to 70 minutes in 5 minute bins.
  const bins = Array.from({ length: 11 }, (_, i) => 15 + i * 5);
  const counts = bins.map((lo) => {
    let c = 0;
    for (let k = 0; k < 400; k++) { const t = timeAt((k + 0.5) / 400); if (t >= lo && t < lo + 5) c++; }
    return c;
  });
  const maxC = Math.max(...counts);

  return (
    <CacheWidgetFrame title="Promised ETA and the cost of being late" hint="Illustrative model. Move the slider.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Train for:</span>
        <Seg label="Training target" value={mode} options={[{ id: 'mae', label: 'Lowest MAE (the median)' }, { id: 'cost', label: 'Lowest cost (a quantile)' }]} onChange={setMode} />
      </div>
      <div className="mb-4">
        <label htmlFor="e1e-r" className="mb-1 flex justify-between gap-2 text-xs text-muted">
          <span>Cost of one minute late, against one minute early</span>
          <span className="tabular-nums text-fg">{ratio}x</span>
        </label>
        <input id="e1e-r" type="range" min={1} max={6} step={0.5} value={ratio} onChange={(e) => setRatio(+e.target.value)} className="w-full accent-[var(--accent)]" />
      </div>
      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }} aria-live="polite">
        <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium" data-testid="eta-promise">Promise: {min(eta)}{mode === 'cost' ? ` (quantile ${(bestQuantile(ratio) * 100).toFixed(0)}%)` : ' (median)'}</span>
          <span className="font-semibold tabular-nums" data-testid="eta-late">{(r.lateRate * 100).toFixed(0)}% of orders late</span>
        </div>
        <div className="flex h-24 items-end gap-1" role="img" aria-label="Distribution of real delivery times in 5 minute bins, with bins after the promised time coloured as late">
          {counts.map((c, i) => (
            <div key={i} className="flex h-full flex-1 items-end" title={`${bins[i]} to ${bins[i] + 5} min`}>
              <div className="w-full rounded-t" style={{ height: `${Math.max(3, (c / maxC) * 100)}%`, background: bins[i] + 2.5 >= eta ? 'var(--bad)' : 'var(--muted)', opacity: bins[i] + 2.5 >= eta ? 0.8 : 0.45 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1 text-[11px] tabular-nums text-muted">
          {bins.map((b) => <span key={b} className="flex-1 text-center">{b}</span>)}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-muted">MAE</dt><dd className="tabular-nums" data-testid="eta-mae">{min(r.mae)}</dd></div>
          <div><dt className="text-xs text-muted">Late rate</dt><dd className="tabular-nums">{(r.lateRate * 100).toFixed(0)}%</dd></div>
          <div><dt className="text-xs text-muted">Average wait past the promise, all orders</dt><dd className="tabular-nums">{min(r.meanLate)}</dd></div>
          <div><dt className="text-xs text-muted">Cost per order (late minute = {ratio})</dt><dd className="tabular-nums" data-testid="eta-cost">{r.cost.toFixed(1)} vs {base.cost.toFixed(1)} at median</dd></div>
        </dl>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: real delivery time is log-normal, median {MEDIAN} minutes, with a long right tail. One promise covers every order. Red bars are the bins at or after the promise: those orders are late (bins are 5 minutes wide, so the edge bin is approximate). The median wins on MAE and loses on cost whenever late is worse than early.
      </p>
    </CacheWidgetFrame>
  );
}
