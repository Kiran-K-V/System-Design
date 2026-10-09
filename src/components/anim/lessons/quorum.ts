/** Quorum arithmetic for N replicas, write quorum W, read quorum R. */

/** Smallest group that is more than half of N. */
export const majority = (n: number): number => Math.floor(n / 2) + 1;

/** How many nodes can fail while a majority is still alive. */
export const majorityTolerance = (n: number): number => n - majority(n);

export interface QuorumReport {
  /** Any read set shares at least one node with any write set. */
  overlap: boolean;
  /** Fewest nodes shared by a write set and a read set. Zero or less means they can miss each other. */
  minShared: number;
  /** Two write sets can never be disjoint. Needed so two partitions cannot both accept writes. */
  writesIntersect: boolean;
  writeTolerates: number;
  readTolerates: number;
  /** Time for the W-th fastest ack, given sorted round trips. */
  writeMs: number;
  readMs: number;
}

/** `rtts` are per-node round-trip times in any order. Latency is the W-th (R-th) smallest. */
export function report(n: number, w: number, r: number, rtts: number[]): QuorumReport {
  const sorted = [...rtts.slice(0, n)].sort((a, b) => a - b);
  return {
    overlap: w + r > n,
    minShared: w + r - n,
    writesIntersect: 2 * w > n,
    writeTolerates: n - w,
    readTolerates: n - r,
    writeMs: sorted[w - 1],
    readMs: sorted[r - 1],
  };
}
