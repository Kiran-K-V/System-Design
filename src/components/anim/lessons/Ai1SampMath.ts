/** Sampling math for lesson A1.5. Pure functions, no React. */

export interface Tok {
  t: string;
  /** Raw score (logit) from the model. Illustrative values. */
  x: number;
}

/** Illustrative next-token scores after "The capital of France is". Not from a real model. */
export const TOKENS: Tok[] = [
  { t: ' Paris', x: 5.0 },
  { t: ' the', x: 2.8 },
  { t: ' a', x: 2.2 },
  { t: ' located', x: 1.9 },
  { t: ' known', x: 1.5 },
  { t: ' Lyon', x: 1.2 },
  { t: ' not', x: 0.8 },
  { t: ' one', x: 0.5 },
  { t: ' Marseille', x: 0.1 },
  { t: ' also', x: -0.3 },
];

export function softmax(xs: number[], temperature = 1): number[] {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp((x - m) / temperature));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export interface Dist {
  /** Probability after temperature only. */
  base: number[];
  /** True when the token survives top-k and top-p. */
  kept: boolean[];
  /** Final probability to sample from. Zero for cut tokens. Sums to 1. */
  final: number[];
  /** Probability mass kept by the top-k and top-p cuts before renormalizing. */
  keptMass: number;
}

/**
 * Order of operations: temperature, then top-k, then renormalize, then top-p on the renormalized
 * probabilities, then renormalize again. Temperature 0 means greedy: all mass on the top token.
 * k >= n or k <= 0 means off. p >= 1 means off.
 */
export function shape(xs: number[], temperature: number, k: number, p: number): Dist {
  const n = xs.length;
  const order = xs.map((_, i) => i).sort((a, b) => xs[b] - xs[a] || a - b);
  if (temperature <= 0) {
    const final = xs.map((_, i) => (i === order[0] ? 1 : 0));
    return { base: final.slice(), kept: final.map((v) => v === 1), final, keptMass: 1 };
  }
  const base = softmax(xs, temperature);
  let keep = order.slice();
  if (k > 0 && k < n) keep = keep.slice(0, k);
  const kMass = keep.reduce((a, i) => a + base[i], 0);
  if (p < 1) {
    let cum = 0;
    const out: number[] = [];
    for (const i of keep) {
      out.push(i);
      cum += base[i] / kMass;
      if (cum >= p - 1e-12) break;
    }
    keep = out;
  }
  const mass = keep.reduce((a, i) => a + base[i], 0);
  const kept = xs.map((_, i) => keep.includes(i));
  const final = base.map((v, i) => (kept[i] ? v / mass : 0));
  return { base, kept, final, keptMass: mass };
}

/** Small seeded generator, so a "draw 1,000" button gives the same counts each time. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inverse-CDF draw: u in [0,1) picks the token whose cumulative range holds u. */
export function draw(final: number[], u: number): number {
  let c = 0;
  for (let i = 0; i < final.length; i++) {
    c += final[i];
    if (u < c) return i;
  }
  return final.length - 1;
}
