import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { pInformative, samplesPerSignal } from './Ai11RftLogic';

const PS = Array.from({ length: 19 }, (_, i) => (i + 1) * 5);

/** Pass rate and group size: how often does a group of samples contain both a right and a wrong answer? */
export default function Ai11RftSignal() {
  const [p, setP] = useState(20);
  const [g, setG] = useState(8);
  const q = pInformative(p / 100, g);
  const cost = samplesPerSignal(p / 100, g);
  const tone = q < 0.5 ? 'var(--bad)' : q < 0.9 ? 'var(--warn)' : 'var(--ok)';

  return (
    <CacheWidgetFrame title="Which prompts teach the model anything?" hint="Assumes every sample is right with the same chance, independently">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="a11-p" className="mb-1 flex justify-between text-xs text-muted">
            <span>Pass rate on this prompt (share of samples that are right)</span>
            <span className="tabular-nums text-fg">{p}%</span>
          </label>
          <input id="a11-p" type="range" min={1} max={99} step={1} value={p} onChange={(e) => setP(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a11-g" className="mb-1 flex justify-between text-xs text-muted">
            <span>Samples per prompt (group size)</span>
            <span className="tabular-nums text-fg">{g}</span>
          </label>
          <input id="a11-g" type="range" min={2} max={64} step={1} value={g} onChange={(e) => setG(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <div className="rounded-lg border border-line bg-surface p-3">
        <p className="mb-2 text-xs text-muted">Chance the group has both a right and a wrong answer, for each pass rate (your pass rate is highlighted).</p>
        <div className="flex h-24 items-end gap-1" role="img" aria-label="Chance a group gives a learning signal at each pass rate">
          {PS.map((x) => {
            const here = Math.abs(x - p) < 2.5;
            return <div key={x} className="min-w-0 flex-1" style={{ height: `${Math.max(pInformative(x / 100, g) * 100, 1)}%`, background: here ? tone : 'var(--accent)', opacity: here ? 1 : 0.4 }} title={`pass rate ${x}%`} />;
          })}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>pass rate 5%</span>
          <span>95%</span>
        </div>
      </div>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2" aria-live="polite">
        <div className="rounded-lg border p-3" style={{ borderColor: tone }}>
          <p className="text-xs uppercase tracking-wide text-muted">Groups that teach something</p>
          <p className="mt-1 font-mono text-lg" style={{ color: tone }}>{(q * 100).toFixed(q < 0.1 ? 1 : 0)}%</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Samples paid for, per useful group</p>
          <p className="mt-1 font-mono text-lg">{Number.isFinite(cost) ? cost.toFixed(1) : 'none'}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: a group is useful when it holds at least one right and one wrong answer. That chance is 1 - p^G - (1-p)^G. Real prompts differ in difficulty, so treat this as a floor for planning, not a forecast.
      </p>
    </CacheWidgetFrame>
  );
}
