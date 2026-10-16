import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { capacity } from './Ai7BgMath';

const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

/** Capacity planner for a background-agent fleet. Little's law: busy = runs per hour x hours per run. */
export default function Ai7BgCalc() {
  const [rph, setRph] = useState(500);
  const [min, setMin] = useState(6);
  const [peak, setPeak] = useState(1);
  const [head, setHead] = useState(2);
  const [cap, setCap] = useState(1);
  const [vm, setVm] = useState(0.1);

  const c = capacity(rph, min, peak, head, cap, vm);

  const slider = (id: string, label: string, value: number, setter: (n: number) => void, lo: number, hi: number, step: number, shown: string) => (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={lo} max={hi} step={step} value={value} onChange={(e) => setter(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );

  return (
    <CacheWidgetFrame title="Background agent capacity" hint="your own numbers. The prices here are placeholders, not quotes">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          {slider('a77-rph', 'Runs per hour (average)', rph, setRph, 10, 2000, 10, rph.toLocaleString('en-US'))}
          {slider('a77-min', 'Minutes per run (boot included)', min, setMin, 1, 120, 1, String(min))}
          {slider('a77-peak', 'Peak over average (illustrative)', peak, setPeak, 1, 5, 0.5, `${peak}x`)}
          {slider('a77-head', 'Headroom factor', head, setHead, 1, 3, 0.25, `${head}x`)}
          {slider('a77-cap', 'Budget cap per run, USD (max_budget_usd)', cap, setCap, 0.1, 20, 0.1, `$${cap.toFixed(1)}`)}
          {slider('a77-vm', 'Sandbox price per hour, USD (illustrative)', vm, setVm, 0.02, 1, 0.01, `$${vm.toFixed(2)}`)}
        </div>
        <div className="space-y-3" aria-live="polite">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Busy at peak</div>
              <div className="text-lg font-semibold tabular-nums">{Number.isInteger(c.busy) ? c.busy : c.busy.toFixed(1)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Workers to provision</div>
              <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>{c.workers.toLocaleString('en-US')}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Model spend per day, at cap</div>
              <div className="text-lg font-semibold tabular-nums">{usd(c.modelPerDay)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Sandbox per day (busy / fleet)</div>
              <div className="text-lg font-semibold tabular-nums">{usd(c.busyVmPerDay)} / {usd(c.fleetVmPerDay)}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            {rph.toLocaleString('en-US')} runs/h x {peak} x {min} min / 60 = {Number.isInteger(c.busy) ? c.busy : c.busy.toFixed(1)} runs in flight. With {head}x headroom that is {c.workers.toLocaleString('en-US')} workers for {c.runsPerDay.toLocaleString('en-US')} runs a day.
          </p>
          <p className="text-xs text-muted">
            Model spend is an upper bound: it assumes every run spends its whole cap. The fleet figure assumes provisioned workers run all day. Queue wait is not modelled: near 100% busy, waiting time climbs fast, which is why you keep headroom.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
