import { useMemo, useState } from 'react';
import CacheWidgetFrame, { Seg } from './CacheWidgetFrame';
import { hash32 } from '../ringMath';

const SHARDS = 4;
const USERS = 10_000;
const REQUESTS = 4_000;
const CELEB = 4_242;

type Pattern = 'uniform' | 'newest' | 'celebrity';
type Strategy = 'range' | 'hash' | 'directory';

/** Small deterministic generator, so every render and every server run gives the same traffic. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function traffic(pattern: Pattern): number[] {
  const rnd = lcg(pattern === 'uniform' ? 11 : pattern === 'newest' ? 22 : 33);
  return Array.from({ length: REQUESTS }, () => {
    if (pattern === 'uniform') return 1 + Math.floor(rnd() * USERS);
    if (pattern === 'newest') return 9_001 + Math.floor(rnd() * 1_000);
    return rnd() < 0.35 ? CELEB : 1 + Math.floor(rnd() * USERS);
  });
}

const TRAFFIC: Record<Pattern, number[]> = { uniform: traffic('uniform'), newest: traffic('newest'), celebrity: traffic('celebrity') };

const rangeShard = (k: number) => Math.floor(((k - 1) / USERS) * SHARDS);
const hashShard = (k: number) => hash32(`user:${k}`) % SHARDS;

/** Directory: the busiest keys are placed one by one on the least loaded shard. Other keys fall back to hash. */
function buildDirectory(reqs: number[]): Map<number, number> {
  const count = new Map<number, number>();
  for (const k of reqs) count.set(k, (count.get(k) ?? 0) + 1);
  const keys = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const load = new Array(SHARDS).fill(0);
  const dir = new Map<number, number>();
  for (const [k, c] of keys) {
    const target = load.indexOf(Math.min(...load));
    dir.set(k, target);
    load[target] += c;
  }
  return dir;
}

const DIRS: Record<Pattern, Map<number, number>> = {
  uniform: buildDirectory(TRAFFIC.uniform),
  newest: buildDirectory(TRAFFIC.newest),
  celebrity: buildDirectory(TRAFFIC.celebrity),
};

const SCAN_FROM = 4_001;
const SCAN_TO = 4_300;

export default function ShardKeyLab() {
  const [pattern, setPattern] = useState<Pattern>('uniform');
  const [strategy, setStrategy] = useState<Strategy>('range');

  const result = useMemo(() => {
    const place = (k: number) => (strategy === 'range' ? rangeShard(k) : strategy === 'hash' ? hashShard(k) : (DIRS[pattern].get(k) ?? hashShard(k)));
    const load = new Array(SHARDS).fill(0);
    for (const k of TRAFFIC[pattern]) load[place(k)]++;
    const touched = new Set<number>();
    for (let k = SCAN_FROM; k <= SCAN_TO; k++) touched.add(place(k));
    return { load, touched: touched.size };
  }, [pattern, strategy]);

  const busiest = Math.max(...result.load);
  const share = (n: number) => (n / REQUESTS) * 100;
  const verdict = share(busiest) > 40 ? 'text-bad' : share(busiest) > 30 ? 'text-warn' : 'text-ok';

  return (
    <CacheWidgetFrame title="Shard key lab" hint="4 shards, 4,000 requests">
      <div className="grid gap-4 text-sm md:grid-cols-[14rem_1fr]">
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-xs text-muted">Traffic</div>
            <Seg
              label="Traffic pattern"
              value={pattern}
              onChange={setPattern}
              options={[
                { id: 'uniform', label: 'Random users' },
                { id: 'newest', label: 'Newest ids' },
                { id: 'celebrity', label: 'One celebrity' },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Strategy</div>
            <Seg
              label="Sharding strategy"
              value={strategy}
              onChange={setStrategy}
              options={[
                { id: 'range', label: 'Range' },
                { id: 'hash', label: 'Hash' },
                { id: 'directory', label: 'Directory' },
              ]}
            />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {pattern === 'uniform' && 'Every one of 10,000 users is equally likely.'}
            {pattern === 'newest' && 'All requests hit the newest 1,000 ids (9,001 to 10,000). Think: today’s signups, or recent messages.'}
            {pattern === 'celebrity' && 'User 4,242 gets 35% of all requests. The rest is random.'}
          </p>
        </div>

        <div>
          <div className="mb-1 text-xs text-muted">Share of requests per shard (even share = 25%)</div>
          <ul className="space-y-2">
            {result.load.map((n, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-14 text-xs text-muted">Shard {i + 1}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded bg-surface">
                  <div
                    className="h-full transition-[width] duration-300"
                    style={{ width: `${share(n)}%`, background: share(n) > 40 ? 'var(--bad)' : share(n) > 30 ? 'var(--warn)' : 'var(--ok)', opacity: 0.8 }}
                  />
                  <div className="absolute inset-y-0 w-px bg-fg/40" style={{ left: '25%' }} />
                </div>
                <span className="w-24 text-right tabular-nums">
                  {share(n).toFixed(1)}% <span className="text-xs text-muted">({n})</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Busiest shard</div>
              <div className={`text-lg font-semibold tabular-nums ${verdict}`}>{share(busiest).toFixed(1)}%</div>
              <div className="text-xs text-muted">of traffic ({(busiest / (REQUESTS / SHARDS)).toFixed(1)}× its fair share)</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-2.5">
              <div className="text-xs text-muted">Scan of ids {SCAN_FROM.toLocaleString('en-US')}–{SCAN_TO.toLocaleString('en-US')}</div>
              <div className="text-lg font-semibold tabular-nums">
                {result.touched} of {SHARDS} shards
              </div>
              <div className="text-xs text-muted">{result.touched === 1 ? 'one shard answers' : 'the query fans out'}</div>
            </div>
          </div>
        </div>
      </div>
    </CacheWidgetFrame>
  );
}
