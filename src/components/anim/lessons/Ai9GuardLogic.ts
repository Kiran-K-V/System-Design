/** Logic for lesson A9.4 (guardrails pipeline). Pure functions. Latencies and rates are illustrative unless the lesson says otherwise. */

export interface Check {
  id: string;
  label: string;
  /** Median latency in ms. */
  median: number;
  /** 95th percentile latency in ms. */
  p95: number;
}

/** The managed guard model median follows Cloudflare's "approximately 500 milliseconds per request". Every p95 and every other row is made up. */
export const CHECKS: Check[] = [
  { id: 'rules', label: 'Rules: schema, regex, allow list', median: 1, p95: 2 },
  { id: 'inject', label: 'Small injection classifier', median: 25, p95: 70 },
  { id: 'guard', label: 'Guard model (hosted, about 500 ms)', median: 500, p95: 900 },
  { id: 'judge', label: 'LLM judge (small model)', median: 400, p95: 1200 },
  { id: 'pii', label: 'PII detector', median: 15, p95: 40 },
];

/** Small seeded generator, so the same inputs always give the same output. */
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

function normal(rnd: () => number): number {
  const u = Math.max(rnd(), 1e-12);
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Z score of the 95th percentile. */
const Z95 = 1.6448536;

/** One latency draw from a lognormal curve fitted to the check's median and p95. */
export function drawLatency(c: Check, rnd: () => number): number {
  const sigma = Math.log(c.p95 / c.median) / Z95;
  return Math.exp(Math.log(c.median) + sigma * normal(rnd));
}

export function quantile(sorted: number[], q: number): number {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[i];
}

export interface LatencyResult {
  serialP50: number;
  serialP95: number;
  parallelP50: number;
  parallelP95: number;
  /** Plain sum of each check's own p95. An upper bound for a serial chain, not the real p95. */
  sumOfP95: number;
}

export function simulateLatency(checks: Check[], n = 20000, seed = 7): LatencyResult {
  if (checks.length === 0) return { serialP50: 0, serialP95: 0, parallelP50: 0, parallelP95: 0, sumOfP95: 0 };
  const rnd = mulberry32(seed);
  const serial: number[] = [];
  const parallel: number[] = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let max = 0;
    for (const c of checks) {
      const d = drawLatency(c, rnd);
      sum += d;
      if (d > max) max = d;
    }
    serial.push(sum);
    parallel.push(max);
  }
  serial.sort((a, b) => a - b);
  parallel.sort((a, b) => a - b);
  return {
    serialP50: quantile(serial, 0.5),
    serialP95: quantile(serial, 0.95),
    parallelP50: quantile(parallel, 0.5),
    parallelP95: quantile(parallel, 0.95),
    sumOfP95: checks.reduce((s, c) => s + c.p95, 0),
  };
}

/** Standard normal CDF (Abramowitz and Stegun 7.1.26 for erf). */
export function normCdf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

export interface Threshold {
  /** Share of harmful requests that the threshold blocks. */
  tpr: number;
  /** Share of harmless requests that the threshold blocks by mistake. */
  fpr: number;
  harmful: number;
  harmless: number;
  caught: number;
  falseBlocks: number;
  /** Share of all blocks that were mistakes. */
  wrongShare: number;
}

/** Harmless scores follow N(0,1). Harmful scores follow N(sep,1). The guard blocks any score at or above t. */
export function thresholdStats(sep: number, t: number, harmfulShare: number, requests: number): Threshold {
  const tpr = 1 - normCdf(t - sep);
  const fpr = 1 - normCdf(t);
  const harmful = requests * harmfulShare;
  const harmless = requests - harmful;
  const caught = harmful * tpr;
  const falseBlocks = harmless * fpr;
  const blocks = caught + falseBlocks;
  return { tpr, fpr, harmful, harmless, caught, falseBlocks, wrongShare: blocks === 0 ? 0 : falseBlocks / blocks };
}

export function pdf(x: number, mean: number): number {
  return Math.exp(-0.5 * (x - mean) ** 2) / Math.sqrt(2 * Math.PI);
}
