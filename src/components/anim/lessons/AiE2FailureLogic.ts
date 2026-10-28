/**
 * Failure-rate model for lesson E2.6. Pure functions, no randomness at import time.
 *
 * SOURCED INPUT (Llama 3 paper, 54-day snapshot of 405B pre-training): 419 unexpected interruptions on up to 16,384 GPUs.
 * DERIVED (ours): per-GPU-hour rate = 419 / (16,384 x 54 x 24). It lumps every cause (GPU, host, network, software) into
 * a per-GPU figure, so it is a rate per GPU-share of the cluster, not the failure rate of one GPU chip.
 *
 * ILLUSTRATIVE ASSUMPTIONS:
 *  - Interruptions are independent and random with a constant average rate (a Poisson process).
 *  - The rate scales linearly with GPU count (every GPU brings its share of hosts, cables, software).
 *  - Each interruption costs: restart time + half a checkpoint interval of lost work (on average).
 *  - Effective share = 1 / (1 + interruptions per useful hour x hours lost per interruption). First-order.
 */
export const LLAMA_GPUS = 16384;
export const LLAMA_DAYS = 54;
export const LLAMA_UNEXPECTED = 419;
export const LLAMA_RATE = LLAMA_UNEXPECTED / (LLAMA_GPUS * LLAMA_DAYS * 24);

export const SIZES = [8, 64, 512, 1024, 4096, 16384, 65536, 131072];

export interface SimIn {
  gpus: number;
  /** Multiplier on the Llama 3 derived rate. 1 = same per-GPU rate. */
  rateMult: number;
  restartMin: number;
  ckptMin: number;
}

export function ratePerHour(i: SimIn): number {
  return i.gpus * LLAMA_RATE * i.rateMult;
}
export function perDay(i: SimIn): number {
  return ratePerHour(i) * 24;
}
export function mtbfHours(i: SimIn): number {
  return 1 / ratePerHour(i);
}
/** Chance that a run of `hours` hours sees no interruption. */
export function cleanRun(i: SimIn, hours: number): number {
  return Math.exp(-ratePerHour(i) * hours);
}
export function lostHoursPerInterruption(i: SimIn): number {
  return i.restartMin / 60 + i.ckptMin / 120;
}
export function effectiveShare(i: SimIn): number {
  return 1 / (1 + ratePerHour(i) * lostHoursPerInterruption(i));
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Interruption times (hours, 0 to 24) of one sample day. Same seed gives the same unit-rate stream, scaled by the rate. */
export function sampleDay(i: SimIn, seed = 11): number[] {
  const r = rng(seed);
  const lambda = ratePerHour(i);
  const out: number[] = [];
  let t = 0;
  for (let k = 0; k < 400; k++) {
    t += -Math.log(1 - r()) / lambda;
    if (t >= 24) break;
    out.push(t);
  }
  return out;
}
