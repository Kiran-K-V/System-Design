/**
 * Logic for lesson A15.4 (debugging model behavior). Pure functions. Every number in the demo is illustrative.
 * Model: one position in an answer where the top two tokens, A and B, are close.
 * `gap` is logit(A) - logit(B). At temperature 1 the sampler picks B with probability 1 / (1 + e^gap).
 * At temperature 0 the server picks A unless run-to-run numeric noise, shaped here as uniform in [-eps, +eps]
 * on the gap, pushes the gap below zero. Real noise sizes depend on hardware and batch shape.
 */

/** Probability that the sampler picks the runner-up B at temperature 1. */
export function probB(gap: number): number {
  return 1 / (1 + Math.exp(gap));
}

/** Probability that noise flips the temperature-0 winner at one position (gap >= 0, eps > 0). */
export function flipProb(gap: number, eps: number): number {
  if (gap >= eps) return 0;
  if (gap <= -eps) return 1;
  return (eps - gap) / (2 * eps);
}

/** Probability that at least one of k identical positions flips, so the whole answer differs from the clean run. */
export function anyDiffProb(p: number, k: number): number {
  return 1 - Math.pow(1 - p, k);
}

/** Small seeded generator, so a button press gives a repeatable result. */
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

/** Run the model `runs` times. Entry i is true when run i differs from the noise-free answer. */
export function simulate(gap: number, eps: number, k: number, runs: number, seed: number): boolean[] {
  const rnd = mulberry32(seed);
  const out: boolean[] = [];
  for (let i = 0; i < runs; i++) {
    let differs = false;
    for (let j = 0; j < k; j++) {
      const noise = (rnd() * 2 - 1) * eps;
      if (gap + noise < 0) differs = true;
    }
    out.push(differs);
  }
  return out;
}

/** Natural log of a probability, for showing a logprob next to a percent. */
export function logprob(p: number): number {
  return Math.log(p);
}
