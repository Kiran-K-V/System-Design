import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { BUDGET, RULES, WINDOW_DAYS, burnRate, hoursToExhaust, minutesToFire, spentAtFire } from './relBurn';

/**
 * Error budget and burn rate for a 99.9% SLO over 30 days.
 * Alert rules are the multiwindow burn-rate rules from the Google SRE workbook, "Alerting on SLOs".
 */

const RATES = [0.0005, 0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.5, 1];

const fmtPct = (r: number) => `${+(r * 100).toFixed(2)}%`;

function fmtDuration(min: number): string {
  if (min < 1) return `${Math.round(min * 60)} s`;
  if (min < 120) return `${Math.round(min)} min`;
  const h = min / 60;
  if (h < 48) return `${+h.toFixed(1)} h`;
  return `${+(h / 24).toFixed(1)} days`;
}

export default function RelBurnRate() {
  const [ri, setRi] = useState(5);
  const err = RATES[ri];
  const burn = burnRate(err);
  const exhaustMin = hoursToExhaust(burn) * 60;
  const fires = RULES.map((r) => ({ rule: r, at: minutesToFire(burn, r) }));
  const first = fires.filter((f) => f.at !== null).sort((a, b) => a.at! - b.at!)[0];
  const spentFirst = first ? spentAtFire(first.rule) : 0;

  return (
    <CacheWidgetFrame
      title="Error budget burn rate"
      hint={`SLO 99.9% over ${WINDOW_DAYS} days, so the budget is ${fmtPct(BUDGET)} of requests`}
      caption={
        <>
          Burn rate is the error rate divided by the error budget rate. At burn 1 the budget lasts exactly {WINDOW_DAYS} days. At burn 10 it lasts 3 days. The three rules come from the Google SRE workbook. A rule fires when the burn rate stays above its
          threshold over both a long window and a short window. Model: the error rate is constant from the first minute and was 0 before. Time to fire = long window x threshold / burn rate. The budget spent when it fires is fixed by the rule:
          14.4 x 1 h / 720 h = 2%.
        </>
      }
    >
      <label className="block text-sm">
        <span className="flex justify-between">
          <span>Share of requests that fail, starting now</span>
          <span className="font-mono tabular-nums">{fmtPct(err)}</span>
        </span>
        <input type="range" min={0} max={RATES.length - 1} step={1} value={ri} onChange={(e) => setRi(+e.target.value)} aria-label="Share of requests that fail" className="mt-1 w-full accent-[var(--accent)]" />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-line px-2 py-2">
          <div className={`text-2xl font-semibold tabular-nums ${burn >= 14.4 ? 'text-bad' : burn >= 1 ? 'text-warn' : 'text-ok'}`}>{+burn.toFixed(1)}x</div>
          <div className="text-xs text-muted">burn rate</div>
        </div>
        <div className="rounded-lg border border-line px-2 py-2">
          <div className="text-2xl font-semibold tabular-nums">{burn <= 1 ? 'never' : fmtDuration(exhaustMin)}</div>
          <div className="text-xs text-muted">{burn <= 1 ? 'budget lasts the full 30 days' : 'until the 30-day budget is gone'}</div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 pr-2 font-medium">Rule</th>
              <th className="py-1 pr-2 font-medium">Burn at least</th>
              <th className="py-1 pr-2 font-medium">Long / short window</th>
              <th className="py-1 pr-2 font-medium">Action</th>
              <th className="py-1 text-right font-medium">Fires after</th>
            </tr>
          </thead>
          <tbody>
            {fires.map(({ rule, at }) => (
              <tr key={rule.name} className="border-t border-line">
                <td className="py-1.5 pr-2">{rule.name}</td>
                <td className="py-1.5 pr-2 font-mono tabular-nums">{rule.burn}</td>
                <td className="py-1.5 pr-2 font-mono tabular-nums">{rule.longLabel} / {rule.shortLabel}</td>
                <td className="py-1.5 pr-2">{rule.kind === 'page' ? 'page someone' : 'open a ticket'}</td>
                <td className={`py-1.5 text-right font-mono tabular-nums ${at === null ? 'text-muted' : rule.kind === 'page' ? 'text-bad' : 'text-warn'}`}>{at === null ? 'never' : fmtDuration(at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 mt-3 text-sm">
        {first ? (
          <>
            First alert: <strong>{first.rule.name}</strong> after {fmtDuration(first.at!)}, when <strong>{+spentFirst.toFixed(1)}%</strong> of the monthly budget is gone.
          </>
        ) : (
          <>No rule fires. This error rate is within the budget, so nobody is woken up.</>
        )}
      </p>
    </CacheWidgetFrame>
  );
}
