import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { SCENARIOS, gaps, worst, type Verdict } from './AiE1SkewLogic';

const COLOR: Record<Verdict, string> = { ok: 'var(--ok)', watch: 'var(--warn)', bad: 'var(--bad)' };
const WORD: Record<Verdict, string> = { ok: 'within limit', watch: 'watch it', bad: 'engineering error' };
const pct = (v: number) => v.toFixed(2);

/** Pick a cause. See the four scores and the three gaps. The wide gap points at the cause. */
export default function AiE1SkewGaps() {
  const [id, setId] = useState('code');
  const sc = SCENARIOS.find((s) => s.id === id)!;
  const gs = gaps(sc.auc);
  const w = worst(sc.auc);
  const sets = [
    ['Training data', sc.auc.train],
    ['Holdout data', sc.auc.holdout],
    ['Next-day data', sc.auc.nextDay],
    ['Live serving', sc.auc.live],
  ] as const;

  return (
    <CacheWidgetFrame title="Three gaps" hint="Illustrative scores. Pick a cause.">
      <Seg label="Cause" value={id} onChange={setId} options={SCENARIOS.map((s) => ({ id: s.id, label: s.label }))} />
      <p className="mt-3 text-sm" aria-live="polite">{sc.cause}</p>
      <div className="mt-4 space-y-2">
        {sets.map(([name, v]) => (
          <div key={name} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 text-muted">{name}</span>
            <div className="h-2 flex-1 rounded bg-surface">
              <div className="h-2 rounded" style={{ width: `${((v - 0.5) / 0.5) * 100}%`, background: 'var(--accent)' }} />
            </div>
            <span className="w-12 text-right font-mono tabular-nums">{pct(v)}</span>
          </div>
        ))}
        <p className="text-xs text-muted">Bars show AUC from 0.50 (a coin flip) to 1.00.</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {gs.map((g) => (
          <div key={g.id} className="rounded-lg border p-3" style={{ borderColor: g.verdict === 'ok' ? 'var(--border)' : COLOR[g.verdict] }}>
            <div className="text-xs text-muted">{`Gap ${g.id}: ${g.label}`}</div>
            <div className="mt-1 font-mono text-lg tabular-nums" style={{ color: COLOR[g.verdict] }}>{pct(g.size)}</div>
            <div className="text-xs" style={{ color: COLOR[g.verdict] }}>{WORD[g.verdict]}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm">
        {w ? `Look at gap ${w.id} first. ${w.read}` : 'All three gaps are within their limits. Keep measuring them anyway.'}
      </p>
      <p className="mt-2 text-xs text-muted">Limits are illustrative: gap 1 up to 0.10, gap 2 up to 0.03, gap 3 up to 0.01. Gap 3 is the strictest because the same example must score the same offline and live.</p>
    </CacheWidgetFrame>
  );
}
