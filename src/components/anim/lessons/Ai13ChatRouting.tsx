import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { POLICIES, REPLICAS, runAll, type Policy, type PolicyResult } from './Ai13ChatSim';

const NAMES: Record<Policy, string> = { rr: 'Round-robin', sticky: 'Session affinity', cost: 'Cost-based' };
const PRESETS = [
  { id: 'even', label: 'Even traffic', skew: 0, rate: 12, slots: 150 },
  { id: 'skew', label: 'Hot chats', skew: 80, rate: 12, slots: 150 },
  { id: 'tight', label: 'Small cache', skew: 40, rate: 16, slots: 60 },
] as const;

const sec = (n: number) => (Number.isNaN(n) ? 'n/a' : n >= 10 ? `${n.toFixed(0)} s` : n >= 1 ? `${n.toFixed(2)} s` : `${Math.round(n * 1000)} ms`);
const pct = (n: number) => `${Math.round(n * 100)}%`;

function Slider({ id, label, value, min, max, step, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value}{unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

const best = (rs: Record<Policy, PolicyResult>, f: (r: PolicyResult) => number, low = true) => {
  const vals = POLICIES.map((p) => f(rs[p]));
  const target = low ? Math.min(...vals) : Math.max(...vals);
  return POLICIES.find((p) => f(rs[p]) === target);
};

/** Affinity vs round-robin vs cost-based routing on one stream of chat turns. All inputs are illustrative. */
export default function Ai13ChatRouting() {
  const [skew, setSkew] = useState(0);
  const [rate, setRate] = useState(12);
  const [slots, setSlots] = useState(150);
  const rs = useMemo(() => runAll({ skew: skew / 100, rate, slots }), [skew, rate, slots]);

  const rows: { label: string; f: (r: PolicyResult) => number; show: (r: PolicyResult) => string; low: boolean; id: string }[] = [
    { id: 'hit', label: 'Cache hit rate (prompt tokens)', f: (r) => r.hitRate, show: (r) => pct(r.hitRate), low: false },
    { id: 'mean', label: 'Mean TTFT', f: (r) => r.meanTtft, show: (r) => sec(r.meanTtft), low: true },
    { id: 'p95', label: 'P95 TTFT', f: (r) => r.p95Ttft, show: (r) => sec(r.p95Ttft), low: true },
    { id: 'long', label: 'P95 TTFT, prompts over 8K', f: (r) => r.p95TtftLong || Infinity, show: (r) => sec(r.p95TtftLong), low: true },
    { id: 'util', label: 'Busiest replica, busy share', f: (r) => r.hotUtil, show: (r) => pct(r.hotUtil), low: true },
    { id: 'wait', label: 'Busiest replica, P95 queue wait', f: (r) => r.hotWait, show: (r) => sec(r.hotWait), low: true },
  ];

  return (
    <CacheWidgetFrame title="Routing and the cache: one stream, three routers" hint="Illustrative model. Move the sliders.">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Presets:</span>
        <Seg
          label="Preset"
          value={PRESETS.find((p) => p.skew === skew && p.rate === rate && p.slots === slots)?.id ?? 'custom'}
          options={PRESETS.map((p) => ({ id: p.id as string, label: p.label }))}
          onChange={(id) => {
            const p = PRESETS.find((x) => x.id === id)!;
            setSkew(p.skew);
            setRate(p.rate);
            setSlots(p.slots);
          }}
        />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Slider id="a13r-skew" label="Turns from 8 hot chats" value={skew} min={0} max={80} step={10} unit="%" onChange={setSkew} />
        <Slider id="a13r-rate" label="Turns per second, fleet" value={rate} min={4} max={24} step={2} unit="/s" onChange={setRate} />
        <Slider id="a13r-slots" label="Chats of KV per replica" value={slots} min={40} max={200} step={10} unit="" onChange={setSlots} />
      </div>

      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full text-left text-[13px] sm:text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-1.5 pr-2 font-normal">Measure ({REPLICAS} replicas)</th>
              {POLICIES.map((p) => (
                <th key={p} className="px-1 py-1.5 font-normal sm:px-2">{NAMES[p]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const w = best(rs, row.f, row.low);
              return (
                <tr key={row.id} className="border-b border-line/60">
                  <td className="py-1.5 pr-2 text-muted">{row.label}</td>
                  {POLICIES.map((p) => (
                    <td key={p} className="px-1 py-1.5 tabular-nums sm:px-2" data-testid={`rt-${row.id}-${p}`} style={{ color: w === p ? 'var(--ok)' : undefined, fontWeight: w === p ? 600 : 400 }}>
                      {row.show(rs[p])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {POLICIES.map((p) => (
          <div key={p}>
            <div className="mb-1 text-xs text-muted">{NAMES[p]}: share of turns per replica</div>
            <div className="flex h-14 items-end gap-1" role="img" aria-label={`${NAMES[p]} turn share per replica: ${rs[p].share.map((s) => pct(s)).join(', ')}`}>
              {rs[p].share.map((s, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(3, Math.round(s * 56))}px`, background: s > 0.4 ? 'var(--warn)' : 'var(--muted)', opacity: 0.8 }} />
              ))}
            </div>
            <div className="flex gap-1 text-[11px] tabular-nums text-muted">
              {rs[p].share.map((s, i) => (
                <span key={i} className="flex-1 text-center">{pct(s)}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: 4 replicas of 8 cards each, 400 chats that start at a median of 3,000 tokens and grow 300 tokens per turn. Each replica keeps the KV of the chats it served last and drops the least recently used one when full. A replica serves one turn at a time: prefill time at 40% of peak, plus 60 ms of decode share. The 8 hot chats all hash to replica 0 on purpose. These are our assumptions, not measurements. Green marks the best router in each row.
      </p>
    </CacheWidgetFrame>
  );
}
