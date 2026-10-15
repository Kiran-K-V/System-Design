import { useEffect, useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { chainSuccess, simulate, stepWithVerifier } from './ai0Math';

const RUNS = 1000;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

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

/** Per-step success p, chain length n, optional verifier and retries. Analytic p^n plus 1,000 seeded runs. */
export default function Ai0ChainSim() {
  const [p, setP] = useState(95);
  const [n, setN] = useState(10);
  const [retries, setRetries] = useState(0);
  const [catchRate, setCatchRate] = useState(90);
  const [counts, setCounts] = useState<number[] | null>(null);

  const step = stepWithVerifier(p / 100, catchRate / 100, retries);
  const exact = chainSuccess(step, n);
  const plain = chainSuccess(p / 100, n);

  // Randomness runs in an effect so server and browser render the same first frame.
  useEffect(() => {
    setCounts(simulate(step, n, RUNS, 42));
  }, [step, n]);

  const max = counts ? Math.max(...counts) : 1;
  const simRate = counts ? counts[n] / RUNS : 0;

  return (
    <CacheWidgetFrame title="Chain reliability simulator" hint="1,000 seeded runs">
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <Slider id="a0c-p" label="Per-step success p" value={p} min={50} max={100} unit="%" onChange={setP} />
          <Slider id="a0c-n" label="Steps in the chain n" value={n} min={1} max={30} onChange={setN} />
          <Slider id="a0c-r" label="Retries after a failed check" value={retries} min={0} max={3} onChange={setRetries} />
          <Slider id="a0c-c" label="Verifier catch rate" value={catchRate} min={50} max={100} unit="%" onChange={setCatchRate} />
          <p className="text-xs text-muted">With 0 retries there is no verifier. Attempts are independent. A bad answer the verifier misses counts as a failure.</p>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">No checks: p^n</div>
              <div className="text-lg font-semibold tabular-nums text-bad">{pct(plain)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Per step, with checks</div>
              <div className="text-lg font-semibold tabular-nums">{pct(step)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">End to end, with checks</div>
              <div className="text-lg font-semibold tabular-nums text-ok">{pct(exact)}</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="mb-2 text-xs text-muted">
              Where 1,000 runs stop (steps completed before the first failure). Rightmost bar = full success: {counts ? `${counts[n]} of ${RUNS} (${pct(simRate)})` : '...'}
            </div>
            <div className="flex h-28 items-end gap-px" role="img" aria-label="Histogram of steps completed before first failure">
              {(counts ?? new Array(n + 1).fill(0)).map((c, k) => (
                <div key={k} className="min-w-0 flex-1" style={{ height: `${Math.max((c / max) * 100, c > 0 ? 2 : 0)}%`, background: k === n ? 'var(--ok)' : 'var(--accent)', opacity: k === n ? 1 : 0.55 }} title={`${k} steps: ${c} runs`} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted"><span>0</span><span>{n}</span></div>
          </div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
