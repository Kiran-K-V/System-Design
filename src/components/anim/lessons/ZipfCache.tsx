import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';

/** Model: N keys, the key at rank r is requested with probability proportional to 1 / r^s (a Zipf law). */
const N = 1_000_000;
const SKEWS = [
  { id: 0.8, label: 'Mild skew (s = 0.8)' },
  { id: 1, label: 'Classic Zipf (s = 1)' },
  { id: 1.2, label: 'Heavy skew (s = 1.2)' },
];

/** cum[r] = share of all requests that go to the r most popular keys. */
function cumulative(s: number): Float64Array {
  const cum = new Float64Array(N + 1);
  for (let r = 1; r <= N; r++) cum[r] = cum[r - 1] + 1 / Math.pow(r, s);
  const total = cum[N];
  for (let r = 1; r <= N; r++) cum[r] /= total;
  return cum;
}

const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (x: number) => (x >= 0.995 ? (x * 100).toFixed(1) : (x * 100).toFixed(0)) + '%';

function sizeLabel(keys: number) {
  const kb = keys; // 1 KB per cached object
  if (kb >= 1_000_000) return `${(kb / 1_000_000).toFixed(1)} GB`;
  if (kb >= 1000) return `${(kb / 1000).toFixed(kb >= 10_000 ? 0 : 1)} MB`;
  return `${kb} KB`;
}

export default function ZipfCache() {
  const [s, setS] = useState(1);
  const [pos, setPos] = useState(2 / 3); // slider position 0..1 maps to 10^(6*pos) keys
  const cum = useMemo(() => cumulative(s), [s]);
  const size = Math.max(1, Math.min(N, Math.round(Math.pow(10, 6 * pos))));
  const hit = cum[size];

  // Left panel: first 48 keys, bar height = share of requests.
  const BARS = 48;
  const share1 = cum[1];
  const bars = Array.from({ length: BARS }, (_, i) => (cum[i + 1] - cum[i]) / share1);

  // Right panel: cumulative curve on a log x axis.
  const W = 340;
  const H = 190;
  const P = { l: 40, r: 12, t: 12, b: 34 };
  const xOf = (keys: number) => P.l + (Math.log10(keys) / 6) * (W - P.l - P.r);
  const yOf = (share: number) => H - P.b - share * (H - P.t - P.b);
  const curve: string[] = [];
  for (let e = 0; e <= 6.001; e += 0.1) {
    const k = Math.min(N, Math.max(1, Math.round(Math.pow(10, e))));
    curve.push(`${xOf(k).toFixed(1)},${yOf(cum[k]).toFixed(1)}`);
  }

  return (
    <CacheWidgetFrame
      title="Why a small cache serves most reads"
      hint="Model: 1,000,000 keys, 1 KB each"
      caption={
        <>
          Drag the cache size. With classic Zipf skew, a cache that holds 1% of the keys already answers about two thirds of all reads. The first
          10 keys alone take a large share. Real traffic differs, so measure yours. The shape is what matters: a few keys carry most of the load.
        </>
      }
    >
      <div className="mb-3">
        <Seg value={s} options={SKEWS} onChange={setS} label="Skew of the key popularity" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <svg viewBox="0 0 340 190" className="h-auto w-full" role="img" aria-label="Bar chart: share of requests for each of the 48 most popular keys">
          <text x={P.l} y={10} fontSize={11} fill="var(--muted)">
            requests per key (most popular 48 shown)
          </text>
          {bars.map((b, i) => {
            const bw = (W - P.l - P.r) / BARS;
            const h = b * (H - P.t - P.b - 18);
            const cached = i + 1 <= size;
            return (
              <rect
                key={i}
                x={P.l + i * bw + 1}
                y={H - P.b - h}
                width={bw - 2}
                height={h}
                rx={1.5}
                fill={cached ? 'var(--ok)' : 'var(--border)'}
              />
            );
          })}
          <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="var(--muted)" />
          <text x={P.l} y={H - P.b + 14} fontSize={10} fill="var(--muted)">
            key rank 1
          </text>
          <text x={W - P.r} y={H - P.b + 14} fontSize={10} fill="var(--muted)" textAnchor="end">
            48
          </text>
          <text x={(P.l + W - P.r) / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--muted)">
            green = in cache, grey = not cached
          </text>
        </svg>

        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Hit ratio versus cache size, log scale">
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={P.l} x2={W - P.r} y1={yOf(v)} y2={yOf(v)} stroke="var(--border)" />
              <text x={P.l - 5} y={yOf(v) + 4} textAnchor="end" fontSize={10} fill="var(--muted)">
                {v * 100}%
              </text>
            </g>
          ))}
          {[1, 2, 3, 4, 5, 6].map((e) => (
            <text key={e} x={xOf(Math.pow(10, e))} y={H - P.b + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">
              {e === 6 ? '1M' : e === 3 ? '1K' : `10^${e}`}
            </text>
          ))}
          <text x={(P.l + W - P.r) / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="var(--muted)">
            keys in cache (log scale)
          </text>
          <polyline points={curve.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2} />
          <line x1={xOf(size)} x2={xOf(size)} y1={P.t} y2={H - P.b} stroke="var(--muted)" strokeDasharray="3 3" />
          <circle cx={xOf(size)} cy={yOf(hit)} r={5} fill="var(--ok)" />
          <text x={P.l + 6} y={P.t + 8} textAnchor="start" fontSize={11} fill="var(--muted)">
            hit ratio
          </text>
        </svg>
      </div>

      <label className="mt-3 block text-sm">
        <span className="flex justify-between">
          <span>Cache size</span>
          <span className="font-mono tabular-nums">
            {fmt(size)} keys · {((size / N) * 100).toFixed(size / N < 0.001 ? 2 : 1)}% of data · {sizeLabel(size)}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={pos}
          onChange={(e) => setPos(+e.target.value)}
          aria-label="Cache size on a log scale"
          className="mt-1 w-full accent-[var(--accent)]"
        />
      </label>
      <div className="mt-2 grid grid-cols-3 gap-3 text-center">
        <Stat label="Hit ratio" value={pct(hit)} tone="ok" />
        <Stat label="Reads that reach the database" value={pct(1 - hit)} tone="bad" />
        <Stat label="RAM needed at 1 KB per key" value={sizeLabel(size)} />
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
