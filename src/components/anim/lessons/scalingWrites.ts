/**
 * Write-scaling capacity model. Pure functions.
 *
 * Batching: one commit costs a fixed `commitMs` (the flush to disk) plus `rowMs` per row.
 * Writing b rows in one commit costs commitMs + b * rowMs, so one writer thread does b / (commitMs + b * rowMs) rows per ms.
 * The ceiling as b grows is 1 / rowMs. Gains shrink once the fixed part is small next to the per-row part.
 *
 * Sharding: N shards, each with `shardQps` capacity. The hottest shard sets the limit.
 * One hot key takes share p of all writes. Its shard also gets its fair share of the other writes.
 * With k salts the hot key is spread over min(k, N) shards, assumed distinct.
 *
 * Assumptions: illustrative costs, not measurements. Keys other than the hot one spread evenly.
 * Shards are equal. No cross-shard transactions. Queue and network costs are ignored.
 */

export const COMMIT_MS = 0.08;
export const ROW_MS = 0.02;

/** Rows per second one writer sustains when it commits `batch` rows at a time. */
export function batchedQps(batch: number, commitMs = COMMIT_MS, rowMs = ROW_MS): number {
  return (1000 * batch) / (commitMs + batch * rowMs);
}

/** Share of all writes that lands on the busiest shard. */
export function hottestShare(shards: number, hotShare: number, salts: number): number {
  const spread = Math.max(1, Math.min(salts, shards));
  return hotShare / spread + (1 - hotShare) / shards;
}

/** Highest total write rate the cluster serves before the busiest shard saturates. */
export function clusterMaxQps(shards: number, shardQps: number, hotShare: number, salts: number): number {
  return shardQps / hottestShare(shards, hotShare, salts);
}

/** Per-shard share of traffic, hottest first (hot key shard, then the others). Sums to 1. */
export function shardShares(shards: number, hotShare: number, salts: number): number[] {
  const spread = Math.max(1, Math.min(salts, shards));
  const shares = Array.from({ length: shards }, (_, i) => (1 - hotShare) / shards + (i < spread ? hotShare / spread : 0));
  return shares;
}

/**
 * A burst of `arrival` writes per second lasts `seconds`. A queue feeds a store that drains `drain` per second.
 * Returns the backlog at the end of the burst and how long the store needs to clear it while `base` writes per second keep arriving.
 */
export function burstBacklog(arrival: number, drain: number, seconds: number, base: number) {
  const backlog = Math.max(0, (arrival - drain) * seconds);
  const spare = drain - base;
  return { backlog, clearSeconds: backlog === 0 ? 0 : spare > 0 ? backlog / spare : Infinity };
}
