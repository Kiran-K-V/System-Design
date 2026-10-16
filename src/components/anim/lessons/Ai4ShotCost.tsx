import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { PRICE, shotCost, type Mode } from './Ai4ShotMath';

const money = (v: number) => (v >= 100 ? `$${Math.round(v).toLocaleString('en-US')}` : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(5)}`);

/** Token cost of K examples per call, three ways to place them. Input tokens only. */
export default function Ai4ShotCost() {
  const [k, setK] = useState(5);
  const [tok, setTok] = useState(150);
  const [calls, setCalls] = useState(100000);
  const [hit, setHit] = useState(95);
  const [mode, setMode] = useState<Mode>('fixed-cached');
  const c = shotCost(k, tok, calls, mode, hit / 100);
  const base = shotCost(k, tok, calls, 'fixed-uncached', 0);

  const slider = (id: string, label: string, val: string, min: number, max: number, step: number, v: number, set: (n: number) => void) => (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{val}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );

  return (
    <CacheWidgetFrame title="What K examples cost" hint="Claude Sonnet 5.5 input prices, as of 2026-10-16">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          {slider('a42-k', 'Examples per call (K)', String(k), 0, 20, 1, k, setK)}
          {slider('a42-tok', 'Tokens per example', String(tok), 20, 1000, 10, tok, setTok)}
          {slider('a42-calls', 'Calls per day', calls.toLocaleString('en-US'), 1000, 1000000, 1000, calls, setCalls)}
          <Seg
            label="Where the examples sit"
            value={mode}
            options={[
              { id: 'fixed-uncached', label: 'Fixed, no cache' },
              { id: 'fixed-cached', label: 'Fixed, cached prefix' },
              { id: 'dynamic', label: 'Picked per query' },
            ]}
            onChange={setMode}
          />
          {mode === 'fixed-cached' && slider('a42-hit', 'Cache hit rate', `${hit}%`, 0, 100, 5, hit, setHit)}
        </div>
        <div className="space-y-2" aria-live="polite">
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Extra input tokens per call</div>
            <div data-testid="tok" className="font-mono text-xl">{c.tokensPerCall.toLocaleString('en-US')}</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Extra input cost per call</div>
            <div data-testid="percall" className="font-mono text-xl">{money(c.perCall)}</div>
          </div>
          <div className="rounded-lg border border-line p-3">
            <div className="text-xs text-muted">Extra input cost per day</div>
            <div data-testid="perday" className="font-mono text-xl">{money(c.perDay)}</div>
            {mode === 'fixed-cached' && base.perDay > 0 && (
              <div className="mt-1 text-xs text-muted">Without a cache: {money(base.perDay)} per day. Base ${PRICE.input}, write ${PRICE.write5m}, read ${PRICE.read} per million tokens.</div>
            )}
            {mode === 'dynamic' && <div className="mt-1 text-xs text-muted">Examples change per query, so no shared prefix. Full price on every call.</div>}
          </div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
