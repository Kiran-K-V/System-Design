import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { anyDiffProb, flipProb, logprob, probB, simulate } from './Ai15DebugLogic';

const NOISE = [
  { id: 0.002, label: 'Tiny noise' },
  { id: 0.01, label: 'Small noise' },
  { id: 0.05, label: 'Large noise' },
];
const POSITIONS = [
  { id: 1, label: '1 close call' },
  { id: 5, label: '5' },
  { id: 20, label: '20' },
  { id: 100, label: '100' },
];

const pct = (p: number) => `${(p * 100).toFixed(p < 0.1 && p > 0 ? 1 : 0)}%`;

export default function Ai15DebugFlip() {
  const [gap, setGap] = useState(0.008);
  const [eps, setEps] = useState(0.01);
  const [k, setK] = useState(5);
  const [presses, setPresses] = useState(0);

  const pB = probB(gap);
  const pFlip = flipProb(gap, eps);
  const pAny = anyDiffProb(pFlip, k);
  const runs = presses > 0 ? simulate(gap, eps, k, 100, presses * 7919 + Math.round(gap * 1000) + k) : null;
  const differing = runs ? runs.filter(Boolean).length : 0;

  return (
    <CacheWidgetFrame title="Why temperature 0 can still differ" hint="Illustrative: noise sizes are made up. Real ones depend on hardware and load.">
      <div className="space-y-4 text-sm" aria-live="polite">
        <div>
          <label className="block text-xs text-muted" htmlFor="debug-gap">
            Gap between the top two tokens (logit units): <span className="font-mono text-fg">{gap.toFixed(3)}</span>
          </label>
          <input id="debug-gap" type="range" min={0} max={0.5} step={0.001} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full" />
          <div className="mt-2 flex flex-wrap gap-3">
            <Seg label="Numeric noise" value={eps} options={NOISE} onChange={setEps} />
            <Seg label="Close calls in the answer" value={k} options={POSITIONS} onChange={setK} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="mb-2 text-xs text-muted">At temperature 1, the sampler draws from these odds.</p>
            <p className="font-mono text-[13px]">
              Token A: {pct(1 - pB)} (logprob {logprob(1 - pB).toFixed(2)})
            </p>
            <p className="font-mono text-[13px]">
              Token B: {pct(pB)} (logprob {logprob(pB).toFixed(2)})
            </p>
            <p className="mt-2 text-muted">A tie gives 50 and 50. A gap of 0.5 still gives B about 38%.</p>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: pAny > 0.5 ? 'var(--bad)' : 'var(--border)' }}>
            <p className="mb-2 text-xs text-muted">At temperature 0, the top token wins unless noise flips the gap.</p>
            <p className="font-mono text-[13px]">One close call flips: {pct(pFlip)}</p>
            <p className="font-mono text-[13px]">
              Answer differs somewhere ({k} {k === 1 ? 'call' : 'calls'}): {pct(pAny)}
            </p>
            <p className="mt-2 text-muted">A gap larger than the noise never flips. Many small chances add up over a long answer.</p>
          </div>
        </div>

        <div className="rounded-lg border border-line p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">Run the same prompt 100 times at temperature 0.</p>
            <button type="button" onClick={() => setPresses((n) => n + 1)} className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface">
              {presses === 0 ? 'Run 100 times' : 'Run again'}
            </button>
          </div>
          {runs ? (
            <>
              <div className="mt-3 grid gap-px" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }} aria-hidden="true">
                {runs.map((bad, i) => (
                  <div key={i} className="aspect-square" style={{ background: bad ? 'var(--bad)' : 'var(--ok)', opacity: bad ? 1 : 0.35 }} />
                ))}
              </div>
              <p className="mt-2 font-mono text-[13px]">
                {differing} of 100 runs differ from the clean answer ({100 - differing} match).
              </p>
            </>
          ) : (
            <p className="mt-2 text-muted">Press the button. Green means the run matched the noise-free answer. Red means a flip changed the text.</p>
          )}
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
