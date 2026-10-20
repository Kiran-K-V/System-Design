import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { DEFAULTS, MODEL_LABEL, runTask, type ModelId, type RunInput, type Scenario } from './Ai13CodeBudgetMath';

const usd = (n: number) => (n >= 100 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`);

/** Runaway fix-loop simulator. Token sizes are illustrative. Prices are Anthropic list prices, as of 2026-10-20. */
export default function Ai13CodeBudgetSim() {
  const [scenario, setScenario] = useState<Scenario>('stuck');
  const [model, setModel] = useState<ModelId>('sonnet');
  const [cached, setCached] = useState(true);
  const [retryCap, setRetryCap] = useState(0);
  const [same, setSame] = useState(0);
  const [turnCap, setTurnCap] = useState(300);
  const [growth, setGrowth] = useState(2500);

  const input: RunInput = { ...DEFAULTS, scenario, model, cached, retryCap, sameFailureLimit: same, turnCap, growth };
  const r = runTask(input);
  const healthy = runTask({ ...input, scenario: 'healthy' });
  const max = r.curve[r.curve.length - 1] || 1;
  const bars = 40;
  const pick = Array.from({ length: bars }, (_, b) => r.curve[Math.min(r.curve.length - 1, Math.max(0, Math.ceil(((b + 1) / bars) * r.curve.length) - 1))]);
  const ended = r.stoppedBy === 'passed' ? 'Tests passed, the run ended on its own.' : `Ended by: ${r.stoppedBy}.`;

  return (
    <CacheWidgetFrame title="Runaway fix-loop budget simulator" hint="Illustrative sizes. Real list prices. Move the controls.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Task:</span>
        <Seg label="Task" value={scenario} options={[{ id: 'healthy', label: 'Fixable (3 attempts)' }, { id: 'stuck', label: 'Stuck (test never passes)' }]} onChange={setScenario} />
        <span className="text-sm text-muted">Model:</span>
        <Seg label="Model" value={model} options={(['haiku', 'sonnet', 'opus'] as ModelId[]).map((m) => ({ id: m, label: MODEL_LABEL[m] }))} onChange={setModel} />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={cached} onChange={(e) => setCached(e.target.checked)} className="accent-[var(--accent)]" />
          Prompt cache on
        </label>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="a13b-retry" label="Retry cap (fix attempts, 0 = off)" value={retryCap} min={0} max={30} step={1} onChange={setRetryCap} />
        <Slider id="a13b-same" label="Same-failure limit (identical failures in a row, 0 = off)" value={same} min={0} max={8} step={1} onChange={setSame} />
        <Slider id="a13b-turn" label="Turn cap (model calls)" value={turnCap} min={20} max={400} step={10} onChange={setTurnCap} />
        <Slider id="a13b-grow" label="Tokens added to the history per call" value={growth} min={500} max={5000} step={250} onChange={setGrowth} />
      </div>

      <div className="rounded-lg border p-3" style={{ borderColor: r.stoppedBy === 'passed' || r.stoppedBy === 'same failure' || r.stoppedBy === 'retry cap' ? 'var(--ok)' : 'var(--warn)' }} aria-live="polite">
        <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-medium" data-testid="bs-ended">{ended}</span>
          <span className="font-semibold tabular-nums" data-testid="bs-cost">{usd(r.cost)} for this run</span>
        </div>
        <div className="flex h-20 items-end gap-px" role="img" aria-label="Cumulative dollars spent after each share of the model calls in the run">
          {pick.map((v, i) => (
            <div key={i} className="flex h-full flex-1 items-end">
              <div className="w-full rounded-t" style={{ height: `${Math.max(3, (v / max) * 100)}%`, background: 'var(--accent)', opacity: 0.35 + 0.65 * ((i + 1) / bars) }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted"><span>call 1</span><span>call {r.calls}</span></div>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-muted">Model calls</dt><dd className="tabular-nums" data-testid="bs-calls">{r.calls}</dd></div>
          <div><dt className="text-xs text-muted">Fix attempts</dt><dd className="tabular-nums" data-testid="bs-attempts">{r.attempts}</dd></div>
          <div><dt className="text-xs text-muted">Final history</dt><dd className="tabular-nums" data-testid="bs-ctx">{(r.finalCtx / 1000).toFixed(0)}k tokens</dd></div>
          <div><dt className="text-xs text-muted">A fixable run costs</dt><dd className="tabular-nums" data-testid="bs-healthy">{usd(healthy.cost)}</dd></div>
        </dl>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: the run reads 6 files first, then makes attempts of two calls each (edit, then read the test result). The first call sends 20,000 tokens. Prices are per million tokens, as of 2026-10-20: Sonnet 5.5 $2 in, $10 out, $0.10 cache read, $2.50 cache write; Opus 5.5 double that; Haiku 5.5 $0.10 in, $0.50 out, and $0.50 in, $2.50 out for prompts over 100,000 tokens. The sim ignores compaction, so very long runs are cheaper here than in a real tool. Each call writes 600 tokens. All calls land inside the 5 minute cache lifetime.
      </p>
    </CacheWidgetFrame>
  );
}

function Slider({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between gap-2 text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value === 0 && min === 0 ? 'off' : value.toLocaleString('en-US')}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}
