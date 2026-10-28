/** Logic for lesson A15.2 (prompt optimization). Pure functions. Numbers in the demos are illustrative. */

export const CASES = ['billing', 'refund', 'outage', 'login', 'privacy', 'language'];

/** Pass (1) or fail (0) of four candidate prompts on six dev cases. Made-up numbers. */
export const CANDIDATES: { id: string; note: string; scores: number[] }[] = [
  { id: 'P0', note: 'seed prompt', scores: [1, 1, 0, 0, 0, 0] },
  { id: 'P1', note: 'read whole ticket', scores: [1, 1, 1, 1, 0, 0] },
  { id: 'P2', note: 'flag personal data', scores: [1, 0, 1, 0, 1, 0] },
  { id: 'P3', note: 'match ticket language', scores: [0, 1, 0, 1, 0, 1] },
];

export const average = (s: number[]): number => s.reduce((a, b) => a + b, 0) / s.length;

/** Index of the candidate with the best average. The first one wins a tie. */
export function bestAverage(scores: number[][]): number {
  let best = 0;
  for (let k = 1; k < scores.length; k++) if (average(scores[k]) > average(scores[best])) best = k;
  return best;
}

/** True when candidate j is at least as good as k on every case and better on one. */
export function dominates(j: number[], k: number[]): boolean {
  let better = false;
  for (let i = 0; i < j.length; i++) {
    if (j[i] < k[i]) return false;
    if (j[i] > k[i]) better = true;
  }
  return better;
}

/** For each case, the candidates that score the highest on it. */
export function leadersPerCase(scores: number[][]): number[][] {
  const n = scores[0].length;
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const top = Math.max(...scores.map((s) => s[i]));
    out.push(scores.map((s, k) => (s[i] === top ? k : -1)).filter((k) => k >= 0));
  }
  return out;
}

/**
 * Pareto set in the style of the GEPA paper (Algorithm 2), simplified:
 * keep every candidate that leads on at least one case, drop any candidate
 * that another candidate dominates, then weight each by the number of cases it still leads.
 */
export function paretoSet(scores: number[][]): { kept: number[]; weight: number[]; prob: number[] } {
  const leaders = leadersPerCase(scores);
  const inUnion = new Set(leaders.flat());
  const dominated = new Set<number>();
  for (const k of inUnion) for (const j of inUnion) if (j !== k && dominates(scores[j], scores[k])) dominated.add(k);
  const weight = scores.map(() => 0);
  for (const l of leaders) for (const k of l) if (!dominated.has(k)) weight[k] += 1;
  const total = weight.reduce((a, b) => a + b, 0);
  const kept = weight.map((w, k) => (w > 0 ? k : -1)).filter((k) => k >= 0);
  return { kept, weight, prob: weight.map((w) => (total ? w / total : 0)) };
}

/** Illustrative rounds of a search: best tune score so far, and the held-out score of that prompt. */
export const ROUNDS = [62, 66, 71, 73, 75, 76];
export const HELD_OUT = 68;
/** Held-out score of the seed prompt, measured once on the same untouched cases. */
export const SEED_HELD_OUT = 61;
