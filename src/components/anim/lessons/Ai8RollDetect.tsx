import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { canaryN, hoursToDetect, upperBound } from './Ai8RollMath';

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
const FRACS = [0.01, 0.02, 0.05, 0.1, 0.25, 0.5];

function dur(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} minutes`;
  if (h < 48) return `${h.toFixed(1)} hours`;
  return `${(h / 24).toFixed(1)} days`;
}

/** How long a canary needs to see a drop in pass rate. Illustrative inputs; formula in Ai8RollMath. */
export default function Ai8RollDetect() {
  const [perDay, setPerDay] = useState(100000);
  const [fi, setFi] = useState(0);
  const [base, setBase] = useState(90);
  const [drop, setDrop] = useState(4);
  const [clean, setClean] = useState(300);

  const f = FRACS[fi];
  const n = canaryN(base / 100, drop / 100, f);
  const hours = hoursToDetect(base / 100, drop / 100, f, perDay);
  const exposed = Math.round((perDay * f * hours) / 24);
  const full = Math.round((perDay * hours) / 24);

  return (
    <CacheWidgetFrame title="How long must a canary run?" hint="80% chance to catch a real drop, 5% false-alarm rate">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Slider id="a88-t" label="Requests per day, all traffic" value={perDay} min={10000} max={1000000} step={10000} show={fmt(perDay)} onChange={setPerDay} />
        <Slider id="a88-f" label="Share of traffic on the canary" value={fi} min={0} max={FRACS.length - 1} step={1} show={`${f * 100}%`} onChange={setFi} />
        <Slider id="a88-b" label="Pass rate of the current version" value={base} min={50} max={98} step={1} show={`${base}%`} onChange={setBase} />
        <Slider id="a88-d" label="Drop you want to catch (points)" value={drop} min={1} max={15} step={1} show={`${drop} points`} onChange={setDrop} />
      </div>
      <div className="space-y-3 text-sm" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">To see a {drop}-point drop (from {base}% to {base - drop}%)</p>
          <p className="mt-1 font-mono text-[13px]">
            {fmt(n)} graded canary requests · {dur(hours)} of traffic · {fmt(exposed)} requests get the worse answer, against {fmt(full)} if you had gone to 100%
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">When the canary sees zero failures</p>
          <label htmlFor="a88-c" className="mt-1 flex justify-between text-xs text-muted">
            <span>Clean requests so far</span>
            <span className="tabular-nums text-fg">{fmt(clean)}</span>
          </label>
          <input id="a88-c" type="range" min={10} max={10000} step={10} value={clean} onChange={(e) => setClean(+e.target.value)} className="w-full accent-[var(--accent)]" />
          <p className="mt-1 font-mono text-[13px]">The true failure rate could still be up to {(upperBound(clean) * 100).toFixed(2)}% (about 3 / {fmt(clean)}).</p>
        </div>
        <p className="text-muted">
          Model: the control group is everything not on the canary, so it is larger by (1 - share) / share. Each request is graded pass or fail, and requests are independent. Real traffic has busy and quiet hours, so use real counts. A canary that grades only a sample needs proportionally longer.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
