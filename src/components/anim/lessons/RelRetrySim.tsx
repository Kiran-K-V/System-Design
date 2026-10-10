import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { POLICIES, simulate, type Policy } from './relRetry';

const MAX_CALLS = 6;
const BASE_MS = 200;
const CAP_MS = 10_000;
const SEED = 7;
const BIN_MS = 100;
const BINS = 70; // 7 seconds shown

const W = 680;
const H = 230;
const P = { l: 50, r: 10, t: 16, b: 42 };

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export default function RelRetrySim() {
  const [policy, setPolicy] = useState<Policy>('expo');
  const [clients, setClients] = useState(100);
  const [capacity, setCapacity] = useState(200);

  const all = useMemo(
    () => POLICIES.map((p) => ({ ...p, r: simulate(p.id, { clients, capacityPerSec: capacity, maxCalls: MAX_CALLS, baseMs: BASE_MS, capMs: CAP_MS, seed: SEED }) })),
    [clients, capacity],
  );
  const cur = all.find((a) => a.id === policy)!;
  const capBin = (capacity * BIN_MS) / 1000;
  const yMax = Math.max(capBin * 1.1, ...all.map((a) => Math.max(...a.r.bins, 0))) * 1.08;
  const xOf = (b: number) => P.l + (b / BINS) * (W - P.l - P.r);
  const yOf = (v: number) => H - P.b - (v / yMax) * (H - P.t - P.b);
  const bw = (W - P.l - P.r) / BINS;
  const xTicks = [0, 1, 2, 3, 4, 5, 6, 7];
  const yTicks = [0, Math.round(yMax / 2 / 10) * 10, Math.round(yMax / 10) * 10].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <CacheWidgetFrame
      title="Retry storm: who retries when"
      hint={`${clients} clients, first call fails together at t = 0`}
      caption={
        <>
          Each bar counts the retry calls that reach the server in a 100 ms slot. The dashed line is what the server can answer in 100 ms (capacity per second divided by 10). Calls above it are rejected and retried again.
          With no jitter, the clients stay in step: each wave lands in one slot. Jitter spreads the same clients across many slots. Model: our own small simulation with a seeded random number generator, a first retry wait of {BASE_MS} ms,
          a cap of {fmt(CAP_MS / 1000)} s, and at most {MAX_CALLS} calls per client. It is not the AWS simulation, so do not compare the exact numbers with the AWS blog.
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>Clients that failed together</span>
            <span className="font-mono tabular-nums">{clients}</span>
          </span>
          <input type="range" min={20} max={200} step={10} value={clients} onChange={(e) => setClients(+e.target.value)} aria-label="Clients" className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>Server capacity (assumed)</span>
            <span className="font-mono tabular-nums">{capacity}/s</span>
          </span>
          <input type="range" min={100} max={400} step={50} value={capacity} onChange={(e) => setCapacity(+e.target.value)} aria-label="Server capacity per second" className="mt-1 w-full accent-[var(--accent)]" />
        </label>
      </div>
      <div className="mt-3">
        <Seg label="Retry policy" value={policy} options={POLICIES} onChange={setPolicy} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" role="img" aria-label={`Retry calls per 100 ms slot for ${cur.label}`}>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={yOf(v)} y2={yOf(v)} stroke="var(--border)" />
            <text x={P.l - 6} y={yOf(v) + 5} textAnchor="end" fontSize={15} fill="var(--muted)">
              {v}
            </text>
          </g>
        ))}
        {cur.r.bins.slice(0, BINS).map((c, b) =>
          c > 0 ? <rect key={b} x={xOf(b)} y={yOf(c)} width={Math.max(2, bw - 1)} height={H - P.b - yOf(c)} fill={c > capBin ? 'var(--bad)' : 'var(--accent)'} /> : null,
        )}
        <line x1={P.l} x2={W - P.r} y1={yOf(capBin)} y2={yOf(capBin)} stroke="var(--ok)" strokeWidth={2} strokeDasharray="6 5" />
        <text x={W - P.r - 4} y={yOf(capBin) - 6} textAnchor="end" fontSize={15} fill="var(--ok)">
          server limit per 100 ms: {fmt(capBin)}
        </text>
        <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="var(--muted)" />
        {xTicks.map((t) => (
          <text key={t} x={xOf(t * 10)} y={H - P.b + 18} textAnchor="middle" fontSize={15} fill="var(--muted)">
            {t}s
          </text>
        ))}
        <text x={(P.l + W - P.r) / 2} y={H - 6} textAnchor="middle" fontSize={15} fill="var(--muted)">
          time after the first failure (retries only)
        </text>
        <text x={P.l + 40} y={P.t + 4} fontSize={15} fill="var(--muted)">
          retry calls per 100 ms
        </text>
      </svg>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 pr-2 font-medium">Policy</th>
              <th className="py-1 pr-2 text-right font-medium">Calls in total</th>
              <th className="py-1 pr-2 text-right font-medium">Peak per second</th>
              <th className="py-1 pr-2 text-right font-medium">All done at</th>
              <th className="py-1 text-right font-medium">Gave up</th>
            </tr>
          </thead>
          <tbody>
            {all.map((a) => (
              <tr key={a.id} className={`border-t border-line ${a.id === policy ? 'bg-accent-soft' : ''}`}>
                <td className="py-1.5 pr-2">{a.label}</td>
                <td className="py-1.5 pr-2 text-right font-mono tabular-nums">{fmt(a.r.totalCalls)}</td>
                <td className="py-1.5 pr-2 text-right font-mono tabular-nums">{fmt(a.r.peakPerSec)}</td>
                <td className="py-1.5 pr-2 text-right font-mono tabular-nums">{a.r.doneMs === null ? 'not all' : `${(a.r.doneMs / 1000).toFixed(1)} s`}</td>
                <td className={`py-1.5 text-right font-mono tabular-nums ${a.r.gaveUp > 0 ? 'text-bad' : ''}`}>{a.r.gaveUp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CacheWidgetFrame>
  );
}
