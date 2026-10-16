import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { seenAtLeast, tracesToSee, wilson } from './Ai8ErrMath';

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

const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;

export default function Ai8ErrSample() {
  const [n, setN] = useState(100);
  const [rate, setRate] = useState(40);
  const [share, setShare] = useState(2);

  const k = Math.round((rate / 100) * n);
  const [lo, hi] = wilson(k, n);
  const p = share / 100;
  const once = seenAtLeast(p, n, 1);
  const thrice = seenAtLeast(p, n, 3);
  const need = tracesToSee(p);

  return (
    <CacheWidgetFrame title="Have I read enough traces?" hint="Illustrative inputs. The math is exact for random traces.">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Slider id="a8r-n" label="Traces read (n)" value={n} min={10} max={600} step={10} show={`${n}`} onChange={setN} />
        <Slider id="a8r-rate" label="Share of traces that failed" value={rate} min={1} max={90} step={1} show={`${rate}%`} onChange={setRate} />
        <Slider id="a8r-share" label="One failure type is this share of all traces" value={share} min={0.5} max={20} step={0.5} show={`${share}%`} onChange={setShare} />
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2" aria-live="polite">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">How sure is the failure rate?</p>
          <p className="mt-1 font-mono text-[13px]">
            {k} failures in {n} traces = {pct(k / n)}
          </p>
          <div className="relative mt-3 h-3 w-full rounded bg-bg" role="img" aria-label={`The true rate is likely between ${pct(lo)} and ${pct(hi)}`}>
            <div className="absolute top-0 h-3 rounded" style={{ left: `${lo * 100}%`, width: `${Math.max((hi - lo) * 100, 0.5)}%`, background: 'var(--accent)', opacity: 0.55 }} />
            <div className="absolute top-[-3px] h-[18px] w-0.5 bg-[var(--fg)]" style={{ left: `${(k / n) * 100}%` }} />
          </div>
          <p className="mt-2">
            The real rate is probably between <b>{pct(lo)}</b> and <b>{pct(hi)}</b>. That range is {((hi - lo) * 100).toFixed(0)} points wide.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Will I even see a rare failure type?</p>
          <p className="mt-1 font-mono text-[13px]">
            a type that is {share}% of traces
          </p>
          <ul className="mt-2 space-y-1">
            <li>Seen at least once in {n} traces: <b>{pct(once, 1)}</b></li>
            <li>Seen at least 3 times: <b>{pct(thrice, 1)}</b></li>
            <li>Traces needed for a 95% chance of one sighting: <b>{need.toLocaleString('en-US')}</b></li>
          </ul>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: each trace is drawn at random and independently, and the failure type appears in a share p of them. The chance of at least one sighting is 1 - (1 - p)^n. The range for the failure rate is a standard 95% range for a proportion. Reading more traces narrows the range slowly: its width shrinks with the square root of n.
      </p>
    </CacheWidgetFrame>
  );
}
