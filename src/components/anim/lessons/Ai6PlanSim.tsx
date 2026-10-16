import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { interleaved, planned, type PlanInput } from './Ai6PlanMath';

const num = (v: number) => Math.round(v).toLocaleString('en-US');
const usd = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : v >= 0.01 ? `$${v.toFixed(3)}` : `$${v.toFixed(4)}`);

function Slider({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{num(value)}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

export default function Ai6PlanSim() {
  const [steps, setSteps] = useState(10);
  const [base, setBase] = useState(3000);
  const [per, setPer] = useState(800);
  const [plan, setPlan] = useState(300);
  const [fails, setFails] = useState(1);
  const [split, setSplit] = useState<'same' | 'cheap'>('same');
  const input: PlanInput = { steps, base, perStep: per, planTokens: plan, failures: fails, strongPrice: 2, execPrice: split === 'same' ? 2 : 0.1 };
  const a = interleaved(input);
  const b = planned(input);
  const cell = (label: string, v: string) => (
    <div className="flex justify-between"><span className="text-muted">{label}</span><span className="font-semibold tabular-nums">{v}</span></div>
  );
  return (
    <CacheWidgetFrame title="With a plan and without" hint="A toy model with assumed sizes. Input tokens only. Strong model $2 per 1M (Sonnet 5.5).">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Slider id="a68-s" label="Steps the task needs" value={steps} min={3} max={25} step={1} onChange={setSteps} />
          <Slider id="a68-b" label="Tokens in every call (prompt and tools)" value={base} min={1000} max={8000} step={500} onChange={setBase} />
          <Slider id="a68-p" label="Tokens each step adds to history" value={per} min={200} max={3000} step={100} onChange={setPer} />
          <Slider id="a68-l" label="Tokens in the written plan" value={plan} min={100} max={800} step={50} onChange={setPlan} />
          <Slider id="a68-f" label="Failed steps" value={fails} min={0} max={4} step={1} onChange={setFails} />
          <Seg label="Executor model" value={split} onChange={setSplit} options={[{ id: 'same', label: 'Executors: Sonnet 5.5 ($2)' }, { id: 'cheap', label: 'Executors: Haiku 5.5 ($0.10)' }]} />
        </div>
        <div className="space-y-2 self-start" aria-live="polite">
          <div className="rounded-lg border border-line bg-surface p-2.5 text-sm">
            <div className="mb-1 text-xs text-muted">No plan: one loop, history grows</div>
            {cell('Model calls', num(a.calls))}
            {cell('Input tokens', num(a.tokens))}
            {cell('Dollars', usd(a.usd))}
          </div>
          <div className="rounded-lg border border-line bg-surface p-2.5 text-sm">
            <div className="mb-1 text-xs text-muted">Plan, execute, replan</div>
            {cell('Model calls', num(b.calls))}
            {cell('Input tokens', num(b.tokens))}
            {cell('Dollars', usd(b.usd))}
          </div>
          <p className="text-xs text-muted">
            No plan: calls = steps + failures; tokens = calls x base + per-step x calls x (calls - 1) / 2. Plan: one planner call, then each executor sees base + plan + one result. Each failure adds one executor call and one replan call. The model ignores that executors with less history may fail more.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
