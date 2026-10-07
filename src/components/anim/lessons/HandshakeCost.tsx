import { useState } from 'react';

interface Setup {
  name: string;
  detail: string;
  parts: { label: string; rtts: number; color: string }[];
}

const TCP = 'var(--muted)';
const TLS = 'var(--warn)';
const REQ = 'var(--ok)';

const SETUPS: Setup[] = [
  {
    name: 'HTTPS, TLS 1.2 over TCP',
    detail: 'TCP 1 + TLS 2 + request 1',
    parts: [
      { label: 'TCP', rtts: 1, color: TCP },
      { label: 'TLS', rtts: 2, color: TLS },
      { label: 'req', rtts: 1, color: REQ },
    ],
  },
  {
    name: 'HTTPS, TLS 1.3 over TCP',
    detail: 'TCP 1 + TLS 1 + request 1',
    parts: [
      { label: 'TCP', rtts: 1, color: TCP },
      { label: 'TLS', rtts: 1, color: TLS },
      { label: 'req', rtts: 1, color: REQ },
    ],
  },
  {
    name: 'HTTP/3, new connection',
    detail: 'QUIC + TLS 1 + request 1',
    parts: [
      { label: 'QUIC+TLS', rtts: 1, color: TLS },
      { label: 'req', rtts: 1, color: REQ },
    ],
  },
  {
    name: 'HTTP/3, resumed (0-RTT)',
    detail: 'request rides the first flight',
    parts: [{ label: 'req', rtts: 1, color: REQ }],
  },
  {
    name: 'Any protocol, warm connection',
    detail: 'request 1',
    parts: [{ label: 'req', rtts: 1, color: REQ }],
  },
];

export default function HandshakeCost() {
  const [rtt, setRtt] = useState(100);
  const MAXR = 4;
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Time to first byte, by connection type</div>
      <div className="space-y-4 px-4 py-4">
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>Round-trip time to the server</span>
            <span className="font-mono tabular-nums">{rtt} ms</span>
          </span>
          <input type="range" min={1} max={300} value={rtt} onChange={(e) => setRtt(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <ul className="space-y-3">
          {SETUPS.map((s) => {
            const total = s.parts.reduce((a, p) => a + p.rtts, 0);
            return (
              <li key={s.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    {s.name} <span className="text-xs text-muted">({s.detail})</span>
                  </span>
                  <span className="font-mono tabular-nums font-semibold">{total * rtt} ms</span>
                </div>
                <div className="mt-1 flex h-6 overflow-hidden rounded bg-surface" style={{ width: `${(total / MAXR) * 100}%` }}>
                  {s.parts.map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center justify-center overflow-hidden whitespace-nowrap border-r border-bg text-xs font-medium text-white last:border-r-0"
                      style={{ flex: p.rtts, background: p.color }}
                    >
                      {p.label}
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">
        Every block is one round trip. At 100 ms, the oldest setup costs 400 ms before the first byte and a warm connection costs 100 ms. Slide down to 1 ms: the gap almost vanishes
        inside a data center. The gap matters most for users far from the server.
      </p>
    </figure>
  );
}
