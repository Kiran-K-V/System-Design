import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { OLD_ORDER, pairAgreement, rerank, rows } from './AiE1PositionBiasLogic';

const W = 720;
const H = 240;
const L = 50;
const R = 16;
const T = 14;
const B = 46;
const LETTER = 'ABCDEFGHIJ';
type Mode = 'raw' | 'adj';

/** Position-bias click curves: raw click rate copies the old ranking, a debiased rate does not. */
export default function AiE1PositionBias() {
  const [eta, setEta] = useState(1);
  const [mode, setMode] = useState<Mode>('raw');
  const r = useMemo(() => rows(eta), [eta]);
  const order = useMemo(() => rerank(eta, mode === 'adj'), [eta, mode]);
  const oldAgree = pairAgreement(OLD_ORDER);
  const newAgree = pairAgreement(order);
  const val = (x: (typeof r)[number]) => (mode === 'adj' ? x.adj : x.ctr);
  const yMax = 0.65;
  const bw = (W - L - R) / r.length;
  const py = (v: number) => T + (1 - v / yMax) * (H - T - B);

  return (
    <CacheWidgetFrame title="Position bias in click logs" hint="illustrative model">
      <div className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="e1pb-eta" className="mb-1 flex justify-between text-xs text-muted">
              <span>Position bias (how fast looking drops by position)</span>
              <span className="tabular-nums text-fg">{eta.toFixed(1)}</span>
            </label>
            <input id="e1pb-eta" type="range" min={0} max={1.5} step={0.1} value={eta} onChange={(e) => setEta(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <Seg label="Score each result by" value={mode} options={[{ id: 'raw', label: 'Raw click rate' }, { id: 'adj', label: 'Click rate / look chance' }]} onChange={setMode} />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Score of each result by position on the old ranking, with its true relevance marked">
          {[0, 0.2, 0.4, 0.6].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--border)" />
              <text x={L - 8} y={py(v) + 4} textAnchor="end" fontSize={14} fill="var(--muted)">{v.toFixed(1)}</text>
            </g>
          ))}
          {r.map((x, k) => {
            const cx = L + bw * k + bw / 2;
            return (
              <g key={x.pos}>
                <rect x={cx - bw * 0.3} y={py(val(x))} width={bw * 0.6} height={H - B - py(val(x))} fill="var(--accent)" opacity={0.75} />
                <line x1={cx - bw * 0.4} x2={cx + bw * 0.4} y1={py(x.rel)} y2={py(x.rel)} stroke="var(--ok)" strokeWidth={2.2} />
                <text x={cx} y={H - B + 18} textAnchor="middle" fontSize={14} fill="var(--fg)">{LETTER[x.id]}</text>
                <text x={cx} y={H - B + 34} textAnchor="middle" fontSize={14} fill="var(--muted)">#{x.pos}</text>
              </g>
            );
          })}
        </svg>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--accent)' }} />Score the model sees (bars)</li>
          <li className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: 'var(--ok)' }} />True relevance (A is best)</li>
          <li className="text-muted">Letters: result. #: position the old ranker gave it.</li>
        </ul>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Old ranking, pairs in the right order</div>
            <div className="text-lg font-semibold tabular-nums">{Math.round(oldAgree * 100)}%</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">New ranking from these scores</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: newAgree > oldAgree + 0.001 ? 'var(--ok)' : 'var(--warn)' }} data-testid="e1pb-new">{Math.round(newAgree * 100)}%</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">New order</div>
            <div className="font-mono text-base tracking-wider" data-testid="e1pb-order">{order.map((i) => LETTER[i]).join(' ')}</div>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Model, illustrative. Ten results with true relevance from 0.60 (A) down to 0.15 (J). A user looks at position k with chance 1 divided by k to the power of the bias. A look turns into a click with the result&apos;s relevance. The old ranker put the results in a partly wrong order. With raw click rate, a good result stuck low looks bad, so the new ranking copies the old one. Dividing by the look chance needs the bias to be known. A real system must estimate it, for example from a small randomized slice.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
