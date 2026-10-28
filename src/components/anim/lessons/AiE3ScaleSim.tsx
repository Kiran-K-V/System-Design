import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { DT, TICKS, simulate } from './AiE3ScaleLogic';

const W = 640;
const H = 230;
const L = 44;
const R = 12;
const T = 14;
const B = 36;
const GPU_HOUR = 4; // illustrative
const BASE = 6;

function Slider({ id, label, value, min, max, step, on, show }: { id: string; label: string; value: number; min: number; max: number; step: number; on: (v: number) => void; show: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{show}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-semibold tabular-nums" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

/** Spike simulator: cold start time and warm pool size against dropped traffic and cost. */
export default function AiE3ScaleSim() {
  const [cold, setCold] = useState(300);
  const [pool, setPool] = useState(0);
  const [spike, setSpike] = useState(20);
  const [util, setUtil] = useState(70);

  const base = { base: BASE, spike, coldStartS: cold, targetUtil: util / 100, gpuHour: GPU_HOUR, gpusPerReplica: 1 };
  const o = simulate({ ...base, warmPool: pool });
  const none = simulate({ ...base, warmPool: 0 });
  const ymax = Math.max(...o.demand, ...o.ready) * 1.1;
  const sx = (i: number) => L + (i / (TICKS - 1)) * (W - L - R);
  const sy = (v: number) => H - B - (v / ymax) * (H - B - T);
  const path = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(' ');
  const extra = o.costPerHour - none.costPerHour;

  return (
    <CacheWidgetFrame title="Spike simulator: warm pool, dropped traffic, cost" hint="illustrative, 30 minutes, 1 GPU per replica, $4 per GPU-hour">
      <div className="grid gap-4 text-sm md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          <Slider id="e38-cold" label="Cold start time of one replica" value={cold} min={30} max={900} step={30} on={setCold} show={`${cold} s`} />
          <Slider id="e38-pool" label="Warm pool (idle replicas that hold weights)" value={pool} min={0} max={12} step={1} on={setPool} show={String(pool)} />
          <Slider id="e38-spike" label="Spike size (replicas of traffic, base is 6)" value={spike} min={8} max={30} step={1} on={setSpike} show={String(spike)} />
          <Slider id="e38-util" label="Autoscaler target load per replica" value={util} min={40} max={95} step={5} on={setUtil} show={`${util}%`} />
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Traffic not served" value={`${(o.droppedShare * 100).toFixed(1)}%`} color={o.droppedShare > 0.05 ? 'var(--bad)' : 'var(--ok)'} />
            <Tile label="Seconds short of capacity" value={`${o.dropSeconds} s`} />
            <Tile label="Average cost per hour" value={`$${o.costPerHour.toFixed(0)}`} color="var(--warn)" />
            <Tile label="Extra cost of the pool" value={`+$${extra.toFixed(0)} per hour`} />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            The autoscaler sees traffic after {30} s, aims for the target load, and scales down only after 5 minutes of lower need. A pool replica needs 20 s to start, then the pool refills in the background after a full cold start. Constants are made up for the picture.
          </p>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Demand and ready replicas over thirty minutes during a spike">
            <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--border)" strokeWidth={1.4} />
            <line x1={L} x2={L} y1={T} y2={H - B} stroke="var(--border)" strokeWidth={1.4} />
            <path d={path(o.demand)} fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="6 4" />
            <path d={path(o.ready)} fill="none" stroke="var(--ok)" strokeWidth={2.2} />
            <text x={L + 8} y={T + 12} fontSize={13} fill="var(--accent)">dashed: demand</text>
            <text x={L + 8} y={T + 30} fontSize={13} fill="var(--ok)">solid: ready replicas</text>
            <text x={(L + W - R) / 2} y={H - 8} fontSize={13} textAnchor="middle" fill="var(--muted)">{`time, 0 to ${(TICKS * DT) / 60} minutes`}</text>
            <text x={12} y={(T + H - B) / 2} fontSize={13} textAnchor="middle" fill="var(--muted)" transform={`rotate(-90 12 ${(T + H - B) / 2})`}>replicas</text>
          </svg>
          <p className="mt-1 text-sm text-muted">Where the solid line is under the dashed line, requests queue or fail.</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
