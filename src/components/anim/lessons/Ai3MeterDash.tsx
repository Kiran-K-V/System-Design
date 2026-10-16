import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { PRICES, monthly, status, steadyCost, type Price, type Status } from './Ai3MeterMath';

const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;
const TONE: Record<Status, string> = { ok: 'var(--ok)', warn: 'var(--warn)', over: 'var(--bad)' };
const LABEL: Record<Status, string> = { ok: 'on track', warn: 'ALERT', over: 'OVER BUDGET' };

function Slider({ id, label, value, min, max, step, fmt, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; fmt?: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{fmt ? fmt(value) : value.toLocaleString('en-US')}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const TENANTS = [
  { id: 'acme', name: 'Acme', perDay: 60000, budget: 20000 },
  { id: 'birch', name: 'Birch', perDay: 20000, budget: 8000 },
  { id: 'cobalt', name: 'Cobalt', perDay: 5000, budget: 3000 },
];

/** Tenant cost dashboard: one price per request, three tenants, budgets with an alert threshold. */
export default function Ai3MeterDash() {
  const [modelId, setModelId] = useState<Price['id']>('sonnet');
  const [inTok, setInTok] = useState(3000);
  const [outTok, setOutTok] = useState(500);
  const [hit, setHit] = useState(0);
  const [alertAt, setAlertAt] = useState(80);
  const [perDay, setPerDay] = useState<Record<string, number>>(Object.fromEntries(TENANTS.map((t) => [t.id, t.perDay])));

  const p = PRICES.find((x) => x.id === modelId)!;
  const per = steadyCost(inTok, outTok, hit / 100, p);
  const rows = TENANTS.map((t) => {
    const spend = monthly(perDay[t.id], per);
    return { ...t, spend, st: status(spend, t.budget, alertAt / 100) };
  });
  const sum = rows.reduce((a, r) => a + r.spend, 0);

  return (
    <CacheWidgetFrame title="Tenant cost dashboard" hint="prices as of 2026-10-16, 30-day month">
      <div className="grid gap-4 text-sm md:grid-cols-[17rem_1fr]">
        <div className="space-y-3">
          <div>
            <label htmlFor="a3m-model" className="mb-1 block text-xs text-muted">Model</label>
            <select id="a3m-model" value={modelId} onChange={(e) => setModelId(e.target.value as Price['id'])} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {PRICES.map((x) => (
                <option key={x.id} value={x.id}>{x.name} (${x.input} in, ${x.output} out)</option>
              ))}
            </select>
          </div>
          <Slider id="a3m-in" label="Input tokens per request" value={inTok} min={500} max={20000} step={500} onChange={setInTok} />
          <Slider id="a3m-out" label="Output tokens per request" value={outTok} min={50} max={4000} step={50} onChange={setOutTok} />
          <Slider id="a3m-hit" label="Share of prompt read from cache" value={hit} min={0} max={90} step={10} fmt={(v) => `${v}%`} onChange={setHit} />
          <Slider id="a3m-alert" label="Alert at share of budget" value={alertAt} min={50} max={100} step={5} fmt={(v) => `${v}%`} onChange={setAlertAt} />
          {TENANTS.map((t) => (
            <Slider key={t.id} id={`a3m-${t.id}`} label={`${t.name}: requests per day`} value={perDay[t.id]} min={0} max={150000} step={5000} onChange={(v) => setPerDay({ ...perDay, [t.id]: v })} />
          ))}
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Cost per request</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="per">${per.toFixed(5)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">All tenants, per month</div>
              <div className="text-lg font-semibold tabular-nums" data-testid="sum">{usd(sum)}</div>
            </div>
          </div>
          {rows.map((r) => {
            const pct = (r.spend / r.budget) * 100;
            return (
              <div key={r.id} className="rounded-lg border border-line bg-surface p-3" data-testid={`row-${r.id}`}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs font-semibold" style={{ color: TONE[r.st] }}>{LABEL[r.st]}</span>
                </div>
                <div className="mb-1 flex justify-between text-xs text-muted">
                  <span className="tabular-nums">{usd(r.spend)} of {usd(r.budget)}</span>
                  <span className="tabular-nums">{Math.round(pct)}%</span>
                </div>
                <div className="relative h-3 rounded-full bg-line" role="img" aria-label={`${r.name} has used ${Math.round(pct)} percent of its budget`}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: TONE[r.st] }} />
                  <div className="absolute top-[-2px] h-[16px] w-[2px] bg-fg" style={{ left: `${alertAt}%` }} aria-hidden="true" />
                </div>
              </div>
            );
          })}
          <p className="text-xs leading-relaxed text-muted">
            Monthly spend = requests per day x 30 x cost per request. With a cache share h, a share h of the input tokens is billed at the cache-read price and the rest at the input price. The model assumes the cache is already written, so write cost is left out. The thin line is the alert threshold.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
