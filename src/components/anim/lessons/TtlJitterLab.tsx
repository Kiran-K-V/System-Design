import { useMemo, useState } from 'react';
import CacheWidgetFrame from './CacheWidgetFrame';
import { expiryCounts, flatRate } from './ttlJitter';

const KEYS = 10_000;
const BASE = 300; // seconds
const X_MIN = 290;
const X_MAX = 460;

const W = 680;
const H = 250;
const P = { l: 58, r: 10, t: 16, b: 44 };

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

export default function TtlJitterLab() {
  const [jitterPct, setJitterPct] = useState(0);
  const [cap, setCap] = useState(400);
  const jitter = jitterPct / 100;

  const counts = useMemo(() => expiryCounts(KEYS, BASE, jitter), [jitter]);
  const peak = Math.max(...counts);
  const over = counts.filter((c) => c > cap).length;
  const flat = flatRate(KEYS, BASE, jitter);
  const yMax = Math.max(peak, cap) * 1.1;

  const xOf = (s: number) => P.l + ((s - X_MIN) / (X_MAX - X_MIN)) * (W - P.l - P.r);
  const yOf = (v: number) => H - P.b - (v / yMax) * (H - P.t - P.b);
  const bw = (W - P.l - P.r) / (X_MAX - X_MIN);
  const ticks = [300, 330, 360, 390, 420, 450];
  const yTicks = [0, 0.5, 1].map((f) => Math.round((yMax / 1.1) * f));

  const ok = peak <= cap;

  return (
    <CacheWidgetFrame
      title="Why jitter spreads out expiry"
      hint={`Model: ${fmt(KEYS)} keys cached at the same moment, TTL ${BASE} s`}
      caption={
        <>
          With no jitter all {fmt(KEYS)} keys expire in the same second and the database must rebuild them all at once. Add 10% jitter and the same keys expire over 30
          seconds, about {fmt(KEYS / 30)} per second. The extra time is random, so the peak is a bit above the flat ideal. Jitter only adds time: no key lives shorter than the base TTL. Raise
          the jitter until the peak is under what your database can rebuild per second. This models the first wave of expiry only.
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>Jitter (extra random TTL, up to)</span>
            <span className="font-mono tabular-nums">
              +{jitterPct}% = {fmt(BASE * jitter)} s
            </span>
          </span>
          <input type="range" min={0} max={50} step={5} value={jitterPct} onChange={(e) => setJitterPct(+e.target.value)} aria-label="Jitter percent" className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label className="block text-sm">
          <span className="flex justify-between">
            <span>Database can rebuild</span>
            <span className="font-mono tabular-nums">{fmt(cap)} keys/s</span>
          </span>
          <input type="range" min={100} max={1000} step={50} value={cap} onChange={(e) => setCap(+e.target.value)} aria-label="Database rebuild capacity per second" className="mt-1 w-full accent-[var(--accent)]" />
        </label>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" role="img" aria-label="Number of keys expiring in each second, with the database capacity as a dashed line">
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={yOf(v)} y2={yOf(v)} stroke="var(--border)" />
            <text x={P.l - 6} y={yOf(v) + 5} textAnchor="end" fontSize={15} fill="var(--muted)">
              {fmt(v)}
            </text>
          </g>
        ))}
        {counts.map((c, s) =>
          c > 0 && s >= X_MIN && s <= X_MAX ? (
            <rect key={s} x={xOf(s)} y={yOf(c)} width={Math.max(1.5, bw - 0.6)} height={H - P.b - yOf(c)} fill={c > cap ? 'var(--bad)' : 'var(--accent)'} />
          ) : null,
        )}
        <line x1={P.l} x2={W - P.r} y1={yOf(cap)} y2={yOf(cap)} stroke="var(--ok)" strokeWidth={2} strokeDasharray="6 5" />
        <text x={W - P.r - 4} y={yOf(cap) - 6} textAnchor="end" fontSize={15} fill="var(--ok)">
          database limit {fmt(cap)}/s
        </text>
        <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="var(--muted)" />
        {ticks.map((t) => (
          <text key={t} x={xOf(t)} y={H - P.b + 18} textAnchor="middle" fontSize={15} fill="var(--muted)">
            {t}s
          </text>
        ))}
        <text x={(P.l + W - P.r) / 2} y={H - 6} textAnchor="middle" fontSize={15} fill="var(--muted)">
          seconds after the keys were cached
        </text>
        <text x={P.l + 4} y={P.t + 4} fontSize={15} fill="var(--muted)">
          keys expiring per second
        </text>
      </svg>

      <div className="mt-2 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <Stat label="Peak rebuilds per second" value={fmt(peak)} tone={ok ? 'ok' : 'bad'} />
        <Stat label="Flat ideal (keys / window)" value={jitter === 0 ? fmt(KEYS) : fmt(flat)} />
        <Stat label="Seconds over the DB limit" value={String(over)} tone={over === 0 ? 'ok' : 'bad'} />
        <Stat label="Verdict" value={ok ? 'DB copes' : `${(peak / cap).toFixed(1)}x too high`} tone={ok ? 'ok' : 'bad'} />
      </div>
    </CacheWidgetFrame>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="rounded-lg border border-line px-2 py-2">
      <div className={`text-xl font-semibold tabular-nums ${tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : ''}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
