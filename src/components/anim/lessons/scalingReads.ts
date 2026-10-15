/**
 * Read-scaling capacity model. Pure functions, no randomness.
 *
 * Model: each request passes through tiers from the edge inward. A tier absorbs some share of the requests that reach it.
 * The share that reaches a tier is the product of (1 - hit) over every tier in front of it.
 * A tier with capacity C saturates when demand * reach > C, so the whole system tops out at min over tiers of C / reach.
 *
 * Assumptions (all illustrative, all adjustable in the widget):
 * - Reads only. Writes stay on the primary and are not modeled here.
 * - Every tier is the same load per request (one read = one unit).
 * - Hits are independent of load. Real hit ratios change with key skew and cache size (lesson 5.1, 5.4).
 * - The CDN has no capacity limit. Real CDNs are large but not infinite.
 * - Replicas are perfect copies and share load evenly. Lag is ignored here (see the read-your-writes section).
 */

export type Stage = 'one-db' | 'replicas' | 'cache' | 'cdn';
export const STAGES: Stage[] = ['one-db', 'replicas', 'cache', 'cdn'];

export interface Params {
  /** Reads per second one database node serves. */
  dbNodeQps: number;
  /** Number of read replicas. The primary is kept for writes. With zero replicas the primary serves reads. */
  replicas: number;
  /** Reads per second one cache node serves. */
  cacheNodeQps: number;
  cacheNodes: number;
  /** Share of reads that the cache answers. */
  cacheHit: number;
  /** Share of all reads that the CDN answers at the edge (public, cacheable content). */
  cdnHit: number;
}

export interface Tier {
  name: 'CDN' | 'Cache' | 'Database';
  /** Capacity in reads per second. Infinity for the CDN. */
  capacity: number;
  /** Share of incoming demand that reaches this tier. */
  reach: number;
}

/** Tiers present at a stage, outermost first. */
export function tiersAt(stage: Stage, p: Params): Tier[] {
  const dbNodes = stage === 'one-db' ? 1 : Math.max(1, p.replicas);
  const db = { name: 'Database' as const, capacity: dbNodes * p.dbNodeQps };
  if (stage === 'one-db' || stage === 'replicas') return [{ ...db, reach: 1 }];
  const cache = { name: 'Cache' as const, capacity: p.cacheNodes * p.cacheNodeQps };
  if (stage === 'cache') return [{ ...cache, reach: 1 }, { ...db, reach: 1 - p.cacheHit }];
  const cdn = { name: 'CDN' as const, capacity: Infinity, reach: 1 };
  const afterCdn = 1 - p.cdnHit;
  return [cdn, { ...cache, reach: afterCdn }, { ...db, reach: afterCdn * (1 - p.cacheHit) }];
}

/** Highest demand the stage serves before some tier saturates, and which tier saturates first. */
export function maxQps(stage: Stage, p: Params): { qps: number; bottleneck: Tier['name'] } {
  let best = { qps: Infinity, bottleneck: 'Database' as Tier['name'] };
  for (const t of tiersAt(stage, p)) {
    const limit = t.reach > 0 ? t.capacity / t.reach : Infinity;
    if (limit < best.qps) best = { qps: limit, bottleneck: t.name };
  }
  return best;
}

export interface TierLoad extends Tier {
  load: number;
  /** load / capacity. Above 1 means the tier is overloaded. */
  utilization: number;
}

/** Load on every tier when `demand` reads per second arrive. */
export function loadAt(stage: Stage, p: Params, demand: number): TierLoad[] {
  return tiersAt(stage, p).map((t) => {
    const load = demand * t.reach;
    return { ...t, load, utilization: Number.isFinite(t.capacity) ? load / t.capacity : 0 };
  });
}

export const DEFAULTS: Params = {
  dbNodeQps: 10_000,
  replicas: 3,
  cacheNodeQps: 100_000,
  cacheNodes: 2,
  cacheHit: 0.9,
  cdnHit: 0.5,
};
