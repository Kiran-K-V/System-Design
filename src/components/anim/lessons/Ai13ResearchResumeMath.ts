/**
 * Expected cost of a failed run under three checkpoint granularities (lesson A13.7). Pure functions, no imports.
 *
 * Model (ILLUSTRATIVE, not measured): a run is N steps (model calls). Each step fails independently with chance q
 * (a crash, a timeout, a 429 that exhausts retries). A failed step loses all progress since the last checkpoint.
 * Progress is redone from that checkpoint. A "chunk" is the number of steps between checkpoints.
 * Every step that runs is billed, including steps that are later redone.
 */

/** Expected billed steps to finish N steps when a failure sends you back to the start of a chunk of m steps. */
export function expectedSteps(N: number, m: number, q: number): number {
  if (q <= 0) return N;
  const p = 1 - q;
  const perChunk = (Math.pow(p, -m) - 1) / q;
  return (N / m) * perChunk;
}

/** Billed steps divided by useful steps. 1 means no waste. */
export function multiplier(N: number, m: number, q: number): number {
  return expectedSteps(N, m, q) / N;
}

/** Chance that a run of N steps sees at least one failure. */
export function pAnyFailure(N: number, q: number): number {
  return 1 - Math.pow(1 - q, N);
}
