/**
 * Logic for lesson A12.5 (evals for generated media). Pure functions.
 * Bradley-Terry: P(m beats m') = e^xi_m / (e^xi_m + e^xi_m'), as written in the Chatbot Arena paper
 *   (https://arxiv.org/abs/2403.04132). Confidence-interval and sampling choices here are the textbook logistic ones, not the paper's.
 * All strengths, slices and agreement figures below are illustrative.
 */

/** Chance that a model with strength a beats one with strength b. */
export const winProb = (a: number, b: number) => 1 / (1 + Math.exp(b - a));

/** Small seeded generator so simulated votes are repeatable. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Vote {
  /** index of winner */
  w: number;
  /** index of loser */
  l: number;
}

/**
 * Fit Bradley-Terry strengths (log scale, mean 0) by the minorize-maximize update.
 * One pseudo-vote split half and half between every pair keeps strengths finite when a model has no losses yet.
 */
export function fitBT(n: number, votes: Vote[], iters = 300): number[] {
  const wins = Array.from({ length: n }, () => Array(n).fill(0));
  for (const v of votes) wins[v.w][v.l] += 1;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) wins[i][j] += 0.5;
  let p = Array(n).fill(1);
  for (let k = 0; k < iters; k++) {
    const next = p.map((_, i) => {
      let W = 0;
      let D = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        W += wins[i][j];
        D += (wins[i][j] + wins[j][i]) / (p[i] + p[j]);
      }
      return W / D;
    });
    const g = Math.exp(next.reduce((s, x) => s + Math.log(x), 0) / n);
    p = next.map((x) => x / g);
  }
  return p.map((x) => Math.log(x));
}

/** Standard error of the log-odds of a win rate p measured from n votes. */
export const seLogit = (n: number, p: number) => Math.sqrt(1 / (n * p * (1 - p)));

/** Votes on one pair so that a true win rate p is separated from 50% at 95% (z = 1.96). */
export function votesNeeded(p: number, z = 1.96): number {
  const gap = Math.log(p / (1 - p));
  return Math.ceil((z * z) / (gap * gap * p * (1 - p)));
}

/** One online Elo-style update on the log scale. k is the step size. Returns new [winner, loser]. */
export function onlineUpdate(a: number, b: number, k: number): [number, number] {
  const e = winProb(a, b);
  return [a + k * (1 - e), b - k * (1 - e)];
}

export interface Slice {
  name: string;
  /** share of traffic, 0 to 1 */
  share: number;
  /** percent of pairs where the scorer picks the same winner as the human majority. Illustrative. */
  agree: Record<'clip' | 'pref' | 'vlm', number>;
}

export const SLICES: Slice[] = [
  { name: 'Plain subject', share: 0.4, agree: { clip: 74, pref: 80, vlm: 82 } },
  { name: 'Counts and positions', share: 0.2, agree: { clip: 52, pref: 68, vlm: 78 } },
  { name: 'Text in the image', share: 0.15, agree: { clip: 50, pref: 55, vlm: 62 } },
  { name: 'Hands and faces', share: 0.25, agree: { clip: 55, pref: 72, vlm: 70 } },
];

/** Traffic-weighted agreement for one scorer, in percent. */
export function overallAgree(slices: Slice[], who: 'clip' | 'pref' | 'vlm'): number {
  return slices.reduce((s, x) => s + x.share * x.agree[who], 0);
}
