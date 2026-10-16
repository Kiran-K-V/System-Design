import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { evalSizeFor, halfWidth, sliceCount } from './Ai11DistillLogic';

/** Slider: how many examples of a rare slice does your test set hold, and how precise is the score on them? */
export default function Ai11DistillSlice() {
  const [size, setSize] = useState(500);
  const [share, setShare] = useState(3);
  const n = sliceCount(size, share / 100);
  const hw = halfWidth(Math.floor(n));
  const need = evalSizeFor(share / 100, 100);
  const tone = n < 30 ? 'var(--bad)' : n < 100 ? 'var(--warn)' : 'var(--ok)';

  return (
    <CacheWidgetFrame title="How big must the test set be to see a rare slice?" hint="Test set sampled in proportion to traffic">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="a11-size" className="mb-1 flex justify-between text-xs text-muted">
            <span>Test set size (questions)</span>
            <span className="tabular-nums text-fg">{size.toLocaleString('en-US')}</span>
          </label>
          <input id="a11-size" type="range" min={100} max={5000} step={100} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a11-share" className="mb-1 flex justify-between text-xs text-muted">
            <span>Share of real traffic in the rare slice</span>
            <span className="tabular-nums text-fg">{share}%</span>
          </label>
          <input id="a11-share" type="range" min={1} max={20} step={1} value={share} onChange={(e) => setShare(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border p-3" style={{ borderColor: tone }}>
          <p className="text-xs uppercase tracking-wide text-muted">Rare questions in the test set</p>
          <p className="mt-1 font-mono text-lg" style={{ color: tone }}>{n.toFixed(n < 10 ? 1 : 0)}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Score on that slice is off by up to</p>
          <p className="mt-1 font-mono text-lg">{`±${Math.round(hw * 100)} points`}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Test size for 100 rare questions</p>
          <p className="mt-1 font-mono text-lg">{need.toLocaleString('en-US')}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: the 95% error bar on a score is about 1.96 x sqrt(0.5 x 0.5 / n), the worst case (a true score of 50%). With 100 rare questions the bar is about plus or minus 10 points. With 15 it is about plus or minus 25. The cheap fix is to collect rare slices on purpose and keep them as their own test set, not to grow the whole test set.
      </p>
    </CacheWidgetFrame>
  );
}
