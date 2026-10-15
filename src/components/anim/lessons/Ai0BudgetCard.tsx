import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { API_MODELS, costPerRequest, dailyCap } from './ai0Math';

const fmt$ = (v: number) => (v >= 1 ? `$${Math.round(v).toLocaleString('en-US')}` : `$${v.toPrecision(2)}`);

function Slider({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value.toLocaleString('en-US')}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Budget card: pick a model and a request size, see cost per request against a cap. */
export default function Ai0BudgetCard() {
  const [modelId, setModelId] = useState('sonnet55');
  const [inTok, setInTok] = useState(2000);
  const [outTok, setOutTok] = useState(500);
  const [calls, setCalls] = useState(1);
  const [reqs, setReqs] = useState(1_000_000);
  const [cap, setCap] = useState(0.01);

  const m = API_MODELS.find((x) => x.id === modelId)!;
  const per = costPerRequest(m, inTok, outTok) * calls;
  const ok = per <= cap;
  const daily = per * reqs;
  const limit = dailyCap(reqs, cap);

  return (
    <CacheWidgetFrame title="Budget card" hint="USD per 1M tokens, standard tier, as of 2026-10-15">
      <div className="grid gap-4 text-sm md:grid-cols-[16rem_1fr]">
        <div className="space-y-3">
          <div>
            <label htmlFor="a0-model" className="mb-1 block text-xs text-muted">Model</label>
            <select id="a0-model" value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {API_MODELS.map((x) => (
                <option key={x.id} value={x.id}>{x.provider} {x.name} (${x.input} in, ${x.output} out)</option>
              ))}
            </select>
          </div>
          <Slider id="a0-in" label="Input tokens per call" value={inTok} min={200} max={20000} step={200} onChange={setInTok} />
          <Slider id="a0-out" label="Output tokens per call" value={outTok} min={50} max={4000} step={50} onChange={setOutTok} />
          <Slider id="a0-calls" label="Model calls per request" value={calls} min={1} max={10} step={1} onChange={setCalls} />
          <Slider id="a0-reqs" label="Requests per day" value={reqs} min={10000} max={5000000} step={10000} onChange={setReqs} />
          <div>
            <label htmlFor="a0-cap" className="mb-1 block text-xs text-muted">Cap per request</label>
            <select id="a0-cap" value={cap} onChange={(e) => setCap(+e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm">
              {[0.001, 0.005, 0.01, 0.02, 0.05].map((c) => (
                <option key={c} value={c}>${c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-3">
              <div className="text-xs text-muted">Cost per request</div>
              <div className={`text-2xl font-semibold tabular-nums ${ok ? 'text-ok' : 'text-bad'}`}>{fmt$(per)}</div>
              <div className="text-xs text-muted">{ok ? 'Inside the cap.' : `Over the cap by ${(per / cap).toFixed(1)}x.`}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3">
              <div className="text-xs text-muted">Daily spend vs daily cap</div>
              <div className={`text-2xl font-semibold tabular-nums ${ok ? 'text-ok' : 'text-bad'}`}>{fmt$(daily)}</div>
              <div className="text-xs text-muted">cap {fmt$(limit)} per day</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Budget used</span>
              <span className="tabular-nums">{Math.round((per / cap) * 100)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={`${Math.round((per / cap) * 100)} percent of the cap`}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (per / cap) * 100)}%`, background: ok ? 'var(--ok)' : 'var(--bad)' }} />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Cost per request = calls x (input tokens x input price + output tokens x output price) / 1,000,000. Prices ignore caching and batch discounts. Quality and latency are not shown: a model that fits the budget may still miss the quality bar.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
