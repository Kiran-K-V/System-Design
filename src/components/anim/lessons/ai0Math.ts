/** Pure math for the A0 widgets. Prices: USD per 1M tokens, standard tier, as of 2026-10-15. */

export interface ApiModel {
  id: string;
  provider: string;
  name: string;
  input: number;
  output: number;
}

export const API_MODELS: ApiModel[] = [
  { id: 'opus55', provider: 'Anthropic', name: 'Opus 5.5', input: 4, output: 20 },
  { id: 'sonnet55', provider: 'Anthropic', name: 'Sonnet 5.5', input: 2, output: 10 },
  { id: 'haiku55', provider: 'Anthropic', name: 'Haiku 5.5', input: 0.1, output: 0.5 },
  { id: 'gpt6sol', provider: 'OpenAI', name: 'gpt-6-sol', input: 2, output: 10 },
  { id: 'gpt54mini', provider: 'OpenAI', name: 'gpt-5.4-mini', input: 0.75, output: 4.5 },
  { id: 'gpt6luna', provider: 'OpenAI', name: 'gpt-6-luna', input: 0.1, output: 0.5 },
  { id: 'gem25flash', provider: 'Google', name: 'Gemini 2.5 Flash', input: 0.3, output: 2.5 },
];

export const costPerRequest = (m: ApiModel, inTok: number, outTok: number) => (inTok * m.input + outTok * m.output) / 1e6;

/** Largest per-request cost the cap allows, and the daily cap it implies. */
export const dailyCap = (requestsPerDay: number, dollarsPerRequest: number) => requestsPerDay * dollarsPerRequest;

/** Chance a chain of n steps all succeed when each succeeds with probability p. */
export const chainSuccess = (p: number, n: number) => Math.pow(p, n);

/**
 * Per-step success when a verifier checks each answer and triggers up to `retries` retries.
 * Assumption: attempts are independent. The verifier catches a bad answer with probability `catchRate`.
 * A bad answer the verifier misses passes on and counts as a failure.
 */
export function stepWithVerifier(p: number, catchRate: number, retries: number): number {
  let s = p;
  for (let i = 0; i < retries; i++) s = p + (1 - p) * catchRate * s;
  return s;
}

/** Small seeded generator (mulberry32) so a simulation is repeatable. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Run `runs` chains. Returns counts[k] = runs that completed exactly k steps before the first failure (k = n means success). */
export function simulate(p: number, n: number, runs: number, seed: number): number[] {
  const r = rng(seed);
  const counts = new Array(n + 1).fill(0);
  for (let i = 0; i < runs; i++) {
    let k = 0;
    while (k < n && r() < p) k++;
    counts[k]++;
  }
  return counts;
}

export const GPU = { name: 'H100 SXM, per GPU-hour (Lambda on-demand)', perHour: 3.99, tokensPerSec: 4485 };
export const HOURS_PER_MONTH = 730;

export interface Crossover {
  apiMonthly: number;
  gpus: number;
  selfMonthly: number;
}

/** Output-token model. tokensPerDay are generated tokens. One GPU serves tokensPerSec * utilization. */
export function crossover(tokensPerDay: number, apiOutPrice: number, utilization: number, gpuHour: number, minGpus: number): Crossover {
  const perGpuDay = GPU.tokensPerSec * utilization * 86400;
  const gpus = Math.max(minGpus, Math.ceil(tokensPerDay / perGpuDay));
  return { apiMonthly: (tokensPerDay * 30 * apiOutPrice) / 1e6, gpus, selfMonthly: gpus * gpuHour * HOURS_PER_MONTH };
}

/** Smallest tokens/day on a log grid where the API costs more than self-hosting. null if none in range. */
export function breakEven(apiOutPrice: number, utilization: number, gpuHour: number, minGpus: number, lo = 1e6, hi = 1e11): number | null {
  for (let i = 0; i <= 400; i++) {
    const t = lo * Math.pow(hi / lo, i / 400);
    const c = crossover(t, apiOutPrice, utilization, gpuHour, minGpus);
    if (c.apiMonthly > c.selfMonthly) return t;
  }
  return null;
}
