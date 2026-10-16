import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { Z_ALPHA, daysNeeded, nPerArm } from './Ai8OnlineMath';

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

const fmt = (n: number) => n.toLocaleString('en-US');

/** n collected per arm on a log scale: slider 0..100 maps to 50..20,000. */
const collected = (i: number) => Math.round(50 * Math.pow(400, i / 100));

/** A/B sample-size explorer. The interval is for the difference between arms, centered on the true lift. */
export default function Ai8OnlineSim() {
  const [base, setBase] = useState(25);
  const [lift, setLift] = useState(10);
  const [power, setPower] = useState<0.8 | 0.9>(0.8);
  const [perDay, setPerDay] = useState(2000);
  const [pos, setPos] = useState(60);

  const p1 = base / 100;
  const p2 = p1 * (1 + lift / 100);
  const need = nPerArm(p1, lift / 100, power);
  const n = collected(pos);
  const hw = (m: number) => Z_ALPHA * Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / m);
  const half = hw(n);
  const diff = p2 - p1;
  const clear = diff > half;
  const span = Math.max(hw(300), diff * 1.5);
  const x = (v: number) => Math.min(100, Math.max(0, 50 + (v / span) * 50));
  const color = clear ? 'var(--ok)' : 'var(--warn)';

  return (
    <CacheWidgetFrame title="A/B sample-size explorer" hint="95% interval, two equal arms">
      <div className="mb-3 flex flex-wrap gap-2">
        <Seg label="Power" value={power} options={[{ id: 0.8, label: 'Power 80%' }, { id: 0.9, label: 'Power 90%' }]} onChange={setPower} />
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="a87-b" label="Baseline rate (for example acceptance)" value={base} min={5} max={60} step={1} show={`${base}%`} onChange={setBase} />
        <Slider id="a87-l" label="Relative lift you want to detect" value={lift} min={2} max={40} step={1} show={`+${lift}% (${(diff * 100).toFixed(1)} points)`} onChange={setLift} />
        <Slider id="a87-d" label="Answers per day, both arms together" value={perDay} min={200} max={20000} step={200} show={fmt(perDay)} onChange={setPerDay} />
        <Slider id="a87-n" label="Collected so far, per arm" value={pos} min={0} max={100} step={1} show={fmt(n)} onChange={setPos} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Needed to see the lift</p>
          <p className="mt-1 font-mono text-[13px]">
            {fmt(need)} per arm · {fmt(need * 2)} total · {daysNeeded(need, perDay).toFixed(1)} days at {fmt(perDay)} per day
          </p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: color }}>
          <p className="text-xs uppercase tracking-wide text-muted">With {fmt(n)} per arm, 95% interval for the difference</p>
          <div className="relative mt-3 h-10" role="img" aria-label={`Interval for the difference between arms: ${(diff * 100).toFixed(1)} points, plus or minus ${(half * 100).toFixed(1)}.`}>
            <div className="absolute top-0 h-10 w-px bg-[var(--fg)]" style={{ left: '50%' }} />
            <div className="absolute top-4 h-2 rounded" style={{ left: `${x(diff - half)}%`, width: `${x(diff + half) - x(diff - half)}%`, background: color, opacity: 0.55 }} />
            <div className="absolute top-2 h-6 w-1 rounded" style={{ left: `${x(diff)}%`, background: color }} />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>-{(span * 100).toFixed(1)} pts</span>
            <span>0 (no change)</span>
            <span>+{(span * 100).toFixed(1)} pts</span>
          </div>
          <p className="mt-2 font-mono text-[13px]" style={{ color }}>
            +{(diff * 100).toFixed(1)} pts, ± {(half * 100).toFixed(1)} · {clear ? 'zero is outside the interval: you can call it' : 'zero is inside the interval: you cannot call it yet'}
          </p>
        </div>
        <p className="text-muted">
          Model: the test compares two rates with a normal-curve approximation and a 5% false-alarm rate. It assumes one independent observation per user. Real users make many requests each, and those requests are linked, so real tests need more data. The interval is drawn around the true lift you typed, as if the test measured it exactly.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
