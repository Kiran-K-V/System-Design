import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { curve, optimalInterval, waste } from './AiE2CkptLogic';

const W = 640;
const H = 200;
const PAD = 36;
const T_MIN = 2;
const T_MAX = 480;

function Slider({ id, label, value, min, max, step, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label htmlFor={id} className="block text-xs">
      <span className="flex justify-between text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg" data-testid={id}>{value} {unit}</span>
      </span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </label>
  );
}

export default function AiE2CkptCalc() {
  const [C, setC] = useState(2);
  const [M, setM] = useState(180);
  const [R, setR] = useState(10);
  const [T, setT] = useState(30);

  const opt = optimalInterval(C, M);
  const wNow = waste(T, C, M, R);
  const wOpt = waste(opt, C, M, R);
  const pts = curve(C, M, R, T_MIN, T_MAX, 80);
  const wMax = Math.min(1, Math.max(...pts.map((p) => p.w)));
  const x = (t: number) => PAD + ((Math.log(t) - Math.log(T_MIN)) / (Math.log(T_MAX) - Math.log(T_MIN))) * (W - 2 * PAD);
  const y = (w: number) => H - PAD - (Math.min(w, wMax) / wMax) * (H - 2 * PAD);
  const path = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.w).toFixed(1)}`).join(' ');

  return (
    <CacheWidgetFrame title="Checkpoint interval calculator" hint="first-order Young/Daly model, illustrative inputs">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider id="ck-c" label="Checkpoint stall (training paused)" value={C} min={1} max={30} step={1} unit="min" onChange={setC} />
        <Slider id="ck-m" label="Mean time between failures, whole job" value={M} min={30} max={1440} step={10} unit="min" onChange={setM} />
        <Slider id="ck-r" label="Restart time after a failure" value={R} min={0} max={60} step={1} unit="min" onChange={setR} />
        <Slider id="ck-t" label="Your checkpoint interval" value={T} min={5} max={240} step={5} unit="min" onChange={setT} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="Wasted time share against checkpoint interval">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--muted)" strokeWidth="1" />
        <line x1={PAD} y1={PAD - 10} x2={PAD} y2={H - PAD} stroke="var(--muted)" strokeWidth="1" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />
        <line x1={x(opt)} y1={PAD - 10} x2={x(opt)} y2={H - PAD} stroke="var(--ok)" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx={x(Math.min(Math.max(T, T_MIN), T_MAX))} cy={y(wNow)} r="5" fill="var(--warn)" />
        <text x={x(opt)} y={PAD - 14} fontSize="13" textAnchor="middle" fill="var(--ok)">optimum</text>
        <text x={W / 2} y={H - 8} fontSize="13" textAnchor="middle" fill="var(--muted)">checkpoint interval (log scale, 2 to 480 min)</text>
        <text x={PAD - 6} y={PAD} fontSize="13" textAnchor="end" fill="var(--muted)">{`${(wMax * 100).toFixed(0)}%`}</text>
        <text x={PAD - 6} y={H - PAD} fontSize="13" textAnchor="end" fill="var(--muted)">0</text>
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Optimal interval</div>
          <div className="text-lg font-semibold tabular-nums text-ok" data-testid="ck-opt">{opt.toFixed(0)} min</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Waste at your interval</div>
          <div className="text-lg font-semibold tabular-nums text-warn" data-testid="ck-waste">{(wNow * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Waste at the optimum</div>
          <div className="text-lg font-semibold tabular-nums" data-testid="ck-wopt">{(wOpt * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <div className="text-xs text-muted">Lost per failure (avg)</div>
          <div className="text-lg font-semibold tabular-nums text-bad" data-testid="ck-lost">{(T / 2).toFixed(0)} min</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">
        Model: waste = C/T + (T/2 + R)/M, where C is the stall per checkpoint, T the interval, M the mean time between failures, and R the restart time. It assumes failures arrive at random with a constant rate, a failure loses half an interval on average, and T is much smaller than M. Setting the slope to zero gives T = sqrt(2 x C x M), Young's first-order formula (Daly later added the restart time inside the root and a higher-order version; see Further reading). The restart time R lowers the useful share but, in this form, does not move the optimum. All slider values are illustrative, not measurements of any real cluster.
      </p>
    </CacheWidgetFrame>
  );
}
