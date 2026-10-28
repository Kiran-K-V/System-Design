import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { TRUE_CTR, run } from './AiE1AdCalibLogic';

const KEEPS = [1, 0.5, 0.1, 0.01];
const pct = (n: number, d = 2) => `${(n * 100).toFixed(d)}%`;

/** Calibration plot: predicted against real click rate per ad group. Inputs are illustrative. */
export default function AiE1AdCalibPlot() {
  const [ki, setKi] = useState(2);
  const [late, setLate] = useState(0);
  const [fixed, setFixed] = useState(false);
  const r = run({ keep: KEEPS[ki], late: late / 100, fixed });
  const W = 300, H = 240, pad = 34;
  const px = (v: number) => pad + v * (W - pad - 10);
  const py = (v: number) => H - pad - v * (H - pad - 10);
  const off = Math.abs(r.ratio - 1);
  const tone = off < 0.05 ? 'var(--ok)' : 'var(--bad)';
  const verdict = off < 0.05 ? 'Calibrated: predicted clicks match real clicks.' : r.ratio > 1 ? 'Overconfident: the auction overvalues clicks and overcharges.' : 'Underconfident: the auction undervalues clicks and underbids.';

  return (
    <CacheWidgetFrame title="Calibration plot with two kinds of bias" hint="Illustrative model. Move the controls.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="e1c-k" className="mb-1 flex justify-between gap-2 text-xs text-muted">
            <span>Share of no-click examples kept in training</span>
            <span className="tabular-nums text-fg">{pct(KEEPS[ki], KEEPS[ki] < 0.1 ? 0 : 0)}</span>
          </label>
          <input id="e1c-k" type="range" min={0} max={3} step={1} value={ki} onChange={(e) => setKi(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="e1c-l" className="mb-1 flex justify-between gap-2 text-xs text-muted">
            <span>Share of real clicks that arrive too late to be labelled</span>
            <span className="tabular-nums text-fg">{late}%</span>
          </label>
          <input id="e1c-l" type="range" min={0} max={60} step={5} value={late} onChange={(e) => setLate(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={fixed} onChange={(e) => setFixed(e.target.checked)} className="accent-[var(--accent)]" />
        Undo the downsampling at serving (log-odds correction)
      </label>

      <div className="rounded-lg border p-3" style={{ borderColor: tone }} aria-live="polite">
        <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium" style={{ color: tone }} data-testid="cal-verdict">{verdict}</span>
          <span className="font-semibold tabular-nums" data-testid="cal-ratio">predicted / real = {r.ratio.toFixed(2)}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block w-full max-w-[360px]" role="img" aria-label="Predicted click rate against real click rate for six ad groups, with the perfect diagonal for reference">
          <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(1)} stroke="var(--muted)" strokeDasharray="4 4" strokeWidth="1.4" />
          <line x1={px(0)} y1={py(0)} x2={px(1)} y2={py(0)} stroke="var(--border)" strokeWidth="1.4" />
          <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(1)} stroke="var(--border)" strokeWidth="1.4" />
          {r.groups.map((g, i) => (
            <circle key={i} cx={px(Math.min(1, g.actual / 0.1))} cy={py(Math.min(1, g.predicted / 0.1))} r="6" fill={tone} fillOpacity="0.5" stroke={tone} strokeWidth="1.4" />
          ))}
          <text x={px(0.5)} y={H - 6} textAnchor="middle" fontSize="13" fill="var(--muted)">real click rate (0 to 10%)</text>
          <text x={12} y={py(0.5)} textAnchor="middle" fontSize="13" fill="var(--muted)" transform={`rotate(-90 12 ${py(0.5)})`}>predicted (0 to 10%)</text>
        </svg>
        <p className="mt-1 text-center text-xs text-muted">Dots on the dashed line are calibrated. Dots above it are overconfident. Points above 10% are clipped at the top.</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
          {r.groups.map((g, i) => (
            <div key={i}>
              <dt className="text-xs text-muted">Real {pct(TRUE_CTR[i], 1)}</dt>
              <dd className="tabular-nums" data-testid={`cal-g${i}`}>predicted {pct(g.predicted)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: six ad groups, real click rates 0.2% to 8%. The model fits the log it was given exactly. A late click counts as no click. Dropping no-click examples raises every learned rate. The log-odds correction undoes the second effect only. Delay stays, because the fix cannot see clicks that were never labelled.
      </p>
    </CacheWidgetFrame>
  );
}
