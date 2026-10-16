/** Logic for the A8.5 pass^k widget. Pure functions. */

export interface TaskGroup {
  /** Share of tasks in this group (0..1). */
  share: number;
  /** Chance one trial of a task in this group passes. */
  p: number;
}

export const meanPass = (groups: TaskGroup[]) => groups.reduce((s, g) => s + g.share * g.p, 0);

/** Chance that at least one of k trials passes, averaged over tasks. */
export const passAtK = (groups: TaskGroup[], k: number) => groups.reduce((s, g) => s + g.share * (1 - (1 - g.p) ** k), 0);

/** Chance that all k trials pass, averaged over tasks. */
export const passHatK = (groups: TaskGroup[], k: number) => groups.reduce((s, g) => s + g.share * g.p ** k, 0);

const choose = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
};

/** tau-bench unbiased estimator for one task: n trials, c passes. Average it over tasks. */
export const passHatEstimate = (n: number, c: number, k: number) => choose(c, k) / choose(n, k);

/** Same uniform pass rate for every task. */
export const UNIFORM: TaskGroup[] = [{ share: 1, p: 0.612 }];

/** Illustrative spread with the same mean (0.612). Some tasks always pass, some are flaky, some never pass. */
export const SPREAD: TaskGroup[] = [
  { share: 0.5, p: 0.9 },
  { share: 0.3, p: 0.54 },
  { share: 0.2, p: 0 },
];

export const runCost = (tasks: number, k: number, dollarsPerRun: number) => tasks * k * dollarsPerRun;
