import { useMemo, useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { curve, EPS_GRID, LONG_WINDOW, N_GEMS, N_HEAD, N_ITEMS, SHORT_WINDOW, STEPS } from './AiE1VideoExploreLogic';

const W = 720;
const H = 260;
const L = 50;
const R = 16;
const T = 14;
const B = 42;

/** Exploration slider: what a random share of slots costs now and what it buys later. */
export default function AiE1VideoExplore() {
  const pts = useMemo(() => curve(), []);
  const [i, setI] = useState(0);
  const cur = pts[i];
  const yMin = 70;
  const yMax = 135;
  const px = (e: number) => L + (e / 0.4) * (W - L - R);
  const py = (v: number) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  const line = (key: 'short' | 'long') => pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${px(p.eps).toFixed(1)},${py(p[key]).toFixed(1)}`).join(' ');
  const best = pts.reduce((a, p) => (p.long > a.long ? p : a), pts[0]);

  return (
    <CacheWidgetFrame title="Exploration budget: now versus later" hint="illustrative simulation, averaged over 24 worlds">
      <div className="space-y-4 text-sm">
        <div>
          <label htmlFor="e1x-eps" className="mb-1 flex justify-between text-xs text-muted">
            <span>Share of slots spent on random videos</span>
            <span className="tabular-nums text-fg">{Math.round(cur.eps * 100)}%</span>
          </label>
          <input id="e1x-eps" type="range" min={0} max={EPS_GRID.length - 1} step={1} value={i} onChange={(e) => setI(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Short-term and long-term quality against the exploration share">
          {[80, 100, 120].map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeDasharray={v === 100 ? '5 4' : undefined} />
              <text x={L - 8} y={py(v) + 4} textAnchor="end" fontSize={14} fill="var(--muted)">{v}</text>
            </g>
          ))}
          <path d={line('short')} fill="none" stroke="var(--warn)" strokeWidth={2.2} />
          <path d={line('long')} fill="none" stroke="var(--ok)" strokeWidth={2.2} />
          <line x1={px(cur.eps)} x2={px(cur.eps)} y1={T} y2={H - B} stroke="var(--accent)" strokeWidth={1.4} />
          <circle cx={px(cur.eps)} cy={py(cur.short)} r={5} fill="var(--warn)" />
          <circle cx={px(cur.eps)} cy={py(cur.long)} r={5} fill="var(--ok)" />
          {[0, 0.1, 0.2, 0.3, 0.4].map((e) => (
            <text key={e} x={px(e)} y={H - B + 18} textAnchor="middle" fontSize={14} fill="var(--muted)">{Math.round(e * 100)}%</text>
          ))}
          <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize={14} fill="var(--muted)">share of slots spent exploring (quality index, no exploring = 100)</text>
        </svg>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--warn)' }} />Short term: first {SHORT_WINDOW} impressions</li>
          <li className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--ok)' }} />Long term: last {LONG_WINDOW} impressions</li>
        </ul>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Short-term quality</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: cur.short < 99 ? 'var(--warn)' : 'var(--ok)' }} data-testid="e1x-short">{cur.short.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5">
            <div className="text-xs text-muted">Long-term quality</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: cur.long < 100 ? 'var(--bad)' : 'var(--ok)' }} data-testid="e1x-long">{cur.long.toFixed(1)}</div>
          </div>
        </div>
        <div className="rounded-lg border border-line p-3 text-xs text-muted" aria-live="polite">
          Best long-term result in this run: {Math.round(best.eps * 100)}% exploring, index {best.long.toFixed(0)}. At 0% the system never finds the better videos. At 40% it spends so many slots on weak ones that the gain is gone.
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Model, all illustrative. {N_ITEMS} videos, each with a hidden good-watch rate. {N_HEAD} head videos (0.35 to 0.50) have history. {N_GEMS} new videos are better (0.52 to 0.72) and have none. The rest are mostly weak. Each of {STEPS.toLocaleString('en-US')} impressions shows the best-known video, or with the chosen chance a random one, and learns from one good-or-not watch. Real systems explore with smarter rules than a coin flip. The shape is the point: a cost now, a gain later, a peak in between.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
