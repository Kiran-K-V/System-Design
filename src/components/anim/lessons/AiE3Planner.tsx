import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { DEFAULTS, HOURS_PER_MONTH, RESERVED_DISCOUNT, SPOT_DISCOUNT, plan, type PlanIn } from './AiE3PlanLogic';

const money = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

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

/** Capacity planner: traffic, goodput, headroom, spares, cold start and purchase mix to GPUs and dollars. */
export default function AiE3Planner() {
  const [p, setP] = useState<PlanIn>(DEFAULTS);
  const set = <K extends keyof PlanIn>(k: K) => (v: number) => setP((q) => ({ ...q, [k]: v }));
  const o = plan(p);
  const onDemand = Math.max(0, 1 - p.reservedShare - p.spotShare);

  return (
    <CacheWidgetFrame title="Capacity planner: from traffic to GPUs and dollars" hint="defaults are illustrative; replace them with your load test">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="space-y-3">
          <Slider id="e38-rps" label="Peak requests per second" value={p.peakRps} min={5} max={400} step={5} on={set('peakRps')} show={String(p.peakRps)} />
          <Slider id="e38-out" label="Output tokens per request" value={p.outTokens} min={50} max={2000} step={50} on={set('outTokens')} show={String(p.outTokens)} />
          <Slider id="e38-good" label="Goodput per replica (from your load test, output tok/s)" value={p.goodputPerReplica} min={500} max={8000} step={100} on={set('goodputPerReplica')} show={p.goodputPerReplica.toLocaleString('en-US')} />
          <Slider id="e38-gpr" label="GPUs per replica" value={p.gpusPerReplica} min={1} max={8} step={1} on={set('gpusPerReplica')} show={String(p.gpusPerReplica)} />
          <Slider id="e38-head" label="Headroom above peak" value={Math.round(p.headroom * 100)} min={0} max={100} step={5} on={(v) => set('headroom')(v / 100)} show={`${Math.round(p.headroom * 100)}%`} />
          <Slider id="e38-spare" label="Spare replicas for failures" value={p.spareReplicas} min={0} max={4} step={1} on={set('spareReplicas')} show={String(p.spareReplicas)} />
          <Slider id="e38-avg" label="Average load as share of peak" value={Math.round(p.avgOverPeak * 100)} min={10} max={100} step={5} on={(v) => set('avgOverPeak')(v / 100)} show={`${Math.round(p.avgOverPeak * 100)}%`} />
          <Slider id="e38-gb" label="Weights size" value={p.modelGB} min={8} max={800} step={4} on={set('modelGB')} show={`${p.modelGB} GB`} />
          <Slider id="e38-spd" label="Weights read speed (disk or network)" value={p.loadGBps} min={0.5} max={20} step={0.5} on={set('loadGBps')} show={`${p.loadGBps} GB/s`} />
          <Slider id="e38-ovh" label="Other start-up time (node, image, warm-up)" value={p.startOverheadS} min={10} max={300} step={10} on={set('startOverheadS')} show={`${p.startOverheadS} s`} />
          <Slider id="e38-ramp" label="Fastest traffic growth (share of load per minute)" value={Math.round(p.rampPerMin * 100)} min={0} max={200} step={10} on={(v) => set('rampPerMin')(v / 100)} show={`${Math.round(p.rampPerMin * 100)}%`} />
          <Slider id="e38-price" label="On-demand price per GPU-hour (illustrative)" value={p.gpuHour} min={1} max={10} step={0.25} on={set('gpuHour')} show={`$${p.gpuHour.toFixed(2)}`} />
          <Slider id="e38-res" label="Fleet bought as reserved" value={Math.round(p.reservedShare * 100)} min={0} max={100 - Math.round(p.spotShare * 100)} step={10} on={(v) => set('reservedShare')(v / 100)} show={`${Math.round(p.reservedShare * 100)}%`} />
          <Slider id="e38-spot" label="Fleet bought as spot" value={Math.round(p.spotShare * 100)} min={0} max={100 - Math.round(p.reservedShare * 100)} step={10} on={(v) => set('spotShare')(v / 100)} show={`${Math.round(p.spotShare * 100)}%`} />
          <Slider id="e38-pool" label="Warm pool in the autoscaled plan" value={p.warmPool} min={0} max={6} step={1} on={set('warmPool')} show={String(p.warmPool)} />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Peak output tokens per second" value={Math.round(o.peakTokS).toLocaleString('en-US')} />
            <Tile label="Replicas before headroom" value={String(o.replicasNoHeadroom)} />
            <Tile label="Replicas to provision" value={String(o.replicas)} color="var(--accent)" />
            <Tile label="GPUs to provision" value={String(o.gpus)} color="var(--accent)" />
            <Tile label="Weights load time" value={`${Math.round(o.loadS)} s`} />
            <Tile label="Cold start, total" value={`${Math.round(o.coldStartS)} s`} color="var(--warn)" />
            <Tile label="Headroom needed to ride out the start" value={`${Math.round(o.headroomNeeded * 100)}%`} />
            <Tile label="Headroom you set" value={o.headroomOk ? 'Enough' : 'Too small'} color={o.headroomOk ? 'var(--ok)' : 'var(--bad)'} />
            <Tile label="Fixed fleet, per month" value={money(o.fixedMonthly)} color="var(--warn)" />
            <Tile label="Average fleet use" value={`${Math.round(o.avgUtil * 100)}%`} color={o.avgUtil < 0.35 ? 'var(--bad)' : 'var(--ok)'} />
            <Tile label="Autoscaled plan, per month" value={money(o.autoMonthly)} />
            <Tile label="Fixed fleet per 1M tokens" value={`$${o.perMillionFixed.toFixed(2)}`} />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Replicas = ceil(peak tokens per second x (1 + headroom) / goodput per replica) + spares. Weights load time = size / read speed. Headroom needed = growth per minute x cold start in minutes: traffic keeps growing while a new replica starts, and only spare capacity covers the gap. The fixed fleet is bought for the peak around the clock at a blended price: reserved {Math.round(RESERVED_DISCOUNT * 100)}% off, spot {Math.round(SPOT_DISCOUNT * 100)}% off, {Math.round(onDemand * 100)}% on demand. Both discounts and the price are illustrative, and spot nodes can be taken back. The autoscaled plan is sized for average load plus spares plus the warm pool, at the on-demand price, and it does not cover a spike while new replicas start. A month is {HOURS_PER_MONTH} hours.
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
