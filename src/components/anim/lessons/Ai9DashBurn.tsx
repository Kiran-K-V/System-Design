import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { RULES, burnRate, hoursToEmpty, shareUsed } from './Ai9DashBurnMath';

const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

/** Budget burn: how fast is a month's token budget going, and which alert rule would fire. */
export default function Ai9DashBurn() {
  const [budget, setBudget] = useState(9000);
  const [ruleId, setRuleId] = useState('1h');
  const [spend, setSpend] = useState(180);
  const rule = RULES.find((r) => r.id === ruleId)!;
  const burn = burnRate(spend, budget, rule.hours);
  const empty = hoursToEmpty(spend, budget, rule.hours);
  const share = shareUsed(spend, budget);
  const fires = burn >= rule.burn;

  return (
    <CacheWidgetFrame title="Budget burn: when does the alert fire?" hint="30-day month = 720 hours">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Window</span>
        <Seg label="Alert window" value={ruleId} options={RULES.map((r) => ({ id: r.id, label: r.window }))} onChange={(v) => setRuleId(v)} />
      </div>
      <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <label htmlFor="a9d-budget" className="mb-1 flex justify-between text-xs text-muted">
            <span>Monthly budget</span>
            <span className="tabular-nums text-fg">{usd(budget)}</span>
          </label>
          <input id="a9d-budget" type="range" min={1000} max={50000} step={500} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a9d-spend" className="mb-1 flex justify-between text-xs text-muted">
            <span>Spent in the last {rule.window}</span>
            <span className="tabular-nums text-fg">{usd(spend)}</span>
          </label>
          <input id="a9d-spend" type="range" min={0} max={Math.round(budget * 0.2)} step={10} value={Math.min(spend, Math.round(budget * 0.2))} onChange={(e) => setSpend(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-3" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Share of month budget used</p>
          <p className="mt-1 text-lg font-semibold tabular-nums" data-testid="share">{(share * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Burn rate</p>
          <p className="mt-1 text-lg font-semibold tabular-nums" data-testid="burn">{burn.toFixed(1)}</p>
          <p className="text-xs text-muted">1 means the budget lasts the month</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: fires ? 'var(--bad)' : 'var(--ok)' }}>
          <p className="text-xs uppercase tracking-wide text-muted">Budget empty in</p>
          <p className="mt-1 text-lg font-semibold tabular-nums" data-testid="empty">{Number.isFinite(empty) ? `${empty.toFixed(1)} h` : 'never'}</p>
          <p className="text-xs" style={{ color: fires ? 'var(--bad)' : 'var(--ok)' }}>
            {fires ? `Rule fires: ${rule.action} (burn ${rule.burn} or more)` : `No alert. Rule needs burn ${rule.burn} or more.`}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Burn rate = (spend / budget) / (window hours / 720). The three window and burn pairs come from the SRE workbook's error-budget alerts. Using them on dollars is our own extension.</p>
    </CacheWidgetFrame>
  );
}
