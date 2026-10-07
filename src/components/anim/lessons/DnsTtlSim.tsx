import { useState } from 'react';

const OPTIONS = [
  { label: '30 s', sec: 30 },
  { label: '5 min', sec: 300 },
  { label: '1 hour', sec: 3600 },
  { label: '1 day', sec: 86400 },
];
/** Resolvers around the world that hold our record. Assumption for the demo. */
const RESOLVERS = 100_000;

function fmt(sec: number) {
  if (sec < 60) return `${sec} s`;
  if (sec < 3600) return `${+(sec / 60).toFixed(1)} min`;
  if (sec < 86400) return `${+(sec / 3600).toFixed(1)} h`;
  return `${+(sec / 86400).toFixed(1)} days`;
}

export default function DnsTtlSim() {
  const [i, setI] = useState(1);
  const ttl = OPTIONS[i].sec;
  const qps = RESOLVERS / ttl;
  const W = 340;
  const H = 130;
  const P = { l: 40, r: 10, t: 10, b: 28 };
  const x = (f: number) => P.l + f * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v) * (H - P.t - P.b);

  return (
    <figure className="not-prose my-8 overflow-hidden rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b border-line bg-surface px-4 py-2 text-sm font-medium">TTL: failover speed against server load</div>
      <div className="grid gap-5 px-4 py-4 sm:grid-cols-[1fr_1fr]">
        <div className="space-y-4 text-sm">
          <fieldset>
            <legend className="mb-1">TTL on the record</legend>
            <div className="flex flex-wrap gap-1.5">
              {OPTIONS.map((o, k) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={k === i}
                  onClick={() => setI(k)}
                  className={`rounded-md border px-3 py-1 text-sm ${k === i ? 'border-accent bg-accent-soft font-semibold' : 'border-line hover:bg-surface'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>
          <dl className="grid grid-cols-[1fr_auto] gap-y-1.5">
            <dt className="text-muted">Worst case: users on the dead IP after you switch</dt>
            <dd className="text-right font-mono font-semibold text-bad">{fmt(ttl)}</dd>
            <dt className="text-muted">Average wait until a given resolver refreshes</dt>
            <dd className="text-right font-mono">{fmt(ttl / 2)}</dd>
            <dt className="text-muted">Authoritative load ({RESOLVERS.toLocaleString('en-US')} resolvers, each asks once per TTL)</dt>
            <dd className="text-right font-mono font-semibold">{qps >= 10 ? Math.round(qps).toLocaleString('en-US') : qps.toFixed(1)} q/s</dd>
          </dl>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Share of resolvers still serving the old IP, falling from 100 percent to 0 over one TTL">
          <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke="var(--border)" />
          <line x1={P.l} x2={W - P.r} y1={y(1)} y2={y(1)} stroke="var(--border)" />
          <line x1={x(0)} y1={y(1)} x2={x(1)} y2={y(0)} stroke="var(--bad)" strokeWidth={2.5} />
          <text x={P.l - 6} y={y(1) + 4} textAnchor="end" fontSize={10} fill="var(--muted)">100%</text>
          <text x={P.l - 6} y={y(0) + 4} textAnchor="end" fontSize={10} fill="var(--muted)">0%</text>
          <text x={x(0)} y={H - 12} textAnchor="middle" fontSize={10} fill="var(--muted)">IP changed</text>
          <text x={x(1)} y={H - 12} textAnchor="end" fontSize={10} fill="var(--muted)">{fmt(ttl)} later</text>
          <text x={(W + P.l) / 2} y={P.t + 24} textAnchor="middle" fontSize={11} fill="var(--muted)">resolvers still on the old IP</text>
        </svg>
      </div>
      <p className="border-t border-line px-4 py-3 text-[0.95rem] leading-relaxed">
        You move a service to a new IP. Every resolver keeps the old answer until its own copy expires. Copies expire at different times, so the share on the old IP falls in a
        line from 100% to 0% over one TTL. Short TTL: fast failover, heavy load on your name servers. Long TTL: light load, slow failover.
      </p>
    </figure>
  );
}
