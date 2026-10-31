/** Logic for E3.6. Illustrative models. Not measurements. */

export const WEIGHT_BYTES = 140e9; // Llama 3 70B in BF16 (the GPU Memory Math lesson)
export const HBM_BYTES_PER_S = 3.35e12; // one H100 (the GPU Memory Math lesson)
export const LAYERS = 80;
export const SYNCS_PER_LAYER = 2; // two all-reduces per transformer layer in the forward pass (Megatron-LM)

/** Illustrative cost of one sync among n GPUs, in ms: a base plus a small step per extra GPU. */
export function syncMs(n: number): number {
  return (8 + 2 * (n - 1)) / 1000;
}

export interface TpStep {
  readMs: number;
  commMs: number;
  totalMs: number;
}

export function tpStep(n: number): TpStep {
  const readMs = (WEIGHT_BYTES / (n * HBM_BYTES_PER_S)) * 1000;
  const commMs = n === 1 ? 0 : LAYERS * SYNCS_PER_LAYER * syncMs(n);
  return { readMs, commMs, totalMs: readMs + commMs };
}

export interface Layout {
  tp: number;
  replicas: number;
}

/** Eight GPUs can run as 1 x TP8, 2 x TP4, or 4 x TP2. */
export const LAYOUTS: Layout[] = [
  { tp: 8, replicas: 1 },
  { tp: 4, replicas: 2 },
  { tp: 2, replicas: 4 },
];

export function layoutStats(l: Layout, usersPerReplica: number) {
  const step = tpStep(l.tp).totalMs;
  return {
    stepMs: step,
    perUserTokS: 1000 / step,
    totalTokS: (l.replicas * usersPerReplica * 1000) / step,
  };
}

// ---- Mixture of experts ----

export const EXPERTS = 8;
export const TOP_K = 2;
export const GPUS = 4;
export const HOT = 3; // index of the hot expert (lives on GPU 1 with expert 2)
export const A2A_SHARE = 0.2; // illustrative share of a balanced step spent on the all-to-all exchange

/** Expected number of distinct experts touched by a batch, with uniform routing. */
export function distinctExperts(batch: number): number {
  return EXPERTS * (1 - Math.pow(1 - TOP_K / EXPERTS, batch));
}

/** Per-expert token load. hotShare is the share of routing slots that go to the hot expert (at most 0.5). */
export function expertLoads(batch: number, hotShare: number): number[] {
  const slots = batch * TOP_K;
  const other = (1 - hotShare) / (EXPERTS - 1);
  return Array.from({ length: EXPERTS }, (_, e) => slots * (e === HOT ? hotShare : other));
}

/** GPU loads with experts placed in pairs: GPU g holds experts 2g and 2g+1. Replicas of the hot expert are water-filled onto the lightest GPUs. */
export function gpuLoads(batch: number, hotShare: number, extraCopies: number): number[] {
  const loads = expertLoads(batch, hotShare);
  const base = Array.from({ length: GPUS }, (_, g) => loads[2 * g] + loads[2 * g + 1]);
  if (extraCopies <= 0) return base;
  const home = Math.floor(HOT / 2);
  const hot = loads[HOT];
  base[home] -= hot;
  const others = base.map((v, g) => ({ v, g })).filter((o) => o.g !== home).sort((a, b) => a.v - b.v).slice(0, extraCopies);
  const chosen = [{ v: base[home], g: home }, ...others].sort((a, b) => a.v - b.v);
  // Pour the hot load into the lowest levels first.
  let remaining = hot;
  const level = chosen.map((c) => c.v);
  const add = chosen.map(() => 0);
  for (let i = 0; i < chosen.length && remaining > 1e-9; i++) {
    const width = i + 1;
    const next = i + 1 < chosen.length ? level[i + 1] : Infinity;
    const room = (next - level[i]) * width;
    const pour = Math.min(room, remaining);
    for (let j = 0; j <= i; j++) add[j] += pour / width;
    remaining -= pour;
    for (let j = 0; j <= i; j++) level[j] = level[j] + pour / width;
  }
  chosen.forEach((c, i) => {
    base[c.g] += add[i];
  });
  return base;
}

/** Step time relative to a perfectly balanced step. The FFN part follows the busiest GPU. */
export function slowdown(loads: number[]): number {
  const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
  const max = Math.max(...loads);
  return A2A_SHARE + (1 - A2A_SHARE) * (max / avg);
}

export function balance(loads: number[]): number {
  const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
  return avg / Math.max(...loads);
}
