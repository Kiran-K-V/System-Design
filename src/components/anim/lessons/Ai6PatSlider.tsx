import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { roundsInput, verifierLoop } from './Ai6PatMath';

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

const PRESETS = [
  { id: 50, label: 'Coin flip (50)' },
  { id: 70, label: 'Weak LLM judge (70)' },
  { id: 95, label: 'Test suite (95)' },
];

/** Illustrative model of a generate-check-retry loop. Every input here is made up. The formulas are exact. */
export default function Ai6PatSlider() {
  const [q, setQ] = useState(70);
  const [g, setG] = useState(40);
  const [R, setR] = useState(4);
  const r = verifierLoop(g / 100, q / 100, R);
  const bars = [
    { label: 'Correct answer returned', v: r.correct, color: 'var(--ok)' },
    { label: 'Wrong, but the verifier passed it (silent)', v: r.wrongAccepted, color: 'var(--bad)' },
    { label: 'Wrong, cap hit while still failing (flagged)', v: r.wrongAtCap, color: 'var(--warn)' },
  ];
  const input = roundsInput(2000, 1000, R);

  return (
    <CacheWidgetFrame title="Verifier quality and the loop" hint="Illustrative inputs, exact formulas">
      <div className="grid gap-4 text-sm md:grid-cols-[16rem_1fr]">
        <div className="space-y-3">
          <Slider id="a6p-q" label="Verifier accuracy (q)" value={q} min={50} max={100} unit="%" onChange={setQ} />
          <Seg label="Verifier presets" value={q} options={PRESETS} onChange={setQ} />
          <Slider id="a6p-g" label="Chance one try is correct (g)" value={g} min={10} max={90} unit="%" onChange={setG} />
          <Slider id="a6p-r" label="Round cap (R)" value={R} min={1} max={8} onChange={setR} />
          <p className="text-xs text-muted">q is the chance the check accepts a correct answer and also the chance it rejects a wrong one. Tries are independent. Feedback does not raise g.</p>
        </div>
        <div className="space-y-3">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted">{b.label}</span>
                <span className="tabular-nums">{pct(b.v)}</span>
              </div>
              <div className="h-3 w-full rounded bg-surface" role="img" aria-label={`${b.label}: ${pct(b.v)}`}>
                <div className="h-3 rounded" style={{ width: `${b.v * 100}%`, background: b.color }} />
              </div>
            </div>
          ))}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Expected rounds</div>
              <div className="text-lg font-semibold tabular-nums">{r.rounds.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Chance cap is hit</div>
              <div className="text-lg font-semibold tabular-nums">{pct(r.hitCap)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Input tokens at the cap</div>
              <div className="text-lg font-semibold tabular-nums">{input.toLocaleString('en-US')}</div>
            </div>
          </div>
          <p className="text-xs text-muted">Tokens: a 2,000-token start that grows by 1,000 tokens each round, all resent every round (illustrative).</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
