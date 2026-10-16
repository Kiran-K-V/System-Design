import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { PRICES, breakEven } from './Ai11WhenMath';

function Slider({ id, label, value, min, max, step, show, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const usd = (n: number) => `$${n >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(n >= 1 ? 2 : 4)}`;

export default function Ai11WhenBreakeven() {
  const [pid, setPid] = useState('sonnet');
  const [req, setReq] = useState(200000);
  const [before, setBefore] = useState(3000);
  const [after, setAfter] = useState(300);
  const [hit, setHit] = useState(0);
  const [prem, setPrem] = useState(1);
  const [once, setOnce] = useState(20000);
  const price = PRICES.find((p) => p.id === pid)!;
  const o = breakEven({ reqPerDay: req, tokensBefore: before, tokensAfter: after, price, hitShare: hit / 100, premium: prem, oneTimeUsd: once });
  const good = Number.isFinite(o.days);
  const tone = !good ? 'var(--bad)' : o.days <= 90 ? 'var(--ok)' : 'var(--warn)';

  return (
    <CacheWidgetFrame title="Does a shorter prompt pay for the tuning?" hint="Input tokens only. Illustrative inputs.">
      <div className="mb-3">
        <Seg label="Model price" value={pid} options={PRICES.map((p) => ({ id: p.id, label: p.label }))} onChange={setPid} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Slider id="a11w-req" label="Requests per day" value={req} min={10000} max={2000000} step={10000} show={req.toLocaleString('en-US')} onChange={setReq} />
        <Slider id="a11w-bef" label="Prompt tokens before" value={before} min={500} max={8000} step={100} show={before.toLocaleString('en-US')} onChange={setBefore} />
        <Slider id="a11w-aft" label="Prompt tokens after tuning" value={after} min={50} max={2000} step={50} show={after.toLocaleString('en-US')} onChange={setAfter} />
        <Slider id="a11w-hit" label="Prompt-cache hit share" value={hit} min={0} max={95} step={5} show={`${hit}%`} onChange={setHit} />
        <Slider id="a11w-prem" label="Price multiplier for the tuned model (assumption)" value={prem} min={1} max={3} step={0.25} show={`${prem}x`} onChange={setPrem} />
        <Slider id="a11w-once" label="One-time cost: data, training, evals (assumption)" value={once} min={2000} max={100000} step={2000} show={usd(once)} onChange={setOnce} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border p-3" style={{ borderColor: tone }}>
          <p className="text-xs uppercase tracking-wide text-muted">Break-even</p>
          <p className="mt-1 font-medium" style={{ color: tone }} data-testid="be-days">
            {good ? `${Math.ceil(o.days).toLocaleString('en-US')} days` : 'Never: the tuned prompt costs as much or more'}
          </p>
          <p className="mt-1 font-mono text-[13px]">
            saved per request: {usd(o.savePerReq)} · per day: {usd(o.savePerDay)}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3 font-mono text-[13px]" data-testid="be-detail">
          <p>effective input price: ${o.eff.toFixed(3)} per M tokens</p>
          <p>input cost per request, before: {usd(o.before)}</p>
          <p>input cost per request, after: {usd(o.after)}</p>
        </div>
        <p className="text-muted">
          Model: cost per request = prompt tokens x effective price, where effective price = hit share x cache-hit price + (1 - hit share) x list price. Prices are Claude API list prices as of 2026-10-16. Cache-write cost, output tokens, and any hosting fee for the tuned model are left out, except through the multiplier. Slide the cache-hit share up and watch the break-even move out.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
