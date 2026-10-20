import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { runCost } from './Ai13ResearchCostMath';
import { multiplier, pAnyFailure } from './Ai13ResearchResumeMath';

const usd = (n: number) => `$${n < 10 ? n.toFixed(2) : n.toFixed(1)}`;
const WORKER_STEPS = 16;
const BASE = runCost({ workers: 12, calls: 15, lead: 'opus', worker: 'sonnet', cache: false }).totalUsd;
const BASE_STEPS = 12 * WORKER_STEPS;

/** Restart from zero against resume from a checkpoint. Per-step failure rate is illustrative. */
export default function Ai13ResearchResume() {
  const [qPct, setQPct] = useState(0.5);
  const [steps, setSteps] = useState(192);
  const q = qPct / 100;
  const base = (BASE * steps) / BASE_STEPS;
  const rows = [
    { id: 'run', label: 'No checkpoint: restart the run', m: steps },
    { id: 'worker', label: 'Checkpoint per subagent: restart one subagent', m: WORKER_STEPS },
    { id: 'step', label: 'Checkpoint every step: redo one step', m: 1 },
  ].map((r) => ({ ...r, mult: multiplier(steps, Math.min(r.m, steps), q) }));
  const max = Math.max(...rows.map((r) => r.mult));

  return (
    <CacheWidgetFrame title="Restart or resume" hint="Illustrative failure rate. Move the sliders.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="rs-q" className="mb-1 flex justify-between text-xs text-muted">
            <span>Chance that one step fails (a crash, a timeout)</span>
            <span className="tabular-nums text-fg" data-testid="rs-q">{qPct.toFixed(1)}%</span>
          </label>
          <input id="rs-q" type="range" min={0.1} max={2} step={0.1} value={qPct} onChange={(e) => setQPct(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="rs-n" className="mb-1 flex justify-between text-xs text-muted">
            <span>Steps in the run (model calls, all subagents)</span>
            <span className="tabular-nums text-fg" data-testid="rs-n">{steps}</span>
          </label>
          <input id="rs-n" type="range" min={48} max={384} step={16} value={steps} onChange={(e) => setSteps(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
      </div>
      <div className="rounded-lg border border-line p-3" aria-live="polite">
        <p className="mb-3 text-sm">
          Chance the run sees at least one failure: <span className="font-semibold tabular-nums" data-testid="rs-any">{(pAnyFailure(steps, q) * 100).toFixed(1)}%</span>. Bill if nothing fails: <span className="tabular-nums">{usd(base)}</span>.
        </p>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span>{r.label}</span>
                <span className="font-semibold tabular-nums" data-testid={`rs-${r.id}`}>{r.mult.toFixed(2)}x, {usd(base * r.mult)}</span>
              </div>
              <div className="h-3 w-full rounded bg-surface">
                <div className="h-3 rounded" style={{ width: `${(r.mult / max) * 100}%`, background: r.id === 'run' ? 'var(--bad)' : r.id === 'worker' ? 'var(--warn)' : 'var(--ok)', opacity: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: each step fails on its own with the chance you set. A failure sends you back to the last checkpoint, and every step that runs is billed again. With a checkpoint every m steps, a chunk of m steps takes ((1 - q)^-m - 1) / q billed steps on average. The run has N / m chunks, and the multiplier is the total divided by N. A subagent has 16 steps (15 tool calls and a summary). The failure rate is an assumption: I found no published rate. The base bill is the complex-research row of the effort table (12 subagents, 15 calls, Opus 5.5 lead, Sonnet 5.5 subagents, no caching), scaled by step count. Checkpoint writes and the one in-flight call are ignored.
      </p>
    </CacheWidgetFrame>
  );
}
