import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { A100_HOUR, STEP_SEC, costAtUtil, costPerImage, imagesPerHour, latency, quality, type Mode } from './Ai12DiffLogic';

const usd = (n: number) => '$' + (n < 0.01 ? n.toFixed(5) : n.toFixed(3));

/** Sliders: steps, sampler type, GPU busy share. Shows seconds, images per hour, GPU cost per image, and illustrative quality. */
export default function Ai12DiffTradeoff() {
  const [steps, setSteps] = useState(30);
  const [mode, setMode] = useState<Mode>('standard');
  const [util, setUtil] = useState(100);
  const sec = latency(steps);
  const cost = costPerImage(A100_HOUR, sec);
  const paid = costAtUtil(A100_HOUR, sec, util / 100);
  const q = quality(steps, mode);
  const qTone = q >= 0.9 ? 'var(--ok)' : q >= 0.6 ? 'var(--warn)' : 'var(--bad)';

  return (
    <CacheWidgetFrame title="Steps, quality, and cost per image" hint="Quality is illustrative, not measured">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="a12-steps" className="mb-1 flex justify-between text-xs text-muted">
            <span>Denoising steps</span>
            <span className="tabular-nums text-fg">{steps}</span>
          </label>
          <input id="a12-steps" type="range" min={1} max={50} step={1} value={steps} onChange={(e) => setSteps(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <label htmlFor="a12-util" className="mb-1 flex justify-between text-xs text-muted">
            <span>GPU busy share of paid time</span>
            <span className="tabular-nums text-fg">{util}%</span>
          </label>
          <input id="a12-util" type="range" min={10} max={100} step={5} value={util} onChange={(e) => setUtil(+e.target.value)} className="w-full accent-[var(--accent)]" />
        </div>
        <div>
          <span className="mb-1 block text-xs text-muted">Model type</span>
          <Seg<Mode> label="Model type" value={mode} options={[{ id: 'standard', label: 'Standard' }, { id: 'distilled', label: 'Distilled' }]} onChange={setMode} />
        </div>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-4" aria-live="polite">
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Seconds per image</p>
          <p className="mt-1 font-mono text-lg">{sec.toFixed(2)}</p>
          <p className="text-xs text-muted">{Math.round(imagesPerHour(sec)).toLocaleString('en-US')} images per hour</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">GPU cost, GPU always busy</p>
          <p className="mt-1 font-mono text-lg">{usd(cost)}</p>
          <p className="text-xs text-muted">{usd(cost * 1e6).replace(/\.\d+$/, '')} per million</p>
        </div>
        <div className="rounded-lg border border-line p-3">
          <p className="text-xs uppercase tracking-wide text-muted">Cost you pay at that busy share</p>
          <p className="mt-1 font-mono text-lg">{usd(paid)}</p>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: qTone }}>
          <p className="text-xs uppercase tracking-wide text-muted">Quality (illustrative)</p>
          <p className="mt-1 font-mono text-lg" style={{ color: qTone }}>{Math.round(q * 100)} / 100</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        Model: step time is {STEP_SEC * 1000} ms (the vendor A100 figure, 4.3 s divided by 50 steps). GPU price is ${A100_HOUR} per hour (Lambda, A100 SXM 80 GB, as of 2026-10-18). Cost = price per hour x seconds per image / 3,600, divided by the busy share. The quality curve is made up to show the shape: a standard model keeps gaining until about 30 steps, and a distilled model is tuned to be good in 1 to 4 steps. A distilled step is assumed to cost the same as a standard step.
      </p>
    </CacheWidgetFrame>
  );
}
