/** Capacity and cost arithmetic for lesson A2.7. Output tokens only, as in lesson A0.4. Pure functions. */

export const HOURS_PER_MONTH = 730;
/** Measured: Llama 3.1 8B, one H100, vLLM, 128 in / 128 out, request rate 64 (E2E Networks benchmark, as cited in lesson A0.4). */
export const MEASURED_TOK_PER_SEC = 8399;
/** Same benchmark row: completed requests per second. Times 128 output tokens gives a stricter output-only figure. */
export const MEASURED_REQ_PER_SEC = 35.04;
export const OUTPUT_ONLY_TOK_PER_SEC = Math.round(MEASURED_REQ_PER_SEC * 128);

export interface PlanIn {
  peakQps: number;
  /** Average load divided by peak load, 0 to 1. */
  avgOverPeak: number;
  tokensPerRequest: number;
  tokPerGpu: number;
  /** Target utilization at peak. Leaves headroom for bursts. */
  targetUtil: number;
  gpuHour: number;
  /** API price per 1M output tokens. */
  apiOutPrice: number;
  /** Extra GPUs kept for failover. */
  spare: number;
}

export interface PlanOut {
  peakTokPerSec: number;
  gpusNoHeadroom: number;
  gpus: number;
  monthlySelf: number;
  avgTokPerSec: number;
  monthlyTokens: number;
  avgUtil: number;
  selfPerM: number;
  monthlyApi: number;
}

export function plan(i: PlanIn): PlanOut {
  const peakTokPerSec = i.peakQps * i.tokensPerRequest;
  const gpusNoHeadroom = Math.ceil(peakTokPerSec / i.tokPerGpu - 1e-9);
  const gpus = Math.max(1, Math.ceil(peakTokPerSec / (i.tokPerGpu * i.targetUtil) - 1e-9)) + i.spare;
  const monthlySelf = gpus * i.gpuHour * HOURS_PER_MONTH;
  const avgTokPerSec = peakTokPerSec * i.avgOverPeak;
  const monthlyTokens = avgTokPerSec * 3600 * HOURS_PER_MONTH;
  return {
    peakTokPerSec,
    gpusNoHeadroom,
    gpus,
    monthlySelf,
    avgTokPerSec,
    monthlyTokens,
    avgUtil: avgTokPerSec / (gpus * i.tokPerGpu),
    selfPerM: monthlySelf / (monthlyTokens / 1e6),
    monthlyApi: (monthlyTokens / 1e6) * i.apiOutPrice,
  };
}

/** Cost per 1M output tokens for one GPU at utilization u. */
export const selfPerMillion = (gpuHour: number, tokPerSec: number, u: number) => (gpuHour * 1e6) / (3600 * tokPerSec * u);

/** Illustrative day: load in GPU-equivalents (at 100% use) for each hour. Made up, shaped like a business-hours product. */
export const DAY_LOAD = [1.5, 1.2, 1, 1, 1.2, 2, 3.5, 5.5, 7.5, 9, 10, 9.5, 9, 9.5, 10, 9, 8, 7, 6, 5, 4, 3, 2.2, 1.8];

export function dayStats(load: number[] = DAY_LOAD) {
  const peakGpus = Math.ceil(Math.max(...load));
  const used = load.reduce((a, b) => a + b, 0);
  const staticHours = peakGpus * load.length;
  // Autoscaler that sizes each hour from the previous hour's load (cold start and reaction lag).
  const lagged = load.map((_, h) => Math.max(1, Math.ceil(load[(h + load.length - 1) % load.length])));
  const lagHours = lagged.reduce((a, b) => a + b, 0);
  const shortHours = load.filter((l, h) => l > lagged[h]).length;
  return { peakGpus, used, staticHours, staticUtil: used / staticHours, lagged, lagHours, lagUtil: used / lagHours, shortHours };
}
