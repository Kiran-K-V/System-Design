import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { PRESETS, noVerifyTask, verifyTask, type PresetId, type TaskOutcome } from './Ai14SdkVerifyMath';

/**
 * Before and after for one task with and without a verify stage. ILLUSTRATIVE: the source post publishes no pass rates,
 * no detection rates, and no latencies. The model is in Ai14SdkVerifyMath.ts (a chain of n steps, a check after each).
 */

const pct = (x: number) => `${(100 * x).toFixed(1)}%`;

function Bar({ title, r, testid }: { title: string; r: TaskOutcome; testid: string }) {
  const parts = [
    { key: 'correct', label: 'Correct', v: r.correct, color: 'var(--ok)' },
    { key: 'silent', label: 'Says done, wrong', v: r.silentTask, color: 'var(--bad)' },
    { key: 'loud', label: 'Stops, reports failure', v: r.loudTask, color: 'var(--warn)' },
  ];
  return (
    <div className="mb-4" data-testid={testid}>
      <div className="mb-1 text-sm font-medium">{title}</div>
      <div className="flex h-8 overflow-hidden rounded-md border border-line" role="img" aria-label={parts.map((p) => `${p.label} ${pct(p.v)}`).join(', ')}>
        {parts.map((p) => (
          <div key={p.key} style={{ width: `${p.v * 100}%`, background: p.color, opacity: 0.55 }} />
        ))}
      </div>
      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {parts.map((p) => (
          <div key={p.key} className="flex items-center gap-2">
            <span aria-hidden className="inline-block size-3 shrink-0 rounded-sm" style={{ background: p.color, opacity: 0.55 }} />
            <dt className="text-muted">{p.label}</dt>
            <dd className="ml-auto tabular-nums font-medium" data-testid={`${testid}-${p.key}`}>{pct(p.v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Slider({ id, label, value, min, max, step, show, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; show: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between gap-2 text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

export default function Ai14SdkVerifySim() {
  const [n, setN] = useState(5);
  const [p, setP] = useState(0.9);
  const [retries, setRetries] = useState(2);
  const [preset, setPreset] = useState<PresetId>('rules');
  const [d, setD] = useState<number>(PRESETS.rules.d);
  const [f, setF] = useState<number>(PRESETS.rules.f);
  const [checkCost, setCheckCost] = useState<number>(PRESETS.rules.checkCost);

  const pick = (id: PresetId) => {
    setPreset(id);
    setD(PRESETS[id].d);
    setF(PRESETS[id].f);
    setCheckCost(PRESETS[id].checkCost);
  };

  const before = noVerifyTask(n, p);
  const after = verifyTask({ n, p, d, f, retries, checkCost });
  const extra = after.runCost / before.runCost;

  return (
    <CacheWidgetFrame title="One task, with and without a verify step" hint="Illustrative numbers. Move the controls.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Verifier:</span>
        <Seg label="Verifier" value={preset} options={(Object.keys(PRESETS) as PresetId[]).map((id) => ({ id, label: PRESETS[id].label }))} onChange={pick} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="a14v-n" label="Steps the task needs" value={n} min={1} max={12} step={1} show={`${n}`} onChange={setN} />
        <Slider id="a14v-p" label="Chance one attempt at a step is right" value={p} min={0.5} max={0.99} step={0.01} show={pct(p)} onChange={setP} />
        <Slider id="a14v-r" label="Retries allowed per step" value={retries} min={0} max={4} step={1} show={`${retries}`} onChange={setRetries} />
        <Slider id="a14v-d" label="Check catches a wrong attempt" value={d} min={0} max={1} step={0.05} show={pct(d)} onChange={setD} />
        <Slider id="a14v-f" label="Check flags a right attempt by mistake" value={f} min={0} max={0.5} step={0.01} show={pct(f)} onChange={setF} />
        <Slider id="a14v-c" label="Cost of one check, in attempts" value={checkCost} min={0} max={1.5} step={0.05} show={checkCost.toFixed(2)} onChange={setCheckCost} />
      </div>

      <Bar title="Before: no verify step. The agent stops when it thinks it is done." r={before} testid="vs-before" />
      <Bar title={`After: check each step, retry up to ${retries} time${retries === 1 ? '' : 's'}.`} r={after} testid="vs-after" />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-muted">Attempts per run, before</dt><dd className="tabular-nums" data-testid="vs-att-before">{before.runAttempts.toFixed(2)}</dd></div>
        <div><dt className="text-xs text-muted">Attempts per run, after</dt><dd className="tabular-nums" data-testid="vs-att-after">{after.runAttempts.toFixed(2)}</dd></div>
        <div><dt className="text-xs text-muted">Cost per run, after, versus before</dt><dd className="tabular-nums" data-testid="vs-cost">{extra.toFixed(2)}x</dd></div>
      </dl>
      <p className="mt-3 text-sm text-muted">
        Model, ours and not the post's: the task needs {n} steps in a row. Each attempt is right with the chance above, and attempts are independent. After each attempt the check flags a wrong one with the "catches" rate and flags a right one with the "mistake" rate. A flagged attempt is retried as a fresh draw. An unflagged attempt is accepted, right or wrong. A step still flagged after the last retry stops the run with a reported failure. Cost counts attempts plus checks, with one attempt as the unit. The three presets are made-up values chosen to show the shape. The post publishes none of these numbers.
      </p>
    </CacheWidgetFrame>
  );
}
