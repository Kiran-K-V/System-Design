import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { DEFAULTS, STAGES, loadAt, maxQps, type Params, type Stage } from './scalingReads';

const STAGE_LABEL: Record<Stage, string> = { 'one-db': '1. One database', replicas: '2. Read replicas', cache: '3. Add a cache', cdn: '4. Add a CDN' };

const fmt = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(Math.round(n)));

function Slider({ id, label, value, min, max, step, shown, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; shown: string; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums text-fg">{shown}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[var(--accent)]" />
    </div>
  );
}

/** Before and after QPS meter for the read-scaling ladder. The math is in scalingReads.ts. */
export default function ScalingReadsMeter() {
  const [p, setP] = useState<Params>(DEFAULTS);
  const [stage, setStage] = useState<Stage>('cache');
  const [demand, setDemand] = useState(150_000);
  const set = (patch: Partial<Params>) => setP((cur) => ({ ...cur, ...patch }));

  const all = STAGES.map((s) => ({ s, ...maxQps(s, p) }));
  const top = Math.max(...all.map((a) => a.qps));
  const loads = loadAt(stage, p, demand);
  const here = all.find((a) => a.s === stage)!;
  const served = Math.min(demand, here.qps);

  return (
    <CacheWidgetFrame title="Read capacity at each stage" hint="reads per second, reads only">
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        <div className="space-y-3">
          <Slider id="sr-demand" label="Demand (reads/s)" value={demand} min={5_000} max={1_000_000} step={5_000} shown={fmt(demand)} onChange={setDemand} />
          <Slider id="sr-db" label="One database node serves" value={p.dbNodeQps} min={2_000} max={50_000} step={1_000} shown={`${fmt(p.dbNodeQps)}/s`} onChange={(v) => set({ dbNodeQps: v })} />
          <Slider id="sr-rep" label="Read replicas" value={p.replicas} min={1} max={8} step={1} shown={String(p.replicas)} onChange={(v) => set({ replicas: v })} />
          <Slider id="sr-cn" label="Cache nodes (100K/s each)" value={p.cacheNodes} min={1} max={6} step={1} shown={String(p.cacheNodes)} onChange={(v) => set({ cacheNodes: v })} />
          <Slider id="sr-hit" label="Cache hit ratio" value={p.cacheHit} min={0} max={0.99} step={0.01} shown={`${Math.round(p.cacheHit * 100)}%`} onChange={(v) => set({ cacheHit: v })} />
          <Slider id="sr-cdn" label="Reads the CDN answers" value={p.cdnHit} min={0} max={0.95} step={0.05} shown={`${Math.round(p.cdnHit * 100)}%`} onChange={(v) => set({ cdnHit: v })} />
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="mb-2 text-xs text-muted">Most reads per second each stage serves before something saturates</div>
            <div className="space-y-1.5" role="img" aria-label="Bar chart of maximum reads per second at each stage">
              {all.map((a) => (
                <div key={a.s} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-muted">{STAGE_LABEL[a.s]}</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg">
                    <div className="absolute inset-y-0 left-0 transition-[width] duration-200" style={{ width: `${(a.qps / top) * 100}%`, background: a.s === stage ? 'var(--accent)' : 'var(--muted)', opacity: a.s === stage ? 0.8 : 0.4 }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums">{fmt(a.qps)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted">Limit set by: {here.bottleneck} at stage {STAGES.indexOf(stage) + 1}.</div>
          </div>

          <div>
            <div className="mb-1 text-xs text-muted">Look inside one stage at {fmt(demand)} reads/s of demand</div>
            <Seg label="Stage" value={stage} onChange={setStage} options={STAGES.map((s) => ({ id: s, label: STAGE_LABEL[s] }))} />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {loads.map((t) => (
              <div key={t.name} className="rounded-lg border border-line bg-surface p-2.5">
                <div className="text-xs text-muted">{t.name} sees {Math.round(t.reach * 100)}% of reads</div>
                <div className="text-lg font-semibold tabular-nums">{fmt(t.load)}/s</div>
                <div className={`text-xs tabular-nums ${t.utilization > 1 ? 'text-bad' : t.utilization > 0.8 ? 'text-warn' : 'text-ok'}`}>
                  {Number.isFinite(t.capacity) ? `${Math.round(t.utilization * 100)}% of ${fmt(t.capacity)}/s` : 'edge, not limited here'}
                </div>
              </div>
            ))}
          </div>
          <p className="rounded-lg border border-line p-2.5 text-xs leading-relaxed text-muted">
            {served < demand
              ? `At this stage the system serves ${fmt(served)} of ${fmt(demand)} reads per second. The ${here.bottleneck.toLowerCase()} is over capacity, so requests queue and time out.`
              : `The stage serves all ${fmt(demand)} reads per second. Headroom before the ${here.bottleneck.toLowerCase()} saturates: ${fmt(here.qps - demand)} reads per second.`}
          </p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
