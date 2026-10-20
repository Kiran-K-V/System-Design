/**
 * Tail-latency model for parallel fetches (lesson A13.7). Pure functions, no imports.
 *
 * The probabilities (1 - 0.95^n) need no assumption except independence. The millisecond values assume one fetch
 * is lognormal with the chosen median and p95. That shape is ILLUSTRATIVE, not measured.
 */

/** Chance that at least one of n independent fetches is slower than its own p-quantile (p = 0.95 for "slower than p95"). */
export function pAtLeastOneOver(n: number, p = 0.95): number {
  return 1 - Math.pow(p, n);
}

function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
export const normCdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

export function normInv(p: number): number {
  let lo = -8;
  let hi = 8;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (normCdf(mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const Z95 = 1.6448536269514722;

export interface Fetch {
  median: number;
  p95: number;
}

const sigma = (f: Fetch) => Math.log(f.p95 / f.median) / Z95;
/** CDF of one fetch time t. */
export const fetchCdf = (f: Fetch, t: number) => (t <= 0 ? 0 : normCdf(Math.log(t / f.median) / sigma(f)));
/** Quantile of one fetch time. */
export const fetchQuantile = (f: Fetch, q: number) => f.median * Math.exp(sigma(f) * normInv(q));

/** Quantile q of the stage time (slowest of n fetches, waiting for all). F^n = q, so one fetch is at q^(1/n). */
export function stageQuantile(f: Fetch, n: number, q: number): number {
  return fetchQuantile(f, Math.pow(q, 1 / n));
}

/** The single-fetch percentile that the stage quantile q lands on. */
export const singleLevel = (n: number, q: number) => Math.pow(q, 1 / n);

/** CDF of a fetch that is re-sent at time d if still open (first reply wins). Both copies share the same distribution. */
export function hedgedCdf(f: Fetch, d: number, t: number): number {
  if (t <= d) return fetchCdf(f, t);
  const s0 = 1 - fetchCdf(f, t);
  const s1 = 1 - fetchCdf(f, t - d);
  return 1 - s0 * s1;
}

/** Quantile q of the stage time with hedging at d, by bisection. */
export function hedgedStageQuantile(f: Fetch, n: number, d: number, q: number): number {
  let lo = 0;
  let hi = f.p95 * 20;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (Math.pow(hedgedCdf(f, d, mid), n) < q) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Chance that the stage takes longer than t when each fetch is hedged at d. */
export function hedgedStageOver(f: Fetch, n: number, d: number, t: number): number {
  return 1 - Math.pow(hedgedCdf(f, d, t), n);
}
