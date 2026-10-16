import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { LEN_PAIRS, keepPairs, lenStats } from './Ai11PrefLogic';

const MAX = 600;

/** Slider: drop pairs whose answers differ a lot in length, and watch the "longer wins" rate fall toward 50%. */
export default function Ai11PrefLenLab() {
  const [gap, setGap] = useState(100);
  const keep = keepPairs(LEN_PAIRS, gap / 100);
  const st = lenStats(LEN_PAIRS, keep);
  const all = lenStats(LEN_PAIRS, keepPairs(LEN_PAIRS, 1));
  const tone = st.longerWins > 0.62 ? 'var(--bad)' : 'var(--ok)';

  return (
    <CacheWidgetFrame title="Does your pair data teach length?" hint="Illustrative: 16 made-up pairs, token counts">
      <div className="mb-4">
        <label htmlFor="a11-gap" className="mb-1 flex justify-between text-xs text-muted">
          <span>Keep pairs whose lengths differ by at most</span>
          <span className="tabular-nums text-fg">{gap === 100 ? 'any gap (all pairs)' : `${gap}%`}</span>
        </label>
        <input id="a11-gap" type="range" min={10} max={100} step={10} value={gap} onChange={(e) => setGap(+e.target.value)} className="w-full accent-[var(--accent)]" />
      </div>
      <div className="rounded-lg border border-line bg-surface p-3" role="img" aria-label="Length of the chosen and rejected answer in each of 16 pairs. Kept pairs are solid.">
        <div className="flex h-28 items-end gap-1">
          {LEN_PAIRS.map((p, i) => (
            <div key={i} className="flex h-full min-w-0 flex-1 items-end gap-px" style={{ opacity: keep[i] ? 1 : 0.18 }}>
              <div className="min-w-0 flex-1" style={{ height: `${(p.chosen / MAX) * 100}%`, background: 'var(--ok)' }} title={`pair ${i + 1} chosen: ${p.chosen} tokens`} />
              <div className="min-w-0 flex-1" style={{ height: `${(p.rejected / MAX) * 100}%`, background: 'var(--bad)' }} title={`pair ${i + 1} rejected: ${p.rejected} tokens`} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Each pair: left bar is the chosen answer (green), right bar is the rejected one (red). Faded pairs are dropped.</p>
      </div>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Pairs kept</p>
          <p className="mt-1 font-mono text-lg">{st.kept} of {LEN_PAIRS.length}</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: tone }}>
          <p className="text-xs uppercase tracking-wide text-muted">Chosen is the longer one</p>
          <p className="mt-1 font-mono text-lg" style={{ color: tone }}>{st.kept ? `${Math.round(st.longerWins * 100)}%` : 'n/a'}</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Mean chosen minus rejected</p>
          <p className="mt-1 font-mono text-lg">{st.kept ? `${Math.round(st.meanGap) > 0 ? '+' : ''}${Math.round(st.meanGap)} tokens` : 'n/a'}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        All 16 pairs: the chosen answer is longer {Math.round(all.longerWins * 100)}% of the time, by {Math.round(all.meanGap)} tokens on average. A rule that always picks the longer answer would match the label {Math.round(all.longerWins * 100)}% of the time. A model trained on these pairs can earn reward by getting longer. Length-matched pairs sit near 50%, so length stops being the signal.
      </p>
    </CacheWidgetFrame>
  );
}
