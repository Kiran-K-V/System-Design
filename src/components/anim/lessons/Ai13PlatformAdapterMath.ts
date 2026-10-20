/**
 * Adapter size and adapter-cache arithmetic for the multi-tenant LoRA drill in lesson A13.9. Pure functions.
 *
 * Sourced: Llama-3.1-8B shape from its config.json (hidden 4096, KV width 8 heads x 128 = 1024, MLP width 14336, 32 layers).
 * LoRA adds r x (d_in + d_out) numbers to one weight matrix. Stored at 2 bytes each (16-bit).
 * ILLUSTRATIVE: tenant count, traffic skew, load bandwidths, and the cache policy (a plain LRU).
 * Real servers also batch requests across adapters and page adapter memory. This model only asks one question:
 * how often is the adapter already on the GPU, and what does a miss cost.
 */

export const SHAPE = { hidden: 4096, kv: 1024, mlp: 14336, layers: 32 } as const;

export type Target = 'qkvo' | 'all';

/** Adapter numbers for one layer. q and o are 4096 x 4096. k and v are 4096 x 1024 (grouped-query attention). */
export function paramsPerLayer(r: number, target: Target): number {
  const { hidden: h, kv, mlp } = SHAPE;
  const attn = r * (h + h) * 2 + r * (h + kv) * 2;
  const mlpPart = target === 'all' ? 3 * r * (h + mlp) : 0;
  return attn + mlpPart;
}

export const adapterParams = (r: number, target: Target) => paramsPerLayer(r, target) * SHAPE.layers;
export const adapterBytes = (r: number, target: Target, bytesPerParam = 2) => adapterParams(r, target) * bytesPerParam;
export const MIB = 1024 * 1024;

/** Milliseconds to move `bytes` at `gbPerSec` (decimal GB per second). */
export const swapMs = (bytes: number, gbPerSec: number) => (bytes / (gbPerSec * 1e9)) * 1000;

export type Source = 'cpu' | 'nvme' | 'store';
export const SOURCES: { id: Source; label: string; gbps: number }[] = [
  { id: 'cpu', label: 'CPU memory', gbps: 20 },
  { id: 'nvme', label: 'Local disk', gbps: 3 },
  { id: 'store', label: 'Object store', gbps: 0.1 },
];

export const SLOT_STEPS = [4, 8, 16, 32, 64, 128, 256, 500] as const;
export const TENANTS = 500;

/** Small seeded generator, so the same inputs always give the same numbers. */
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

/** Cumulative Zipf weights for ranks 1..n. Exponent 0 is uniform. */
export function zipfCdf(n: number, s: number): number[] {
  const cdf: number[] = [];
  let sum = 0;
  for (let k = 1; k <= n; k++) {
    sum += 1 / Math.pow(k, s);
    cdf.push(sum);
  }
  return cdf.map((x) => x / sum);
}

/** Smallest index whose cdf value is at least u. */
function pick(cdf: number[], u: number): number {
  let lo = 0;
  let hi = cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] >= u) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export interface SimIn {
  slots: number;
  /** Zipf exponent of tenant traffic. 0 = every tenant equal. */
  skew: number;
  tenants?: number;
  requests?: number;
  warmup?: number;
  seed?: number;
}

/** Hit rate of an LRU cache of `slots` adapters under Zipf traffic. Counts only after the warm-up. */
export function hitRate({ slots, skew, tenants = TENANTS, requests = 30000, warmup = 5000, seed = 7 }: SimIn): number {
  const rnd = mulberry32(seed);
  const cdf = zipfCdf(tenants, skew);
  const lru = new Map<number, true>();
  let hits = 0;
  let counted = 0;
  for (let i = 0; i < requests; i++) {
    const id = pick(cdf, rnd());
    const hit = lru.has(id);
    if (hit) lru.delete(id);
    else if (lru.size >= slots) lru.delete(lru.keys().next().value as number);
    lru.set(id, true);
    if (i >= warmup) {
      counted++;
      if (hit) hits++;
    }
  }
  return hits / counted;
}

export interface Readout {
  bytes: number;
  swap: number;
  hit: number;
  /** Mean milliseconds a request waits for a swap-in. */
  meanMs: number;
  /** 95th percentile of that wait. It is 0 until misses exceed 5% of requests. */
  p95Ms: number;
  slotGiB: number;
}

export function readout(slots: number, skew: number, r: number, target: Target, gbps: number): Readout {
  const bytes = adapterBytes(r, target);
  const swap = swapMs(bytes, gbps);
  const hit = hitRate({ slots, skew });
  const miss = 1 - hit;
  return { bytes, swap, hit, meanMs: miss * swap, p95Ms: miss > 0.05 ? swap : 0, slotGiB: (slots * bytes) / 2 ** 30 };
}

/** Hit-rate curve over the slot steps. */
export const curve = (skew: number) => SLOT_STEPS.map((slots) => ({ slots, hit: hitRate({ slots, skew }) }));
