import { useState } from 'react';

const MSS = 1460;
const IW = 10; // RFC 6928 initial window, in segments

/** Rounds of slow start needed to send `bytes`, ignoring loss and the receiver window. */
function rounds(bytes: number) {
  const segs = Math.ceil(bytes / MSS);
  let sent = 0;
  let cwnd = IW;
  const out: { cwnd: number; sent: number }[] = [];
  while (sent < segs) {
    const n = Math.min(cwnd, segs - sent);
    sent += n;
    out.push({ cwnd: n, sent });
    cwnd *= 2;
  }
  return { segs, out };
}

const SIZES = [
  { label: '10 KB', bytes: 10_000 },
  { label: '100 KB', bytes: 100_000 },
  { label: '1 MB', bytes: 1_000_000 },
  { label: '10 MB', bytes: 10_000_000 },
];

export default function SlowStartCalc() {
  const [rtt, setRtt] = useState(100);
  const [size, setSize] = useState(2);
  const { segs, out } = rounds(SIZES[size].bytes);
  const total = (1 + out.length) * rtt;
  const max = Math.max(...out.map((r) => r.cwnd));

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">Slow start: round trips to send one file</div>
      <div className="grid gap-5 px-4 py-4 sm:grid-cols-[14rem_1fr]">
        <div className="space-y-4 text-sm">
          <label className="block">
            <span className="flex justify-between">
              <span>Round-trip time</span>
              <span className="font-mono tabular-nums">{rtt} ms</span>
            </span>
            <input type="range" min={1} max={300} value={rtt} onChange={(e) => setRtt(+e.target.value)} className="mt-1 w-full accent-[var(--accent)]" />
            <span className="text-xs text-muted">1 ms is one rack. 100 ms is across an ocean.</span>
          </label>
          <fieldset>
            <legend className="mb-1">File size</legend>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSize(i)}
                  aria-pressed={i === size}
                  className={`rounded-md border px-2.5 py-1 text-xs ${i === size ? 'border-accent bg-accent-soft font-semibold' : 'border-line hover:bg-surface'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
          <dl className="grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-muted">Segments</dt>
            <dd className="text-right font-mono">{segs.toLocaleString('en-US')}</dd>
            <dt className="text-muted">Handshake</dt>
            <dd className="text-right font-mono">1 RTT</dd>
            <dt className="text-muted">Data rounds</dt>
            <dd className="text-right font-mono">{out.length} RTT</dd>
            <dt className="text-muted">Total (no loss)</dt>
            <dd className="text-right font-mono font-semibold">{total} ms</dd>
          </dl>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted">Segments sent in each round trip (the window doubles)</p>
          <div className="flex h-32 items-end gap-2 border-b border-line">
            <div className="flex w-10 flex-col items-center justify-end">
              <span className="mb-1 text-[10px] text-muted">SYN</span>
              <div className="h-2 w-full rounded-t bg-muted/50" />
            </div>
            {out.map((r, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-[10px] tabular-nums text-muted">{r.cwnd}</span>
                <div className="w-full rounded-t bg-accent" style={{ height: `${Math.max(4, (r.cwnd / max) * 96)}px` }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-2 text-[10px] text-muted">
            <span className="w-10 text-center">RTT 1</span>
            {out.map((_, i) => (
              <span key={i} className="flex-1 text-center">
                RTT {i + 2}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">
        A new connection starts with a window of 10 segments (about 14.6 KB) and doubles it each round trip while no loss occurs. A 1 MB file needs about 7 data rounds. At 100 ms
        that is 800 ms, even on a 1 Gbps link that could carry the file in 8 ms. Drag the RTT to see that latency, not bandwidth, sets the cost.
      </p>
    </figure>
  );
}
