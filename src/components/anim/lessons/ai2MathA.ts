/** Shared math for lessons A2.1 to A2.4 (GPU memory, prefill and decode, KV cache, batching). Pure functions, no React. */

/** GPU specs. Sources: NVIDIA H100 page (80 GB, 3.35 TB/s, BF16 1,979 TFLOPS "with sparsity") and H200 page (141 GB, 4.8 TB/s). Dense is half of the sparse figure. */
export interface Gpu {
  id: string;
  label: string;
  bytes: number;
  bw: number;
  denseBf16: number;
}
export const GPUS: Gpu[] = [
  { id: 'h100', label: 'H100 SXM (80 GB)', bytes: 80e9, bw: 3.35e12, denseBf16: 1979e12 / 2 },
  { id: 'h200', label: 'H200 (141 GB)', bytes: 141e9, bw: 4.8e12, denseBf16: 1979e12 / 2 },
];

export interface Model {
  id: string;
  label: string;
  /** Total parameters. Memory follows this. */
  params: number;
  /** Parameters used per token. Compute follows this (equals params for a dense model). */
  active: number;
  layers: number;
  dModel: number;
  kvHeads: number;
  headDim: number;
}
/** Llama 3 configs from the Llama 3 paper (Table 3). Mixtral from its paper (Table 1). Parameter counts are the nominal sizes. */
export const MODELS: Model[] = [
  { id: '8b', label: 'Llama 3 8B', params: 8e9, active: 8e9, layers: 32, dModel: 4096, kvHeads: 8, headDim: 128 },
  { id: '70b', label: 'Llama 3 70B', params: 70e9, active: 70e9, layers: 80, dModel: 8192, kvHeads: 8, headDim: 128 },
  { id: '405b', label: 'Llama 3 405B', params: 405e9, active: 405e9, layers: 126, dModel: 16384, kvHeads: 8, headDim: 128 },
  { id: 'mixtral', label: 'Mixtral 8x7B (MoE)', params: 47e9, active: 13e9, layers: 32, dModel: 4096, kvHeads: 8, headDim: 128 },
];
export const model = (id: string) => MODELS.find((m) => m.id === id)!;
export const gpu = (id: string) => GPUS.find((g) => g.id === id)!;

/** Bytes per weight value. */
export const PRECISIONS = [
  { id: 'bf16', label: 'BF16 / FP16', bytes: 2 },
  { id: 'fp8', label: 'FP8 / INT8', bytes: 1 },
  { id: 'int4', label: 'INT4', bytes: 0.5 },
];
export const precision = (id: string) => PRECISIONS.find((p) => p.id === id)!;

/** KV cache bytes per token: K and V, every layer, kvHeads x headDim, kvBytes each (BF16 = 2). */
export const kvBytesPerToken = (m: Model, kvBytes = 2) => 2 * m.layers * m.kvHeads * m.headDim * kvBytes;

export const GIB = 1024 ** 3;

export interface Budget {
  total: number;
  weights: number;
  reserve: number;
  kvRoom: number;
  fits: boolean;
  kvPerToken: number;
  kvPerSeq: number;
  maxSeqs: number;
  minGpus: number;
  readMs: number;
}

/** Memory budget for one model on n GPUs (tensor parallel: weights and KV are split evenly). reserve is a fraction of total memory kept for activations and runtime. */
export function budget(m: Model, bytesPerParam: number, g: Gpu, n: number, reserve: number, ctx: number): Budget {
  const total = n * g.bytes;
  const weights = m.params * bytesPerParam;
  const res = total * reserve;
  const kvRoom = total - weights - res;
  const kvPerToken = kvBytesPerToken(m);
  const kvPerSeq = ctx * kvPerToken;
  const fits = kvRoom >= 0;
  return {
    total,
    weights,
    reserve: res,
    kvRoom,
    fits,
    kvPerToken,
    kvPerSeq,
    maxSeqs: fits ? Math.floor(kvRoom / kvPerSeq) : 0,
    minGpus: Math.ceil(weights / (g.bytes * (1 - reserve))),
    readMs: (weights / n / g.bw) * 1e3,
  };
}

/** Roofline: achieved FLOP/s at an arithmetic intensity (FLOPs per byte). */
export const roofline = (intensity: number, peak: number, bw: number) => Math.min(peak, intensity * bw);
/** Ridge point: the intensity where the slope meets the flat roof. */
export const ridge = (peak: number, bw: number) => peak / bw;

/** Decode floor: every step reads the weights (and the KV cache) once. With n GPUs in tensor parallel each reads its share. */
export const decodeFloorMs = (weightBytes: number, n: number, bw: number, kvBytesRead = 0) => ((weightBytes + kvBytesRead) / (n * bw)) * 1e3;

/** Prefill floor: max of compute time and weight-read time. FLOPs = 2 N_active p + 4 p^2 d L (full square, as in lesson A1.4). */
export function prefillFloorMs(m: Model, bytesPerParam: number, g: Gpu, n: number, p: number) {
  const flops = 2 * m.active * p + 4 * p * p * m.dModel * m.layers;
  const compute = (flops / (n * g.denseBf16)) * 1e3;
  const memory = decodeFloorMs(m.params * bytesPerParam, n, g.bw);
  return { flops, compute, memory, ms: Math.max(compute, memory) };
}

/** One request on one GPU group at batch 1: TTFT floor, average TPOT floor (KV read at the mean context), total latency. */
export function requestTimes(m: Model, bytesPerParam: number, g: Gpu, n: number, prompt: number, out: number) {
  const pre = prefillFloorMs(m, bytesPerParam, g, n, prompt);
  const meanCtx = prompt + out / 2;
  const tpot = decodeFloorMs(m.params * bytesPerParam, n, g.bw, meanCtx * kvBytesPerToken(m));
  const total = pre.ms + tpot * out;
  return { ttft: pre.ms, tpot, total, decodeShare: (tpot * out) / total, tokPerSec: 1000 / tpot, computeBound: pre.compute >= pre.memory };
}

/** Databricks Table 2: MPT-7B, 1 x A100, static batching, 512 input / 64 output tokens. Requests per second by batch size. */
export const BATCH_TABLE = [
  { b: 1, rps: 0.9 },
  { b: 4, rps: 3.2 },
  { b: 8, rps: 5.3 },
  { b: 16, rps: 8.0 },
  { b: 32, rps: 10.5 },
  { b: 64, rps: 12.5 },
];
export const OUT_TOKENS = 64;
/** Derived: a full batch of b requests finishes together, so latency = b / throughput (Little's law). */
export const batchRow = (i: number) => {
  const r = BATCH_TABLE[i];
  const base = BATCH_TABLE[0];
  const tokS = r.rps * OUT_TOKENS;
  const lat = r.b / r.rps;
  return { ...r, tokS, lat, perTokMs: (lat / OUT_TOKENS) * 1e3, thrX: r.rps / base.rps, latX: lat / (base.b / base.rps) };
};

/** Cost per million output tokens from GPU price per hour, throughput, and the share of time the GPU does useful work. */
export const costPerMTok = (usdPerHour: number, tokPerSec: number, utilization = 1) => (usdPerHour / (tokPerSec * 3600 * utilization)) * 1e6;

/** Batching timeline: 6 requests, 4 slots. Output lengths in decode steps. */
export const REQ_LEN = [3, 12, 5, 4, 6, 3];
export const SLOTS = 4;
export interface Run {
  req: number;
  slot: number;
  start: number;
  end: number;
}
/** Static: the first 4 requests form batch 1 (ends with the longest), the rest form batch 2. */
export function staticRuns(): Run[] {
  const runs: Run[] = [];
  let t = 0;
  for (let i = 0; i < REQ_LEN.length; i += SLOTS) {
    const batch = REQ_LEN.slice(i, i + SLOTS);
    batch.forEach((len, k) => runs.push({ req: i + k, slot: k, start: t, end: t + len }));
    t += Math.max(...batch);
  }
  return runs;
}
/** Continuous: a slot that frees up takes the next waiting request at once. */
export function continuousRuns(): Run[] {
  const free = Array(SLOTS).fill(0) as number[];
  return REQ_LEN.map((len, req) => {
    const slot = free.indexOf(Math.min(...free));
    const start = free[slot];
    free[slot] = start + len;
    return { req, slot, start, end: start + len };
  });
}
export const makespan = (runs: Run[]) => Math.max(...runs.map((r) => r.end));
