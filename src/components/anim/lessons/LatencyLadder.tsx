import { useState } from 'react';
import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';

type Kind = 'cpu' | 'memory' | 'disk' | 'network';

interface Rung {
  label: string;
  ns: number;
  human: string;
  kind: Kind;
  caption: string;
}

const rungs: Rung[] = [
  {
    label: 'L1 cache read',
    ns: 1,
    human: '1 second',
    kind: 'cpu',
    caption: 'Start with the fastest thing: the CPU reads its L1 cache in about 1 ns. To feel the gaps, scale time up. Pretend 1 ns is 1 second.',
  },
  {
    label: 'L2 cache read',
    ns: 4,
    human: '4 seconds',
    kind: 'cpu',
    caption: 'L2 cache: about 4 ns. Still on the CPU chip. In human time: 4 seconds.',
  },
  {
    label: 'RAM read',
    ns: 100,
    human: '1.7 minutes',
    kind: 'memory',
    caption: 'Main memory: about 100 ns. In human time you wait almost 2 minutes. This is why CPUs have caches at all.',
  },
  {
    label: 'Send 1 KB on 10 Gbps',
    ns: 1_000,
    human: '17 minutes',
    kind: 'network',
    caption: 'Put 1 KB on a 10 Gbps link: about 1 µs. Sending bytes is cheap. Waiting for the other side is not.',
  },
  {
    label: 'Compress 1 KB',
    ns: 2_000,
    human: '33 minutes',
    kind: 'cpu',
    caption: 'Compress 1 KB with a fast codec: about 2 µs. Real CPU work costs microseconds, not nanoseconds.',
  },
  {
    label: 'SSD random read (4 KB)',
    ns: 100_000,
    human: '1.2 days',
    kind: 'disk',
    caption: 'One random SSD read: about 100 µs. In human time: more than a day. One disk read costs 1,000 RAM reads.',
  },
  {
    label: 'Round trip, same data center',
    ns: 500_000,
    human: '5.8 days',
    kind: 'network',
    caption: 'A network round trip inside one data center: about 500 µs. Every service call or database query pays at least this.',
  },
  {
    label: 'HDD seek',
    ns: 10_000_000,
    human: '3.8 months',
    kind: 'disk',
    caption: 'A spinning disk seek: about 10 ms. The head must move to the track. In human time: a season. Rare for databases now, still common for cold storage.',
  },
  {
    label: 'Round trip, US to Europe',
    ns: 150_000_000,
    human: '4.8 years',
    kind: 'network',
    caption: 'A round trip across the ocean: about 150 ms. Light in fiber has a speed limit. No code change fixes this. Only moving data closer does (CDNs, regions).',
  },
];

const steps = [
  ...rungs.map((r) => ({ caption: r.caption })),
  {
    caption:
      'Switch to the linear scale. Only the ocean round trip is visible. Everything on one machine is a rounding error next to one long network hop.',
  },
];

const COLOR: Record<Kind, string> = {
  cpu: 'var(--ok)',
  memory: 'var(--warn)',
  disk: 'var(--bad)',
  network: 'var(--accent)',
};

const MAX = Math.log10(rungs[rungs.length - 1].ns) + 0.6;

function fmt(ns: number) {
  if (ns < 1_000) return `${ns} ns`;
  if (ns < 1_000_000) return `${ns / 1_000} µs`;
  return `${ns / 1_000_000} ms`;
}

export default function LatencyLadder() {
  const [scale, setScale] = useState<'log' | 'linear' | null>(null);

  return (
    <AnimFrame title="The latency ladder (1 ns = 1 second)" steps={steps} interval={2600}>
      {(i) => {
        const shown = Math.min(i + 1, rungs.length);
        const mode = scale ?? (i >= rungs.length ? 'linear' : 'log');
        const width = (ns: number) =>
          mode === 'log' ? ((Math.log10(ns) + 0.6) / MAX) * 100 : (ns / rungs[rungs.length - 1].ns) * 100;

        return (
          <div className="px-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-3 text-xs text-muted">
                {(Object.keys(COLOR) as Kind[]).map((k) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLOR[k] }} />
                    {k === 'cpu' ? 'CPU' : k === 'memory' ? 'RAM' : k === 'disk' ? 'Disk' : 'Network'}
                  </span>
                ))}
              </div>
              <div className="flex overflow-hidden rounded-md border border-line text-xs">
                {(['log', 'linear'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setScale(m)}
                    className={`px-2 py-1 ${mode === m ? 'bg-surface font-semibold' : 'text-muted'}`}
                  >
                    {m === 'log' ? 'Log scale' : 'Linear scale'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {rungs.map((r, ri) => {
                const visible = ri < shown;
                const current = ri === i;
                return (
                  <div
                    key={r.label}
                    className={`grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 transition-opacity sm:grid-cols-[13rem_1fr] ${
                      visible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className={`truncate text-xs sm:text-sm ${current ? 'font-semibold' : ''}`} title={r.label}>
                      {r.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative h-5 flex-1 rounded-sm bg-surface">
                        <motion.div
                          className="h-full rounded-sm"
                          style={{ background: COLOR[r.kind], minWidth: 2 }}
                          initial={{ width: 0 }}
                          animate={{ width: visible ? `${width(r.ns)}%` : 0 }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="w-28 shrink-0 text-right font-mono text-[11px] leading-tight sm:w-36 sm:text-xs">
                        <div className="tabular-nums">{fmt(r.ns)}</div>
                        <div className="text-muted">{r.human}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    </AnimFrame>
  );
}
