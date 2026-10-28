import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { OUT_TOKENS, RATES, knee, maxRate, point, sweep } from './AiE3ServeLogic';

const W = 640;
const H = 250;
const L = 52;
const R = 16;
const T = 16;
const B = 40;

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

/** Load test of one illustrative replica: throughput keeps rising, goodput peaks and falls. */
export default function AiE3LoadKnee() {
  const [rate, setRate] = useState(2.2);
  const [tpot, setTpot] = useState(50);
  const [ttft, setTtft] = useState(2);

  const pts = sweep(tpot, ttft);
  const cur = point(rate, tpot, ttft);
  const k = knee(tpot, ttft);
  const ymax = Math.max(...pts.map((p) => p.tokPerSec)) * 1.05;
  const xmin = RATES[0];
  const xmax = RATES[RATES.length - 1];
  const sx = (v: number) => L + ((v - xmin) / (xmax - xmin)) * (W - L - R);
  const sy = (v: number) => H - B - (v / ymax) * (H - B - T);
  const line = (f: (p: (typeof pts)[number]) => number) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.rate).toFixed(1)} ${sy(f(p)).toFixed(1)}`).join(' ');
  const verdict = cur.goodShare > 0.9 ? 'Healthy' : cur.goodShare > 0.4 ? 'Past the knee' : 'Most users miss a target';
  const vColor = cur.goodShare > 0.9 ? 'var(--ok)' : cur.goodShare > 0.4 ? 'var(--warn)' : 'var(--bad)';

  return (
    <CacheWidgetFrame title="Load test: throughput against goodput" hint="illustrative model of one replica, not a benchmark">
      <div className="grid gap-4 text-sm md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          <Slider id="e37-rate" label="Offered load (requests per second)" value={rate} min={0.2} max={4.7} step={0.05} on={setRate} show={rate.toFixed(2)} />
          <Slider id="e37-tpot" label="TPOT target" value={tpot} min={25} max={120} step={5} on={setTpot} show={`${tpot} ms`} />
          <Slider id="e37-ttft" label="TTFT target" value={ttft} min={0.5} max={5} step={0.25} on={setTtft} show={`${ttft.toFixed(2)} s`} />
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Throughput" value={`${Math.round(cur.tokPerSec)} tok/s`} />
            <Tile label="Goodput" value={`${Math.round(cur.goodTokPerSec)} tok/s`} color="var(--accent)" />
            <Tile label="TPOT now" value={`${cur.tpotMs.toFixed(0)} ms`} />
            <Tile label="TTFT now" value={`${cur.ttftS.toFixed(2)} s`} />
            <Tile label="Requests in batch" value={cur.batch.toFixed(0)} />
            <Tile label="Users within targets" value={`${Math.round(cur.goodShare * 100)}%`} color={vColor} />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Model: {OUT_TOKENS} output tokens per request, step time grows with batch size, 64 slots (about {maxRate().toFixed(1)} requests per second at full). Per-request times spread 30% either side of the mean. Every constant is made up for the picture.
          </p>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Throughput keeps rising with load while goodput peaks and then falls">
            <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--border)" strokeWidth={1.4} />
            <line x1={L} x2={L} y1={T} y2={H - B} stroke="var(--border)" strokeWidth={1.4} />
            <path d={line((p) => p.tokPerSec)} fill="none" stroke="var(--muted)" strokeWidth={2.2} />
            <path d={line((p) => p.goodTokPerSec)} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
            <line x1={sx(k.rate)} x2={sx(k.rate)} y1={T} y2={H - B} stroke="var(--ok)" strokeWidth={1.4} strokeDasharray="4 4" />
            <text x={sx(k.rate) + 5} y={T + 12} fontSize={13} fill="var(--ok)">knee</text>
            <line x1={sx(rate)} x2={sx(rate)} y1={T} y2={H - B} stroke="var(--fg)" strokeWidth={1.4} />
            <circle cx={sx(rate)} cy={sy(cur.tokPerSec)} r={4} fill="var(--muted)" />
            <circle cx={sx(rate)} cy={sy(cur.goodTokPerSec)} r={4} fill="var(--accent)" />
            <text x={L + 8} y={T + 12} fontSize={13} fill="var(--muted)">grey: throughput</text>
            <text x={L + 8} y={T + 30} fontSize={13} fill="var(--accent)">indigo: goodput</text>
            <text x={(L + W - R) / 2} y={H - 8} fontSize={13} textAnchor="middle" fill="var(--muted)">offered load (requests per second)</text>
            <text x={14} y={(T + H - B) / 2} fontSize={13} textAnchor="middle" fill="var(--muted)" transform={`rotate(-90 14 ${(T + H - B) / 2})`}>output tokens per second</text>
          </svg>
          <p className="mt-1 text-sm" style={{ color: vColor }}>{verdict}. Goodput peaks near {k.rate.toFixed(1)} requests per second at {Math.round(k.goodTokPerSec)} tokens per second.</p>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
