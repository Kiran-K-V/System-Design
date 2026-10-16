import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { POLICIES, simulateStorm, type Policy, type StormParams } from './Ai3LimitMath';

const W = 720;
const H = 240;
const L = 56;
const R = 16;
const T = 14;
const B = 40;
const MAX_SEC = 30;

/** Retry-storm simulator. Clients hit a token-bucket server at t = 0. Compare retry policies on the same load. */
export default function Ai3LimitStorm() {
  const [policy, setPolicy] = useState<Policy>('afterJ');
  const [clients, setClients] = useState(300);
  const [refill, setRefill] = useState(20);
  const [maxRetries, setMaxRetries] = useState(4);
  const [spendCap, setSpendCap] = useState(false);
  const [stop, setStop] = useState(false);

  const params: StormParams = { clients, refillPerSec: refill, maxRetries, baseSec: 1, capSec: 20, spendCap, stopOnSpendCap: stop, seed: 7 };
  const all = useMemo(() => POLICIES.map((p) => ({ p, r: simulateStorm(p.id, params) })), [clients, refill, maxRetries, spendCap, stop]);
  const cur = all.find((x) => x.p.id === policy)!.r;

  const bins = Array.from({ length: MAX_SEC }, (_, i) => cur.perSec[i] ?? 0);
  const yMax = Math.max(refill * 2, ...bins, 10);
  const bw = (W - L - R) / MAX_SEC;
  const py = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const beyond = cur.perSec.slice(MAX_SEC).reduce((a, b) => a + b, 0);

  return (
    <CacheWidgetFrame title="Retry storm after a 429" hint="token-bucket server, seeded simulation">
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Seg label="Retry policy" value={policy} options={POLICIES.map((p) => ({ id: p.id, label: p.label }))} onChange={setPolicy} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="a3s-c" className="mb-1 flex justify-between text-xs text-muted"><span>Clients, all failing at t = 0</span><span className="tabular-nums text-fg">{clients}</span></label>
            <input id="a3s-c" type="range" min={50} max={500} step={10} value={clients} onChange={(e) => setClients(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a3s-r" className="mb-1 flex justify-between text-xs text-muted"><span>Server refill (requests per second)</span><span className="tabular-nums text-fg">{refill}</span></label>
            <input id="a3s-r" type="range" min={5} max={50} step={5} value={refill} onChange={(e) => setRefill(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <label htmlFor="a3s-m" className="mb-1 flex justify-between text-xs text-muted"><span>Max retries per client</span><span className="tabular-nums text-fg">{maxRetries}</span></label>
            <input id="a3s-m" type="range" min={0} max={8} step={1} value={maxRetries} onChange={(e) => setMaxRetries(+e.target.value)} className="w-full accent-[var(--accent)]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={spendCap} onChange={(e) => setSpendCap(e.target.checked)} className="accent-[var(--accent)]" data-testid="a3s-spend" />
            Server is at its spend cap (429, no retry-after)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} className="accent-[var(--accent)]" data-testid="a3s-stop" />
            Client stops on a spend-cap 429
          </label>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Attempts reaching the server in each second">
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={L} x2={W - R} y1={py(yMax * f)} y2={py(yMax * f)} stroke="var(--border)" />
              <text x={L - 8} y={py(yMax * f) + 4} textAnchor="end" fontSize={14} fill="var(--muted)">{Math.round(yMax * f)}</text>
            </g>
          ))}
          {bins.map((v, i) => (
            <rect key={i} x={L + i * bw + 1} y={py(v)} width={Math.max(bw - 2, 1)} height={Math.max(H - B - py(v), 0)} fill={v > refill ? 'var(--bad)' : 'var(--accent)'} opacity={0.85} />
          ))}
          <line x1={L} x2={W - R} y1={py(refill)} y2={py(refill)} stroke="var(--fg)" strokeDasharray="5 4" />
          <text x={W - R} y={py(refill) - 6} textAnchor="end" fontSize={14} fill="var(--fg)">server refill</text>
          {[0, 10, 20, 30].map((s) => (
            <text key={s} x={L + s * bw} y={H - B + 18} textAnchor="middle" fontSize={14} fill="var(--muted)">{s} s</text>
          ))}
          <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" fontSize={14} fill="var(--muted)">attempts that reach the server, per second</text>
        </svg>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Attempts sent</div><div className="text-lg font-semibold tabular-nums" data-testid="a3s-attempts">{cur.attempts}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Clients served</div><div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--ok)' }} data-testid="a3s-served">{cur.served}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Gave up</div><div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--bad)' }} data-testid="a3s-gaveup">{cur.gaveUp}</div></div>
          <div className="rounded-lg border border-line bg-surface p-2.5"><div className="text-xs text-muted">Last served at</div><div className="text-lg font-semibold tabular-nums">{cur.doneSec === null ? 'never' : `${cur.doneSec} s`}</div></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr><th className="py-1 pr-3 font-medium">Policy</th><th className="pr-3 font-medium">Attempts</th><th className="pr-3 font-medium">Served</th><th className="pr-3 font-medium">Gave up</th><th className="font-medium">Peak per second</th></tr>
            </thead>
            <tbody>
              {all.map(({ p, r }) => (
                <tr key={p.id} className={p.id === policy ? 'text-fg' : 'text-muted'}>
                  <td className="py-0.5 pr-3">{p.label}</td><td className="pr-3 tabular-nums">{r.attempts}</td><td className="pr-3 tabular-nums">{r.served}</td><td className="pr-3 tabular-nums">{r.gaveUp}</td><td className="tabular-nums">{r.peakPerSec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          {beyond > 0 ? `${beyond} more attempts fall after 30 s and are not drawn. ` : ''}
          Model: the server holds {refill} tokens at start and refills {refill} per second. One attempt takes one token. Retry-after is the whole seconds until one token exists, at least 1. Jitter adds a random 0 to 2 s. Backoff starts at 1 s, doubles, and caps at 20 s.
        </p>
      </div>
    </CacheWidgetFrame>
  );
}
