import { useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { BULK_B, LAT_A, POOL, RATE_A, RATE_B, lab, type Mode } from './relBulkhead';

const MODES: { id: Mode; label: string }[] = [
  { id: 'shared', label: 'One shared pool' },
  { id: 'bulkhead', label: 'Bulkhead: two pools' },
  { id: 'breaker', label: 'Bulkhead + breaker on B' },
];

const LAT_STEPS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10];

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function RelBulkheadLab() {
  const [mode, setMode] = useState<Mode>('shared');
  const [li, setLi] = useState(6);
  const latB = LAT_STEPS[li];
  const o = lab(latB, mode);
  const split = mode !== 'shared';
  const idle = Math.max(0, POOL - o.usedA - o.usedB);

  const Bar = ({ label, a, b, size }: { label: string; a: number; b: number; size: number }) => (
    <div>
      <div className="flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{size} threads</span>
      </div>
      <div className="mt-1 flex h-7 overflow-hidden rounded border border-line bg-surface" role="img" aria-label={`${label}: ${Math.round(a)} threads used by A, ${Math.round(b)} by B`}>
        <div style={{ width: `${(a / size) * 100}%`, background: 'var(--accent)' }} />
        <div style={{ width: `${(b / size) * 100}%`, background: 'var(--warn)' }} />
      </div>
    </div>
  );

  return (
    <CacheWidgetFrame
      title="Bulkhead lab: one slow dependency, one pool of threads"
      hint={`Pool of ${POOL} threads. A: ${RATE_A} calls/s at ${LAT_A * 1000} ms. B: ${RATE_B} calls/s.`}
      caption={
        <>
          Model: threads in use = calls per second x seconds each call holds a thread (Little&apos;s law, lesson 1.3). When demand is above the pool, a call gets a thread with probability pool / demand.
          In the split modes B owns {BULK_B} threads and A owns {POOL - BULK_B}. With the breaker open, B calls fail at once and hold no thread (trial calls ignored). The numbers are examples. The shape is the lesson:
          without a wall, the slow dependency takes every thread, and the healthy one starves.
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>How long B holds a thread</span>
            <span className="font-mono tabular-nums">{latB < 1 ? `${latB * 1000} ms` : `${latB} s`}</span>
          </span>
          <input type="range" min={0} max={LAT_STEPS.length - 1} step={1} value={li} onChange={(e) => setLi(+e.target.value)} aria-label="How long calls to B hold a thread" className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <div className="flex items-end">
          <Seg label="Protection" value={mode} options={MODES} onChange={setMode} />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {split ? (
          <>
            <Bar label="Pool for A" a={o.usedA} b={0} size={POOL - BULK_B} />
            <Bar label="Pool for B" a={0} b={o.usedB} size={BULK_B} />
          </>
        ) : (
          <Bar label="Shared pool" a={o.usedA} b={o.usedB} size={POOL} />
        )}
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--accent)' }} /> held by A</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--warn)' }} /> held by B</span>
          <span>{split ? '' : `idle: ${Math.round(idle)} threads`}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-line px-2 py-2">
          <div className={`text-2xl font-semibold tabular-nums ${o.acceptA > 0.95 ? 'text-ok' : 'text-bad'}`}>{pct(o.acceptA)}</div>
          <div className="text-xs text-muted">of A calls get served (the healthy path)</div>
        </div>
        <div className="rounded-lg border border-line px-2 py-2">
          <div className={`text-2xl font-semibold tabular-nums ${o.acceptB > 0.95 ? 'text-ok' : 'text-bad'}`}>{pct(o.acceptB)}</div>
          <div className="text-xs text-muted">{mode === 'breaker' ? 'of B calls served, the rest fail at once' : 'of B calls get served (the slow path)'}</div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
