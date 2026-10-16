import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { simulate, turnCost, type Scenario, type Stop } from './Ai7LoopLogic';

const SCEN: { id: Scenario; label: string }[] = [
  { id: 'healthy', label: 'Healthy (done at turn 6)' },
  { id: 'stuck', label: 'Stuck (repeats a call)' },
  { id: 'oscillate', label: 'Oscillating (A, B, A, B)' },
];

const STOP: Record<Stop, { label: string; color: string }> = {
  done: { label: 'The model said it was done', color: 'var(--ok)' },
  stuck: { label: 'Stuck detector fired', color: 'var(--warn)' },
  budget: { label: 'Budget cap fired', color: 'var(--bad)' },
  max_turns: { label: 'Turn cap fired', color: 'var(--bad)' },
};

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

export default function Ai7LoopSim() {
  const [scenario, setScenario] = useState<Scenario>('stuck');
  const [maxTurns, setMaxTurns] = useState(20);
  const [budget, setBudget] = useState(0.5);
  const [detector, setDetector] = useState(false);
  const [k, setK] = useState(3);
  const o = simulate({ scenario, maxTurns, budget, detector, k });
  const st = STOP[o.stop];
  const healthyCost = simulate({ scenario: 'healthy', maxTurns: 99, budget: 99, detector: false, k }).cost;
  const wasted = scenario === 'healthy' ? 0 : Math.max(0, o.cost - healthyCost);
  const scale = Math.max(o.cost, budget, 0.1) * 1.05;

  return (
    <CacheWidgetFrame title="Loop control simulator" hint="Illustrative. Context starts at 10,000 tokens and grows 3,000 per turn.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Scenario" value={scenario} options={SCEN} onChange={setScenario} />
        <Seg label="Stuck detector" value={detector ? 1 : 0} options={[{ id: 0, label: 'Detector off' }, { id: 1, label: 'Detector on' }]} onChange={(v) => setDetector(v === 1)} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Slider id="a7l-t" label="Turn cap" value={maxTurns} min={1} max={60} step={1} show={`${maxTurns} turns`} onChange={setMaxTurns} />
        <Slider id="a7l-b" label="Budget cap" value={budget} min={0.05} max={2} step={0.05} show={`$${budget.toFixed(2)}`} onChange={setBudget} />
        <Slider id="a7l-k" label="Detector: same call n times" value={k} min={2} max={6} step={1} show={`${k} times`} onChange={setK} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border p-3" style={{ borderColor: st.color }}>
          <p className="text-xs uppercase tracking-wide text-muted">Why the loop stopped</p>
          <p className="mt-1 font-medium" style={{ color: st.color }}>{st.label}</p>
          <p className="mt-1 font-mono text-[13px]">
            turns: {o.turns} · spend: ${o.cost.toFixed(3)}
            {o.overshoot > 0 && ` · over the cap by $${o.overshoot.toFixed(3)}`}
          </p>
          {wasted > 0 && <p className="mt-1 text-muted">Spent beyond a healthy run (${healthyCost.toFixed(3)}): ${wasted.toFixed(3)}.</p>}
          {detector && scenario === 'healthy' && <p className="mt-1 text-muted">No false alarm: all 6 calls were different.</p>}
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="mb-2 text-xs text-muted">Cost per turn (taller turn = longer context). The red line is the budget cap.</p>
          <div className="relative flex h-24 items-end gap-px" role="img" aria-label="Cost of each turn">
            {o.costs.map((_, i) => (
              <div key={i} className="min-w-0 flex-1" style={{ height: `${(turnCost(i + 1) / 0.12) * 100}%`, background: i === o.costs.length - 1 ? st.color : 'var(--accent)', opacity: i === o.costs.length - 1 ? 1 : 0.55 }} title={`turn ${i + 1}: $${turnCost(i + 1).toFixed(3)}`} />
            ))}
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded bg-bg">
            <div className="h-full" style={{ width: `${(o.cost / scale) * 100}%`, background: st.color }} />
          </div>
          <div className="relative h-4">
            <div className="absolute top-[-14px] h-4 w-0.5 bg-[var(--bad)]" style={{ left: `${(budget / scale) * 100}%` }} />
          </div>
        </div>
        <p className="text-muted">
          Model: turn t costs ((10,000 + 3,000 x (t - 1)) x $2 + 500 x $10) / 1M dollars, which is Sonnet 5.5 list price with no caching. Turn 1 is $0.025 and turn 6 is $0.055. A cap is checked after a response arrives, so the response that crosses it is still paid for.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
