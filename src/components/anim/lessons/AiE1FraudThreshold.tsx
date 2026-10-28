import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { T_MAX, T_MIN, T_STEP, bestThreshold, evaluate } from './AiE1FraudLogic';

const MODELS = [
  { id: 3, label: 'Weak model' },
  { id: 4, label: 'Good model' },
  { id: 5, label: 'Strong model' },
];

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const int = (n: number) => Math.round(n).toLocaleString('en-US');
const pct = (n: number, d = 2) => `${(n * 100).toFixed(d)}%`;

/** Block-threshold simulator for 1 million payments. All inputs are illustrative. */
export default function AiE1FraudThreshold() {
  const [d, setD] = useState(4);
  const [t, setT] = useState(3.1);
  const [cBlock, setCBlock] = useState(20);
  const [cMiss, setCMiss] = useState(200);
  const r = evaluate({ d, t, costBlock: cBlock, costMiss: cMiss });
  const best = bestThreshold(d, cBlock, cMiss);
  const rb = evaluate({ d, t: best, costBlock: cBlock, costMiss: cMiss });
  const n = Math.round((T_MAX - T_MIN) / T_STEP);
  const rows = Array.from({ length: n + 1 }, (_, i) => {
    const tt = Math.round((T_MIN + i * T_STEP) * 10) / 10;
    return { tt, c: evaluate({ d, t: tt, costBlock: cBlock, costMiss: cMiss }).cost };
  });
  const max = Math.max(...rows.map((x) => x.c));
  const onBest = Math.abs(t - best) < 0.05;

  return (
    <CacheWidgetFrame title="Block-threshold simulator" hint="1,000,000 payments, 1 in 1,000 is fraud. All inputs illustrative.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Model:</span>
        <Seg label="Model strength" value={d} options={MODELS} onChange={setD} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="e1f-t" className="mb-1 flex justify-between text-xs text-muted">
            <span>Block if score is at or above</span>
            <span className="tabular-nums text-fg">{t.toFixed(1)}</span>
          </label>
          <input id="e1f-t" type="range" min={T_MIN} max={T_MAX} step={T_STEP} value={t} onChange={(e) => setT(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="e1f-b" className="mb-1 flex justify-between text-xs text-muted">
            <span>Cost of one false block</span>
            <span className="tabular-nums text-fg">{usd(cBlock)}</span>
          </label>
          <input id="e1f-b" type="range" min={5} max={200} step={5} value={cBlock} onChange={(e) => setCBlock(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="e1f-m" className="mb-1 flex justify-between text-xs text-muted">
            <span>Cost of one missed fraud</span>
            <span className="tabular-nums text-fg">{usd(cMiss)}</span>
          </label>
          <input id="e1f-m" type="range" min={20} max={2000} step={20} value={cMiss} onChange={(e) => setCMiss(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: onBest ? 'var(--ok)' : 'var(--border)' }} aria-live="polite">
        <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium" style={{ color: onBest ? 'var(--ok)' : 'var(--warn)' }} data-testid="fr-verdict">
            {onBest ? 'This is the cheapest threshold.' : `Cheapest is ${best.toFixed(1)}, at ${usd(rb.cost)}.`}
          </span>
          <span className="font-semibold tabular-nums" data-testid="fr-cost">
            {usd(r.cost)} per million payments
          </span>
        </div>
        <div className="flex h-24 items-end gap-px" role="img" aria-label="Total cost per million payments at each block threshold from 1.0 to 6.0">
          {rows.map((x) => (
            <div key={x.tt} className="flex h-full flex-1 items-end" title={`Threshold ${x.tt.toFixed(1)}: ${usd(x.c)}`}>
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${Math.max(3, (x.c / max) * 100)}%`,
                  background: Math.abs(x.tt - best) < 0.05 ? 'var(--ok)' : 'var(--muted)',
                  opacity: Math.abs(x.tt - t) < 0.05 ? 1 : 0.4,
                  outline: Math.abs(x.tt - t) < 0.05 ? '2px solid var(--accent)' : 'none',
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted">
          <span>1.0 (block a lot)</span>
          <span>6.0 (block almost nothing)</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5">
          <div>
            <dt className="text-xs text-muted">Good payments blocked</dt>
            <dd className="tabular-nums" data-testid="fr-good">{int(r.goodBlocked)} ({pct(r.fpr)})</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Fraud caught</dt>
            <dd className="tabular-nums" data-testid="fr-caught">{int(r.fraudCaught)} ({pct(r.recall, 0)})</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Fraud missed</dt>
            <dd className="tabular-nums" data-testid="fr-missed">{int(r.fraudMissed)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Blocks that were fraud</dt>
            <dd className="tabular-nums" data-testid="fr-prec">{pct(r.precision, 0)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Cheapest threshold</dt>
            <dd className="tabular-nums">{best.toFixed(1)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: a good payment scores around 0 and a fraud payment around the model gap (3, 4, or 5), each with a spread of 1, in made-up score units. Cost = good payments blocked x cost of a false block + fraud missed x cost of a miss. The costs ignore that a blocked customer may never return, and treat every fraud as the same size. The green bar is the cheapest threshold. The accent outline is your setting.
      </p>
    </CacheWidgetFrame>
  );
}
