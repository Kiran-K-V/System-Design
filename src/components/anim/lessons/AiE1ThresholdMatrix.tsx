import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { TOTAL, auc, matrix } from './AiE1MetricsLogic';

const SHARES = [
  { id: 0.5, label: '50% positive' },
  { id: 0.1, label: '10% positive' },
  { id: 0.01, label: '1% positive' },
];
const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
const n = (v: number) => Math.round(v).toLocaleString('en-US');

/** Threshold slider on a fixed model. Moves the confusion matrix, precision and recall. AUC stays put. */
export default function AiE1ThresholdMatrix() {
  const [t, setT] = useState(0.5);
  const [share, setShare] = useState<number>(0.1);
  const m = matrix(t, share);
  const cells = [
    { name: 'True positive', hint: 'flagged, and bad', v: m.tp, color: 'var(--ok)' },
    { name: 'False positive', hint: 'flagged, but fine', v: m.fp, color: 'var(--warn)' },
    { name: 'False negative', hint: 'missed a bad one', v: m.fn, color: 'var(--bad)' },
    { name: 'True negative', hint: 'passed, and fine', v: m.tn, color: 'var(--muted)' },
  ];
  return (
    <CacheWidgetFrame title="One model, one threshold" hint={`1,000 cases per picture. Illustrative scores.`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="e16-thr" className="mb-1 flex justify-between text-xs text-muted">
            <span>Flag a case when the score is above</span>
            <span className="tabular-nums text-fg">{t.toFixed(2)}</span>
          </label>
          <input id="e16-thr" type="range" min={0.1} max={0.9} step={0.01} value={t} onChange={(e) => setT(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <Seg label="Share of truly bad cases" value={share} onChange={setShare} options={SHARES} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2" aria-live="polite">
        {cells.map((c) => (
          <div key={c.name} className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">{`${c.name} (${c.hint})`}</div>
            <div className="mt-1 font-mono text-lg tabular-nums" style={{ color: c.color }}>{n(c.v)}</div>
            <div className="mt-1 h-1.5 rounded bg-surface"><div className="h-1.5 rounded" style={{ width: `${(c.v / TOTAL) * 100}%`, background: c.color }} /></div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
        <div><span className="text-muted">Precision </span><span className="font-mono tabular-nums">{pct(m.precision)}</span></div>
        <div><span className="text-muted">Recall </span><span className="font-mono tabular-nums">{pct(m.recall)}</span></div>
        <div><span className="text-muted">Accuracy </span><span className="font-mono tabular-nums">{pct(m.accuracy)}</span></div>
        <div><span className="text-muted">AUC </span><span className="font-mono tabular-nums">{auc().toFixed(2)}</span></div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Precision: of the cases flagged, how many were truly bad. Recall: of the truly bad cases, how many were flagged. AUC does not move with the threshold or with the share of bad cases. Precision and accuracy do.
      </p>
      <p className="mt-2 text-xs text-muted">Model: bad and fine cases both have normal score curves with the same spread; the bad curve sits higher. The numbers are expected counts, not a sample.</p>
    </CacheWidgetFrame>
  );
}
