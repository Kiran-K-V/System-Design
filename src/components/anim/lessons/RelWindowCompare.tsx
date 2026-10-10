import { useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { boundaryBurst, fixedWindow, slidingCounter, slidingLog } from './relRateLimit';

/**
 * Fixed window against two sliding windows at the edge of a window.
 * A client sends `LIMIT` requests just before the window boundary and `LIMIT` more just after it.
 */

const LIMIT = 10;
const WINDOW = 10; // seconds
const GAPS = [0.2, 1, 2, 4, 6, 8];

const W = 680;
const H = 70;
const PAD = 40;

interface Algo {
  id: string;
  name: string;
  run: (arrivals: number[]) => boolean[];
  note: string;
}

const ALGOS: Algo[] = [
  { id: 'fixed', name: 'Fixed window', run: (a) => fixedWindow(LIMIT, WINDOW, a), note: 'A counter that resets at each boundary. Cheapest.' },
  { id: 'log', name: 'Sliding window log', run: (a) => slidingLog(LIMIT, WINDOW, a), note: 'Stores every request time. Exact. Memory grows with traffic.' },
  { id: 'counter', name: 'Sliding window counter', run: (a) => slidingCounter(LIMIT, WINDOW, a), note: 'Two numbers per client. An estimate.' },
];

export default function RelWindowCompare() {
  const [gi, setGi] = useState(3);
  const gap = GAPS[gi];
  const arrivals = boundaryBurst(LIMIT, WINDOW, gap);
  const xOf = (t: number) => PAD + (t / (2 * WINDOW)) * (W - 2 * PAD);

  return (
    <CacheWidgetFrame
      title="Window edge: two bursts of 10, a few seconds apart"
      hint={`Limit ${LIMIT} requests per ${WINDOW} s`}
      caption={
        <>
          A client sends 10 requests just before the boundary at t = {WINDOW} s and 10 more just after it. The limit is 10 per {WINDOW} s, so a correct limiter should let about 10 through in any {WINDOW} s. The fixed window counter resets at the
          boundary and lets all 20 pass, double the limit. The sliding log rejects the second burst when the first is still inside the last {WINDOW} s. The sliding counter lets part of it through, because it only estimates:
          previous count x the share of the previous window still in range, plus the current count.
        </>
      }
    >
      <label className="block text-sm">
        <span className="flex justify-between">
          <span>Time between the two bursts</span>
          <span className="font-mono tabular-nums">{gap} s</span>
        </span>
        <input type="range" min={0} max={GAPS.length - 1} step={1} value={gi} onChange={(e) => setGi(+e.target.value)} aria-label="Time between the two bursts" className="mt-1 w-full accent-[var(--accent)]" />
      </label>

      <div className="mt-4 space-y-3">
        {ALGOS.map((a) => {
          const res = a.run(arrivals);
          const passed = res.filter(Boolean).length;
          const first = res.slice(0, LIMIT).filter(Boolean).length;
          const second = passed - first;
          const t1 = arrivals[0];
          const t2 = arrivals[LIMIT];
          return (
            <div key={a.id} className="rounded-lg border border-line p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{a.name}</span>
                <span className={`font-mono tabular-nums ${passed > LIMIT ? 'text-bad' : 'text-ok'}`}>
                  {passed} of {2 * LIMIT} allowed {passed > LIMIT ? `(${(passed / LIMIT).toFixed(1)}x the limit)` : ''}
                </span>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 h-auto w-full" role="img" aria-label={`${a.name}: ${first} of the first burst and ${second} of the second burst are allowed`}>
                <line x1={PAD} x2={W - PAD} y1={44} y2={44} stroke="var(--muted)" />
                {[0, WINDOW, 2 * WINDOW].map((t) => (
                  <g key={t}>
                    <line x1={xOf(t)} x2={xOf(t)} y1={t === WINDOW ? 8 : 38} y2={50} stroke={t === WINDOW ? 'var(--fg)' : 'var(--muted)'} strokeDasharray={t === WINDOW ? '5 4' : undefined} />
                    <text x={xOf(t)} y={66} textAnchor="middle" fontSize={15} fill="var(--muted)">
                      {t} s
                    </text>
                  </g>
                ))}
                <text x={xOf(WINDOW) + 6} y={20} fontSize={15} fill="var(--muted)">
                  window boundary
                </text>
                {[[t1, first], [t2, second]].map(([t, n], k) => (
                  <g key={k}>
                    <circle cx={xOf(t)} cy={32} r={9} fill={n === LIMIT ? 'var(--ok)' : n === 0 ? 'var(--bad)' : 'var(--warn)'} fillOpacity={0.25} stroke={n === LIMIT ? 'var(--ok)' : n === 0 ? 'var(--bad)' : 'var(--warn)'} strokeWidth={1.5} />
                    <text x={xOf(t) + (k === 0 ? -14 : 14)} y={36} textAnchor={k === 0 ? 'end' : 'start'} fontSize={15} fill="var(--fg)">
                      {n} pass
                    </text>
                  </g>
                ))}
              </svg>
              <div className="text-xs text-muted">{a.note}</div>
            </div>
          );
        })}
      </div>
    </CacheWidgetFrame>
  );
}
