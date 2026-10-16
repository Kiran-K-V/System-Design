import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { chain, passAt, passHat } from './Ai6LoopMath';

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const KMAX = 16;

function Slider({ id, label, value, min, max, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{value}{unit}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Two reliability views of an agent. Illustrative inputs; the formulas are exact. */
export default function Ai6LoopSim() {
  const [p, setP] = useState(95);
  const [n, setN] = useState(10);
  const [rate, setRate] = useState(61);
  const [spread, setSpread] = useState(30);
  const [k, setK] = useState(8);

  const run = chain(p / 100, n);
  const hatK = passHat(rate / 100, spread / 100, k);
  const uniK = passHat(rate / 100, 0, k);
  const atK = passAt(rate / 100, spread / 100, k);

  return (
    <CacheWidgetFrame title="Agent reliability simulator" hint="Illustrative inputs, exact formulas">
      <div className="grid gap-5 text-sm md:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-line bg-surface p-3">
          <p className="font-medium">1. One run: all n steps must work</p>
          <Slider id="a6l-p" label="Chance a step is right (p)" value={p} min={50} max={100} unit="%" onChange={setP} />
          <Slider id="a6l-n" label="Steps in one run (n)" value={n} min={1} max={30} onChange={setN} />
          <div className="rounded-lg border border-line bg-bg p-2.5">
            <div className="text-xs text-muted">Run success: p to the power n</div>
            <div className="text-lg font-semibold tabular-nums" style={{ color: run >= 0.8 ? 'var(--ok)' : run >= 0.5 ? 'var(--warn)' : 'var(--bad)' }}>{pct(run)}</div>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-line bg-surface p-3">
          <p className="font-medium">2. Same task, k tries: pass^k</p>
          <Slider id="a6l-r" label="Average task success (pass^1)" value={rate} min={20} max={95} unit="%" onChange={setRate} />
          <Slider id="a6l-s" label="Spread: easy and hard tasks differ by" value={spread} min={0} max={40} unit=" pts" onChange={setSpread} />
          <Slider id="a6l-k" label="Tries per task (k)" value={k} min={1} max={KMAX} onChange={setK} />
          <button type="button" className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:bg-bg" onClick={() => { setRate(61); setSpread(30); setK(8); }}>
            Preset: tau-bench retail shape
          </button>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-bg p-2.5">
              <div className="text-xs text-muted">pass^k (with spread)</div>
              <div className="text-lg font-semibold tabular-nums text-bad">{pct(hatK)}</div>
            </div>
            <div className="rounded-lg border border-line bg-bg p-2.5">
              <div className="text-xs text-muted">pass^k (all tasks equal)</div>
              <div className="text-lg font-semibold tabular-nums">{pct(uniK)}</div>
            </div>
            <div className="rounded-lg border border-line bg-bg p-2.5">
              <div className="text-xs text-muted">pass@k (any try works)</div>
              <div className="text-lg font-semibold tabular-nums text-ok">{pct(atK)}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-line bg-surface p-3">
        <div className="mb-2 text-xs text-muted">pass^k for k = 1 to {KMAX}, with spread. The line marks the all-tasks-equal case.</div>
        <div className="flex h-28 items-end gap-1" role="img" aria-label="pass^k against k">
          {Array.from({ length: KMAX }, (_, i) => {
            const kk = i + 1;
            const v = passHat(rate / 100, spread / 100, kk);
            const u = passHat(rate / 100, 0, kk);
            return (
              <div key={kk} className="relative h-full min-w-0 flex-1" title={`k=${kk}: ${pct(v)}`}>
                <div className="absolute bottom-0 w-full" style={{ height: `${Math.max(v * 100, v > 0 ? 1 : 0)}%`, background: kk === k ? 'var(--bad)' : 'var(--accent)', opacity: kk === k ? 1 : 0.5 }} />
                <div className="absolute w-full border-t-2 border-fg" style={{ bottom: `${u * 100}%` }} />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted"><span>k = 1</span><span>k = {KMAX}</span></div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model: each step, and each try, is independent. In part 2, half the tasks succeed with probability (rate + spread) and half with (rate - spread), so the mean stays at the rate. The tau-bench shape (61%, spread 30) is an illustrative fit, not the paper's data.
      </p>
    </CacheWidgetFrame>
  );
}
