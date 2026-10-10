import { useEffect, useMemo, useState } from 'react';
import { WidgetFrame } from '../data-kit';
import { HandText, SketchSvg, TEXT_SIZES } from '../sketch';
import AsyncQueueViz, { TRAY_CELLS, type QMsg } from './AsyncQueueViz';
import { capacity, rateAt, simulate, summarize, type LabParams, type Policy } from './asyncSim';
import type { Tone } from '../FlowDiagram';

/**
 * Live queue lab. Producers send a steady stream, then a burst. Workers drain at a fixed rate.
 * Model: one tick is one second. Rates are exact numbers, with no randomness.
 * Every worker finishes 5 messages per second. A worker never idles while a message waits.
 */

const BASE = 30;
const PER_WORKER = 5;
const SECONDS = 300;
const BURST_START = 5;

interface Props {
  /** Show the full-queue policy and size controls (lesson 6.4). */
  policies?: boolean;
  initial?: { burst?: number; burstLen?: number; workers?: number; policy?: Policy; cap?: number };
  title?: string;
}

const waitTone = (s: number): Tone => (s < 5 ? 'ok' : s < 30 ? 'warn' : 'bad');
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export default function AsyncFlowLab({ policies = false, initial = {}, title = 'Burst into a queue' }: Props) {
  const [burst, setBurst] = useState(initial.burst ?? 300);
  const [burstLen, setBurstLen] = useState(initial.burstLen ?? 10);
  const [workers, setWorkers] = useState(initial.workers ?? 10);
  const [policy, setPolicy] = useState<Policy>(policies ? (initial.policy ?? 'unbounded') : 'unbounded');
  const [cap, setCap] = useState(initial.cap ?? 200);
  const [t, setT] = useState(BURST_START + (initial.burstLen ?? 10));
  const [playing, setPlaying] = useState(false);

  const p: LabParams = { base: BASE, burst, burstStart: BURST_START, burstLen, workers, perWorker: PER_WORKER, cap, policy, seconds: SECONDS };
  const ticks = useMemo(() => simulate(p), [burst, burstLen, workers, policy, cap]); // eslint-disable-line react-hooks/exhaustive-deps
  const sum = useMemo(() => summarize(ticks, p), [ticks]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = ticks[Math.min(t, ticks.length - 1)];
  const cp = capacity(p);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((x) => {
        if (x >= SECONDS - 1) {
          setPlaying(false);
          return SECONDS - 1;
        }
        return x + 2;
      });
    }, 80);
    return () => clearInterval(id);
  }, [playing]);

  const wait = cur.depth / cp;
  const buffer: QMsg[] = Array.from({ length: Math.min(TRAY_CELLS, Math.ceil(cur.depth)) }, () => ({ label: '' }));
  const note = policy === 'block' && cur.held > 0 ? `${fmt(cur.held)} held` : `${fmt(rateAt(p, cur.t))} msg/s`;

  return (
    <WidgetFrame
      title={title}
      caption={
        <>
          Press Play. Producers send {BASE} messages per second, then a burst. Each worker does {PER_WORKER} per second, so {workers} workers do {cp}. The queue absorbs the burst, then it drains at the surplus rate. Try fewer workers: when the base rate reaches capacity, the queue never drains.
        </>
      }
    >
      <AsyncQueueViz
        buffer={buffer}
        depth={Math.ceil(cur.depth)}
        workers={[{ label: `${workers} workers`, state: cur.done > 0 ? 'busy' : 'idle' }]}
        producerNote={note}
        producerTone={rateAt(p, cur.t) > cp ? 'warn' : 'default'}
        activeProducer={rateAt(p, cur.t) > 0}
        meter={{ label: `wait for a new message: ~${wait < 10 ? wait.toFixed(1) : fmt(wait)} s`, fill: Math.min(1, wait / 60), tone: waitTone(wait) }}
        label="Queue with a burst of arrivals and workers draining at a fixed rate"
      />
      <DepthChart ticks={ticks} t={cur.t} cap={policy === 'unbounded' ? null : cap} />

      <div className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Slider label="Burst rate" unit="msg/s" value={burst} min={100} max={600} step={50} onChange={setBurst} />
        <Slider label="Burst length" unit="s" value={burstLen} min={5} max={30} step={5} onChange={setBurstLen} />
        <Slider label="Workers" unit="" value={workers} min={2} max={30} step={1} onChange={setWorkers} />
        {policies && (
          <>
            <Slider label="Queue limit" unit="msgs" value={cap} min={50} max={1000} step={50} onChange={setCap} disabled={policy === 'unbounded'} />
            <label className="block sm:col-span-2">
              <span className="text-muted">When the queue is full</span>
              <select
                value={policy}
                onChange={(e) => setPolicy(e.target.value as Policy)}
                className="mt-1 block w-full rounded-md border border-line bg-bg px-2 py-1.5"
              >
                <option value="unbounded">No limit: the queue keeps growing</option>
                <option value="block">Block: producers hold the extra and wait</option>
                <option value="drop">Drop: the queue throws the extra away</option>
              </select>
            </label>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            if (t >= SECONDS - 1) setT(0);
            setPlaying((x) => !x);
          }}
          className="h-8 rounded-md bg-accent px-3 font-medium text-white hover:opacity-90"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={() => { setPlaying(false); setT(0); }} className="h-8 rounded-md border border-line px-3 hover:bg-surface">
          Reset
        </button>
        <input
          type="range"
          min={0}
          max={SECONDS - 1}
          value={cur.t}
          onChange={(e) => { setPlaying(false); setT(+e.target.value); }}
          aria-label="Time in seconds"
          className="mx-1 min-w-[8rem] flex-1 accent-[var(--accent)]"
        />
        <span className="w-16 text-right font-mono text-xs tabular-nums text-muted">t = {cur.t} s</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-1 text-xs sm:grid-cols-4 sm:gap-x-4">
        <dt className="text-muted">Peak queue</dt>
        <dd className="font-mono">{fmt(sum.peakDepth)} msgs</dd>
        <dt className="text-muted">Worst wait</dt>
        <dd className="font-mono">{Number.isFinite(sum.peakWait) ? `${fmt(sum.peakWait)} s` : 'never'}</dd>
        <dt className="text-muted">Queue empty at</dt>
        <dd className="font-mono">{sum.drainedAt === null ? (sum.keepsUp ? 'after 300 s' : 'never') : `${sum.drainedAt} s`}</dd>
        <dt className="text-muted">Dropped</dt>
        <dd className="font-mono" style={{ color: sum.dropped > 0 ? 'var(--bad)' : undefined }}>{fmt(sum.dropped)} msgs</dd>
      </dl>
    </WidgetFrame>
  );
}

function Slider(props: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <label className={`block ${props.disabled ? 'opacity-40' : ''}`}>
      <span className="flex justify-between">
        <span>{props.label}</span>
        <span className="font-mono tabular-nums">{props.value} {props.unit}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(+e.target.value)}
        className="mt-1 w-full accent-[var(--accent)]"
      />
    </label>
  );
}

function DepthChart({ ticks, t, cap }: { ticks: { t: number; depth: number; held: number }[]; t: number; cap: number | null }) {
  const W = 720;
  const H = 190;
  const L = 64;
  const R = 20;
  const T = 36;
  const B = 36;
  const peak = Math.max(1, ...ticks.map((k) => k.depth + k.held), cap ?? 0);
  const x = (s: number) => L + (s / (ticks.length - 1)) * (W - L - R);
  const y = (v: number) => H - B - (v / peak) * (H - T - B);
  const line = (f: (k: { depth: number; held: number }) => number) => ticks.map((k) => `${x(k.t).toFixed(1)},${y(f(k)).toFixed(1)}`).join(' ');
  const showHeld = ticks.some((k) => k.held > 0);
  return (
    <SketchSvg width={W} height={H} label="Queue depth over time">
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="var(--border)" />
      <line x1={L} x2={L} y1={T} y2={y(0)} stroke="var(--border)" />
      <HandText x={L - 8} y={y(0)} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">0</HandText>
      <HandText x={L - 8} y={y(peak)} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">{fmt(peak)}</HandText>
      {[0, 100, 200, 299].map((s) => (
        <HandText key={s} x={x(s)} y={H - 16} size={TEXT_SIZES.note} color="var(--muted)">{`${s === 299 ? 300 : s} s`}</HandText>
      ))}
      <HandText x={W - R} y={12} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">messages waiting</HandText>
      {cap !== null && <line x1={L} x2={W - R} y1={y(cap)} y2={y(cap)} stroke="var(--bad)" strokeDasharray="5 5" />}
      {cap !== null && <HandText x={W - R} y={y(cap) - 12} size={TEXT_SIZES.note} anchor="end" color="var(--bad)">queue limit</HandText>}
      {showHeld && <HandText x={L} y={12} size={TEXT_SIZES.note} anchor="start" color="var(--warn)">orange: queue plus messages held by producers</HandText>}
      {showHeld && <polyline points={line((k) => k.depth + k.held)} fill="none" stroke="var(--warn)" strokeWidth={2} />}
      <polyline points={line((k) => k.depth)} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
      <line x1={x(t)} x2={x(t)} y1={T} y2={y(0)} stroke="var(--muted)" strokeDasharray="3 3" />
    </SketchSvg>
  );
}
