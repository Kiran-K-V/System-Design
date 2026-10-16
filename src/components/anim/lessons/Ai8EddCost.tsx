import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { JUDGE_IN, JUDGE_OUT, JUDGE_SEC, MODELS, SYS_IN, SYS_OUT, SYS_SEC, evalCost, type ModelId } from './Ai8EddMath';

const MODEL_OPTS: { id: ModelId; label: string }[] = [
  { id: 'haiku55', label: 'Haiku 5.5' },
  { id: 'sonnet55', label: 'Sonnet 5.5' },
  { id: 'opus55', label: 'Opus 5.5' },
];

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

const usd = (n: number) => `$${n < 10 ? n.toFixed(2) : n.toFixed(1)}`;

export default function Ai8EddCost() {
  const [cases, setCases] = useState(200);
  const [trials, setTrials] = useState(3);
  const [sysModel, setSysModel] = useState<ModelId>('sonnet55');
  const [judgeModel, setJudgeModel] = useState<ModelId>('haiku55');
  const [judgeCalls, setJudgeCalls] = useState(1);
  const [concurrency, setConcurrency] = useState(20);
  const [batch, setBatch] = useState(false);
  const [perDay, setPerDay] = useState(10);

  const c = evalCost({ cases, trials, sysModel, judgeModel, judgeCalls, concurrency, batch });
  const top = Math.max(c.total, 0.01);

  return (
    <CacheWidgetFrame title="Eval run cost" hint="Illustrative token sizes. Prices as of 2026-10-16.">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Model under test" value={sysModel} options={MODEL_OPTS} onChange={setSysModel} />
        <Seg label="Judge model" value={judgeModel} options={MODEL_OPTS} onChange={setJudgeModel} />
        <Seg label="Batch API" value={batch ? 1 : 0} options={[{ id: 0, label: 'Live API' }, { id: 1, label: 'Batch (50% off)' }]} onChange={(v) => setBatch(v === 1)} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Slider id="a8e-cases" label="Cases" value={cases} min={20} max={1000} step={10} show={`${cases}`} onChange={setCases} />
        <Slider id="a8e-trials" label="Trials per case (k)" value={trials} min={1} max={10} step={1} show={`${trials}`} onChange={setTrials} />
        <Slider id="a8e-judge" label="Judge calls per trial" value={judgeCalls} min={0} max={3} step={1} show={judgeCalls === 0 ? '0 (code checks only)' : `${judgeCalls}`} onChange={setJudgeCalls} />
        <Slider id="a8e-conc" label="Parallel calls" value={concurrency} min={1} max={100} step={1} show={`${concurrency}`} onChange={setConcurrency} />
        <Slider id="a8e-day" label="Runs per day (PRs)" value={perDay} min={1} max={50} step={1} show={`${perDay}`} onChange={setPerDay} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="font-mono text-[13px]">
            {c.sysCalls.toLocaleString('en-US')} model calls + {c.judgeCalls.toLocaleString('en-US')} judge calls per run
          </p>
          <div className="mt-2 flex h-4 w-full overflow-hidden rounded bg-bg" role="img" aria-label="Share of cost: model under test and judge">
            <div style={{ width: `${(c.sysCost / top) * 100}%`, background: 'var(--accent)' }} />
            <div style={{ width: `${(c.judgeCost / top) * 100}%`, background: 'var(--warn)' }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            <span style={{ color: 'var(--accent)' }}>Model under test {usd(c.sysCost)}</span> · <span style={{ color: 'var(--warn)' }}>Judge {usd(c.judgeCost)}</span>
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs uppercase tracking-wide text-muted">One run</p>
            <p className="mt-1 text-lg font-medium tabular-nums">{usd(c.total)}</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs uppercase tracking-wide text-muted">Wall clock{batch ? ' (live)' : ''}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">{c.minutes < 1 ? '<1 min' : `${c.minutes.toFixed(c.minutes < 10 ? 1 : 0)} min`}</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs uppercase tracking-wide text-muted">{perDay} runs a day</p>
            <p className="mt-1 text-lg font-medium tabular-nums">{usd(c.total * perDay)} a day</p>
          </div>
        </div>
        {batch && <p className="text-muted">Batch is asynchronous, so use it for nightly runs, not for a pull request gate that a person waits on.</p>}
        <p className="text-muted">
          Model: each trial sends {SYS_IN.toLocaleString('en-US')} input and {SYS_OUT} output tokens to the model under test, and each judge call sends {JUDGE_IN.toLocaleString('en-US')} input and {JUDGE_OUT} output tokens. Calls take {SYS_SEC} s (model) and {JUDGE_SEC} s (judge), run in waves of the parallel count. Rate limits and retries are ignored. Prices per million tokens: {MODEL_OPTS.map((m) => `${m.label} $${MODELS[m.id].price.inp} in / $${MODELS[m.id].price.out} out`).join(', ')}.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
