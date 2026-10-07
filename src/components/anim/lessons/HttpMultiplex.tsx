import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';

type Kind = 'setup' | 'run' | 'stall';
interface Seg {
  row: number | 'all';
  from: number;
  to: number;
  kind: Kind;
}
interface Scenario {
  name: string;
  segs: Seg[];
  /** End time per row: [A, B, C]. */
  ends: [number, number, number];
  conns: string;
}

// Assumed numbers (illustrative): RTT 50 ms. TCP+TLS 1.3 setup = 2 RTT = 100 ms. QUIC setup = 1 RTT = 50 ms.
// Work: A = 300 ms of transfer, B = 60 ms, C = 60 ms.
const RES = [
  { key: 'A', name: 'app.js', ms: 300 },
  { key: 'B', name: 'style.css', ms: 60 },
  { key: 'C', name: 'logo.png', ms: 60 },
];

const SC: Scenario[] = [
  {
    name: 'HTTP/1.1, one connection',
    conns: '1 connection',
    segs: [
      { row: 'all', from: 0, to: 100, kind: 'setup' },
      { row: 0, from: 100, to: 400, kind: 'run' },
      { row: 1, from: 400, to: 460, kind: 'run' },
      { row: 2, from: 460, to: 520, kind: 'run' },
    ],
    ends: [400, 460, 520],
  },
  {
    name: 'HTTP/1.1, three connections',
    conns: '3 connections',
    segs: [
      { row: 0, from: 0, to: 100, kind: 'setup' },
      { row: 1, from: 0, to: 100, kind: 'setup' },
      { row: 2, from: 0, to: 100, kind: 'setup' },
      { row: 0, from: 100, to: 400, kind: 'run' },
      { row: 1, from: 100, to: 160, kind: 'run' },
      { row: 2, from: 100, to: 160, kind: 'run' },
    ],
    ends: [400, 160, 160],
  },
  {
    name: 'HTTP/2, one connection',
    conns: '1 connection',
    segs: [
      { row: 'all', from: 0, to: 100, kind: 'setup' },
      { row: 0, from: 100, to: 400, kind: 'run' },
      { row: 1, from: 100, to: 160, kind: 'run' },
      { row: 2, from: 100, to: 160, kind: 'run' },
    ],
    ends: [400, 160, 160],
  },
  {
    name: 'HTTP/2, one packet lost',
    conns: '1 connection',
    segs: [
      { row: 'all', from: 0, to: 100, kind: 'setup' },
      { row: 0, from: 100, to: 130, kind: 'run' },
      { row: 0, from: 130, to: 230, kind: 'stall' },
      { row: 0, from: 230, to: 500, kind: 'run' },
      { row: 1, from: 100, to: 130, kind: 'run' },
      { row: 1, from: 130, to: 230, kind: 'stall' },
      { row: 1, from: 230, to: 260, kind: 'run' },
      { row: 2, from: 100, to: 130, kind: 'run' },
      { row: 2, from: 130, to: 230, kind: 'stall' },
      { row: 2, from: 230, to: 260, kind: 'run' },
    ],
    ends: [500, 260, 260],
  },
  {
    name: 'HTTP/3, one packet lost',
    conns: '1 connection',
    segs: [
      { row: 'all', from: 0, to: 50, kind: 'setup' },
      { row: 0, from: 50, to: 80, kind: 'run' },
      { row: 0, from: 80, to: 180, kind: 'stall' },
      { row: 0, from: 180, to: 450, kind: 'run' },
      { row: 1, from: 50, to: 110, kind: 'run' },
      { row: 2, from: 50, to: 110, kind: 'run' },
    ],
    ends: [450, 110, 110],
  },
];

const steps = [
  { caption: 'A page needs three files: app.js (slow: 300 ms of work), style.css (60 ms) and logo.png (60 ms). Assume a 50 ms round trip. We will load the same page five ways and watch when each file finishes.' },
  { caption: 'HTTP/1.1, one connection. The connection carries one request at a time, and replies must come back in order. The two tiny files wait behind app.js. This is head-of-line blocking at the HTTP level. Setup is TCP plus TLS 1.3: 2 round trips = 100 ms.' },
  { caption: 'The browser works around it: open more connections (up to 6 per host). Now the small files finish early. But each connection pays its own TCP and TLS setup, and the server holds 3 connections for one page.' },
  { caption: 'HTTP/2 fixes it in the protocol. Many requests share one connection as separate streams, and the server interleaves their frames. One setup, no waiting in line. The small files finish at 160 ms.' },
  { caption: 'Now one packet is lost. TCP delivers bytes in order, and it does not know about streams. Every stream waits while the one missing packet is resent. The small files slip from 160 ms to 260 ms. This is head-of-line blocking at the TCP level.' },
  { caption: 'HTTP/3 runs over QUIC on UDP. QUIC tracks loss per stream. The lost packet belonged to app.js, so only app.js waits. The small files finish at 110 ms. QUIC also sets up in 1 round trip instead of 2.' },
];

const X0 = 130;
const SCALE = 700 / 520;
const px = (ms: number) => X0 + ms * SCALE;
const ROW_Y = [78, 128, 178];
const COLOR: Record<Kind, string> = { setup: 'var(--muted)', run: 'var(--accent)', stall: 'var(--bad)' };

function Bar({ seg, rowY }: { seg: Seg; rowY: number }) {
  const w = (seg.to - seg.from) * SCALE;
  const cx = px(seg.from) + w / 2;
  const tall = seg.row === 'all';
  const cy = tall ? (ROW_Y[0] + ROW_Y[2]) / 2 : rowY;
  const h = tall ? ROW_Y[2] - ROW_Y[0] + 28 : 28;
  return (
    <SketchBox
      cx={cx}
      cy={cy}
      w={Math.max(4, w - 2)}
      h={h}
      r={5}
      stroke={COLOR[seg.kind]}
      fill={COLOR[seg.kind]}
      fillStyle={seg.kind === 'stall' ? 'cross-hatch' : seg.kind === 'setup' ? 'zigzag' : 'hachure'}
      seed={seedOf(`${seg.kind}${seg.row}${seg.from}`)}
    />
  );
}

export default function HttpMultiplex() {
  return (
    <AnimFrame title="Loading one page over HTTP/1.1, HTTP/2 and HTTP/3" steps={steps} interval={3200}>
      {(i) => {
        const sc = i === 0 ? null : SC[i - 1];
        return (
          <>
            <SketchSvg width={900} height={250} label="Timeline bars showing when each of three files loads">
              {RES.map((r, k) => (
                <g key={r.key}>
                  <HandText x={X0 - 12} y={ROW_Y[k] - 5} size={15} anchor="end">
                    {r.name}
                  </HandText>
                  <HandText x={X0 - 12} y={ROW_Y[k] + 12} size={12} anchor="end" color="var(--muted)">
                    {`${r.ms} ms of work`}
                  </HandText>
                </g>
              ))}
              <line x1={X0} x2={X0 + 700} y1={218} y2={218} stroke="var(--border)" />
              {[0, 100, 200, 300, 400, 500].map((t) => (
                <g key={t}>
                  <line x1={px(t)} x2={px(t)} y1={214} y2={222} stroke="var(--muted)" />
                  <text x={px(t)} y={238} textAnchor="middle" fontSize={12} fill="var(--muted)">
                    {t} ms
                  </text>
                </g>
              ))}
              {sc && (
                <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  {sc.segs.map((s, k) => (
                    <Bar key={k} seg={s} rowY={s.row === 'all' ? 0 : ROW_Y[s.row]} />
                  ))}
                  {sc.ends.map((e, k) => (
                    <HandText key={k} x={px(e) + 8} y={ROW_Y[k]} size={14} anchor="start" color={e === Math.max(...sc.ends) ? 'var(--fg)' : 'var(--ok)'}>
                      {`done ${e} ms`}
                    </HandText>
                  ))}
                  <HandText x={px(0) + 4} y={22} size={16} anchor="start">
                    {`${sc.name}  (${sc.conns})`}
                  </HandText>
                </motion.g>
              )}
              {!sc && (
                <HandText x={X0 + 350} y={125} size={18} color="var(--muted)">
                  gray = connection setup, blue = transfer, red = stalled
                </HandText>
              )}
            </SketchSvg>
            <Legend i={i} />
          </>
        );
      }}
    </AnimFrame>
  );
}

function Legend({ i }: { i: number }) {
  if (i === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 px-2 text-xs text-muted">
      <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLOR.setup }} /> connection setup</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLOR.run }} /> transfer</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLOR.stall }} /> stalled by loss</span>
    </div>
  );
}
