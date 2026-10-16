import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { TARGETS, costOf, pickRoute, type Difficulty, type Policy, type Target } from './Ai3GwMath';

const fmt$ = (v: number) => (v >= 0.01 ? `$${v.toFixed(3)}` : `$${v.toPrecision(2)}`);

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

/** Routing simulator: toggle target health, pick a policy, see where one request goes and what it costs. */
export default function Ai3GwRouter() {
  const [policy, setPolicy] = useState<Policy>('cost');
  const [diff, setDiff] = useState<Difficulty>('simple');
  const [health, setHealth] = useState<Record<Target['id'], boolean>>({ haiku: true, sonnet: true, opus: true });
  const [inTok, setInTok] = useState(3000);
  const [outTok, setOutTok] = useState(500);

  const r = pickRoute(policy, diff, health, inTok, outTok);
  const ref = r.order[0];

  return (
    <CacheWidgetFrame title="Routing simulator" hint="prices as of 2026-10-16; capability and latency are illustrative">
      <div className="grid gap-4 text-sm md:grid-cols-[17rem_1fr]">
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs text-muted">Routing policy</div>
            <Seg<Policy>
              label="Routing policy"
              value={policy}
              onChange={setPolicy}
              options={[
                { id: 'cost', label: 'Cheapest' },
                { id: 'latency', label: 'Fastest' },
                { id: 'capability', label: 'Strongest' },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Task needs</div>
            <Seg<Difficulty>
              label="Task difficulty"
              value={diff}
              onChange={setDiff}
              options={[
                { id: 'simple', label: 'Simple' },
                { id: 'hard', label: 'Hard' },
              ]}
            />
            <div className="mt-1 text-xs text-muted">Simple: any model will do. Hard: needs Sonnet or Opus (illustrative).</div>
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Provider health</div>
            <div className="space-y-1">
              {TARGETS.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={health[t.id]} onChange={(e) => setHealth({ ...health, [t.id]: e.target.checked })} className="accent-[var(--accent)]" />
                  {t.name} is up
                </label>
              ))}
            </div>
          </div>
          <Slider id="a3gw-in" label="Input tokens" value={inTok} min={500} max={20000} step={500} onChange={setInTok} />
          <Slider id="a3gw-out" label="Output tokens" value={outTok} min={50} max={4000} step={50} onChange={setOutTok} />
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Routed to</div>
              <div className="text-lg font-semibold" style={{ color: r.chosen ? 'var(--accent)' : 'var(--bad)' }}>{r.chosen ? r.chosen.name : '503 from gateway'}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Cost per request</div>
              <div className="text-lg font-semibold tabular-nums">{r.chosen ? fmt$(r.cost) : 'none'}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Latency (illustrative)</div>
              <div className="text-lg font-semibold tabular-nums">{r.chosen ? `${r.latencyMs} ms` : 'none'}</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="mb-2 text-xs text-muted">Route for this policy, tried top to bottom</div>
            <ol className="space-y-1.5">
              {r.order.map((t, idx) => {
                const up = health[t.id];
                const picked = r.chosen?.id === t.id;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2 rounded-md border border-line bg-bg px-2.5 py-1.5" style={picked ? { borderColor: 'var(--accent)' } : undefined}>
                    <span>{idx + 1}. {t.name}</span>
                    <span className="tabular-nums text-xs text-muted">{fmt$(costOf(t, inTok, outTok))} · {t.latencyMs} ms</span>
                    <span className="text-xs font-semibold" style={{ color: picked ? 'var(--ok)' : up ? 'var(--muted)' : 'var(--bad)' }}>
                      {picked ? 'chosen' : up ? 'standby' : 'down, skipped'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: r.fellBack || !r.chosen ? 'var(--warn)' : 'var(--muted)' }}>
            {!r.chosen
              ? 'No capable provider is up. The gateway has nothing safe to try. Returning an error is better than sending a hard task to a model that cannot do it.'
              : r.fellBack
                ? `Fallback: ${ref.name} was the first choice but is down. The answer comes from ${r.chosen.name}. Cost changes by ${fmt$(Math.abs(r.cost - costOf(ref, inTok, outTok)))} per request, and the prompt must have been evaluated on ${r.chosen.name}.`
                : 'First choice is healthy. No fallback.'}
          </p>
          <p className="text-xs leading-relaxed text-muted">
            Cost = (input tokens x input price + output tokens x output price) / 1,000,000, at the standard prices (Haiku 5.5 at the 100K-prompt-or-less tier). The capability level and latency of each model are made-up numbers for the demo.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
