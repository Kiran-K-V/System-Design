import { useState } from 'react';
import { bestGamma, expectedTokens, opsFactor, speedup, speedupAtBatch } from './AiE3SpecLogic';

const BATCHES = [1, 4, 16, 32, 64, 128, 256, 512];

function Slider({ id, label, value, min, max, step, onChange, shown }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; shown: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

export default function AiE3SpecSpeedup() {
  const [alpha, setAlpha] = useState(0.7);
  const [gamma, setGamma] = useState(5);
  const [cPct, setCPct] = useState(5);
  const [bi, setBi] = useState(0);
  const c = cPct / 100;
  const batch = BATCHES[bi];
  const tok = expectedTokens(alpha, gamma);
  const sp = speedup(alpha, gamma, c);
  const ops = opsFactor(alpha, gamma, c);
  const best = bestGamma(alpha, c);
  const spB = speedupAtBatch(alpha, gamma, c, batch);
  const maxSp = Math.max(...Array.from({ length: 10 }, (_, i) => speedup(alpha, i + 1, c)), 1);

  return (
    <div className="not-prose my-8 rounded-2xl border border-line bg-surface/40 p-4 text-sm" data-testid="spec-sim">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">What does speculation buy?</span>
        <span className="text-xs text-muted">Formulas from the speculative decoding paper. Batch model: illustrative.</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider id="sp-a" label="Acceptance rate (chance a guessed token is kept)" value={alpha} min={0.3} max={0.95} step={0.05} onChange={setAlpha} shown={alpha.toFixed(2)} />
        <Slider id="sp-g" label="Tokens guessed per round" value={gamma} min={1} max={10} step={1} onChange={setGamma} shown={String(gamma)} />
        <Slider id="sp-c" label="Draft step cost, as % of one large step" value={cPct} min={0} max={50} step={1} onChange={setCPct} shown={`${cPct}%`} />
        <Slider id="sp-b" label="Batch size (users sharing the GPU)" value={bi} min={0} max={BATCHES.length - 1} step={1} onChange={setBi} shown={String(batch)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Tokens per large pass</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="sp-tok">{tok.toFixed(2)}</div>
          <div className="text-xs text-muted">plain decoding: 1</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Speedup, spare compute</div>
          <div className="text-lg font-semibold tabular-nums text-ok" data-testid="sp-speed">{sp.toFixed(2)}x</div>
          <div className="text-xs text-muted">draft cost included</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Extra arithmetic</div>
          <div className="text-lg font-semibold tabular-nums text-warn" data-testid="sp-ops">{ops.toFixed(2)}x</div>
          <div className="text-xs text-muted">wasted on rejected guesses</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Speedup at this batch</div>
          <div className={`text-lg font-semibold tabular-nums ${spB < 1 ? 'text-bad' : 'text-ok'}`} data-testid="sp-batch">{spB.toFixed(2)}x</div>
          <div className="text-xs text-muted">{spB < 1 ? 'slower than plain decoding' : 'batch ' + batch}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs text-muted">Speedup by guess length (best here: {best}). The bar for your choice is outlined.</div>
        <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Speedup for each guess length from 1 to 10">
          {Array.from({ length: 10 }, (_, i) => {
            const g = i + 1;
            const v = speedup(alpha, g, c);
            return (
              <div key={g} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div className="w-full rounded-t" style={{ height: `${(v / maxSp) * 100}%`, background: g === best ? 'var(--ok)' : 'var(--muted)', opacity: g === best ? 1 : 0.5, outline: g === gamma ? '2px solid var(--accent)' : 'none' }} />
                <span className="text-[11px] tabular-nums text-muted">{g}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model. Each guessed token is kept with the same chance (the paper's simplifying assumption). The batch row assumes the large step is memory-bound until the tokens it checks pass the H100 ridge point of about 295 (the Prefill vs Decode: TTFT and TPOT lesson). Every user then checks the guess length plus one positions, so the step grows once the batch is large. The draft is treated as memory-bound at any batch. Real servers differ.
      </p>
    </div>
  );
}
