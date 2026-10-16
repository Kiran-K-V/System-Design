/** Logic for the reliability simulator in lesson A6.1. Pure functions, no React. */

/** Chance that all n steps of a run succeed, each with independent success p: p^n. */
export function chain(p: number, n: number): number {
  return Math.pow(p, n);
}

/**
 * The task population is split in two halves: easy tasks at p + d and hard tasks at p - d.
 * The mean per-task success stays p. d = 0 means every task has the same success p.
 * The spread is clamped so both halves stay inside [0, 1].
 */
export function taskRates(p: number, spread: number): [number, number] {
  const d = Math.min(spread, p, 1 - p);
  return [p + d, p - d];
}

/** pass^k: chance that all k trials of a task succeed, averaged over tasks. For a task with rate r it is r^k. */
export function passHat(p: number, spread: number, k: number): number {
  const [hi, lo] = taskRates(p, spread);
  return (Math.pow(hi, k) + Math.pow(lo, k)) / 2;
}

/** pass@k: chance that at least one of k trials succeeds, averaged over tasks. */
export function passAt(p: number, spread: number, k: number): number {
  const [hi, lo] = taskRates(p, spread);
  return (1 - Math.pow(1 - hi, k) + 1 - Math.pow(1 - lo, k)) / 2;
}

/** Input tokens summed over a run. Call i (1-based) sends start + (i - 1) * growth tokens. */
export function inputTokens(start: number, growth: number, calls: number): number {
  return calls * start + growth * ((calls * (calls - 1)) / 2);
}
