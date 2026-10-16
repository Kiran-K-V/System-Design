/**
 * Pure math for lesson A3.6.
 * Part 1: a token bucket per limit (RPM, ITPM, OTPM). Part 2: a retry-storm simulator against a token-bucket server.
 * Model assumptions are stated in the lesson. Randomness is seeded, so server and browser agree.
 */

export interface Bucket {
  capacity: number;
  /** Tokens added per second. A per-minute limit L refills at L / 60 per second. */
  refillPerSec: number;
}

/** Bucket for a limit given per minute. Anthropic documents a token bucket: capacity refills continuously up to the maximum. */
export const perMinute = (limit: number): Bucket => ({ capacity: limit, refillPerSec: limit / 60 });

export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * How many identical requests fit through three buckets that start full, at time 0 with no refill.
 * A request costs 1 request, `uncachedIn` input tokens that count toward ITPM, and `out` output tokens.
 * Returns the count and the limit that binds first.
 */
export function burstCapacity(
  limits: { rpm: number; itpm: number; otpm: number },
  uncachedIn: number,
  out: number,
): { n: number; binding: 'RPM' | 'ITPM' | 'OTPM' } {
  const byR = limits.rpm;
  const byI = uncachedIn > 0 ? Math.floor(limits.itpm / uncachedIn) : Infinity;
  const byO = out > 0 ? Math.floor(limits.otpm / out) : Infinity;
  const n = Math.min(byR, byI, byO);
  return { n, binding: n === byR ? 'RPM' : n === byI ? 'ITPM' : 'OTPM' };
}

/** Sustained requests per minute through the three limits. Same as the burst capacity, since each bucket refills one full capacity per minute. */
export const sustainedPerMinute = burstCapacity;

/** Input tokens per minute you can process when `hit` of the input is cache reads that do not count toward ITPM. */
export const effectiveInputPerMinute = (itpm: number, hit: number) => itpm / (1 - hit);

/** Worst-case attempts per user request when every layer makes `attempts[i]` tries and every try fails. */
export const amplification = (attempts: number[]) => attempts.reduce((a, b) => a * b, 1);

export type Policy = 'sync' | 'expo' | 'jitter' | 'after' | 'afterJ';

export const POLICIES: { id: Policy; label: string }[] = [
  { id: 'sync', label: 'Fixed 1 s, no jitter' },
  { id: 'expo', label: 'Backoff, no jitter' },
  { id: 'jitter', label: 'Backoff, full jitter' },
  { id: 'after', label: 'retry-after only' },
  { id: 'afterJ', label: 'retry-after + jitter' },
];

export interface StormParams {
  clients: number;
  /** Server refill rate, requests per second. Burst capacity equals this value. */
  refillPerSec: number;
  /** Retries allowed after the first try. The Anthropic SDK default is 2. */
  maxRetries: number;
  baseSec: number;
  capSec: number;
  /** When true the server answers every call with a spend-cap 429 and no retry-after header. */
  spendCap: boolean;
  /** When true the client stops at once on a spend-cap 429. */
  stopOnSpendCap: boolean;
  seed: number;
}

export interface StormResult {
  /** Attempts that reach the server in each second, index = second. */
  perSec: number[];
  attempts: number;
  served: number;
  gaveUp: number;
  /** Attempts that got a 429. */
  rejected: number;
  peakPerSec: number;
  /** Second in which the last client was served, or null when nobody was served. */
  doneSec: number | null;
}

const SLOT = 0.1;
const HORIZON = 120;

export function simulateStorm(policy: Policy, p: StormParams): StormResult {
  const rand = prng(p.seed);
  const slots = Math.round(HORIZON / SLOT);
  const cap = p.refillPerSec;
  let tokens = cap;
  const next = new Array<number>(p.clients).fill(0);
  const tries = new Array<number>(p.clients).fill(0);
  const alive = new Array<boolean>(p.clients).fill(true);
  const perSec = new Array<number>(HORIZON).fill(0);
  let attempts = 0;
  let served = 0;
  let gaveUp = 0;
  let rejected = 0;
  let doneSlot = -1;
  let left = p.clients;

  for (let s = 0; s < slots && left > 0; s++) {
    tokens = Math.min(cap, tokens + p.refillPerSec * SLOT);
    const order: number[] = [];
    for (let i = 0; i < p.clients; i++) if (alive[i] && next[i] === s) order.push(i);
    for (let j = order.length - 1; j > 0; j--) {
      const k = Math.floor(rand() * (j + 1));
      [order[j], order[k]] = [order[k], order[j]];
    }
    for (const i of order) {
      attempts++;
      perSec[Math.min(HORIZON - 1, Math.floor((s * SLOT) / 1))]++;
      tries[i]++;
      const ok = !p.spendCap && tokens >= 1;
      if (ok) {
        tokens -= 1;
        alive[i] = false;
        served++;
        left--;
        doneSlot = s;
        continue;
      }
      rejected++;
      const retriesDone = tries[i] - 1;
      if ((p.spendCap && p.stopOnSpendCap) || retriesDone >= p.maxRetries) {
        alive[i] = false;
        gaveUp++;
        left--;
        continue;
      }
      const expo = Math.min(p.capSec, p.baseSec * 2 ** retriesDone);
      let wait: number;
      switch (policy) {
        case 'sync':
          wait = 1;
          break;
        case 'expo':
          wait = expo;
          break;
        case 'jitter':
          wait = rand() * expo;
          break;
        case 'after':
        case 'afterJ': {
          const header = p.spendCap ? expo : Math.max(1, Math.ceil((1 - tokens) / p.refillPerSec));
          wait = policy === 'after' ? header : header + rand() * 2;
          break;
        }
      }
      next[i] = s + Math.max(1, Math.round(wait / SLOT));
    }
  }
  const used = perSec.length;
  let last = used;
  while (last > 1 && perSec[last - 1] === 0) last--;
  return {
    perSec: perSec.slice(0, last),
    attempts,
    served,
    gaveUp,
    rejected,
    peakPerSec: Math.max(...perSec),
    doneSec: doneSlot >= 0 ? Math.round(doneSlot * SLOT * 10) / 10 : null,
  };
}
