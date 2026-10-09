/** Pure model for the TTL jitter lab. All keys are cached at t = 0 and expire once each. */

/** Small deterministic PRNG (mulberry32) so the chart is the same on server and client. */
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
 * counts[s] = number of keys whose expiry falls in second s.
 * Key TTL = baseTtl * (1 + jitter * u), u uniform in [0, 1). Jitter only adds time, so no key lives shorter than baseTtl.
 */
export function expiryCounts(keys: number, baseTtl: number, jitter: number, seed = 7): number[] {
  const len = Math.ceil(baseTtl * (1 + jitter)) + 1;
  const counts = new Array<number>(len).fill(0);
  const rand = prng(seed);
  for (let i = 0; i < keys; i++) {
    const ttl = baseTtl * (1 + jitter * rand());
    counts[Math.min(len - 1, Math.floor(ttl))]++;
  }
  return counts;
}

/** Evenly spread rebuild rate (keys per second) if the window were perfectly flat. */
export function flatRate(keys: number, baseTtl: number, jitter: number): number {
  const window = Math.max(1, baseTtl * jitter);
  return keys / window;
}
