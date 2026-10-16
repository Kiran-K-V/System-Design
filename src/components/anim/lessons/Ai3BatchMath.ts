/**
 * Sync versus batch cost and time, for lesson A3.7.
 * Prices: USD per 1M tokens. Standard prices from claude.com/pricing and batch prices from
 * platform.claude.com/docs/en/build-with-claude/batch-processing, both fetched 2026-10-16. Batch is 50% of standard on the page.
 * Cache read multiplier: platform.claude.com/docs/en/build-with-claude/prompt-caching (0.05 on Opus 5.5 and Sonnet 5.5, 0.1 on Haiku 5.5).
 * Rate limits: platform.claude.com/docs/en/api/rate-limits (Start, Build, Scale rows for Opus 5.5, Sonnet 5.5, Haiku 5.5 are equal).
 */

export interface BatchModel {
  id: string;
  name: string;
  inStd: number;
  outStd: number;
  inBatch: number;
  outBatch: number;
  cacheRead: number;
}

export const BATCH_MODELS: BatchModel[] = [
  { id: 'opus55', name: 'Opus 5.5', inStd: 4, outStd: 20, inBatch: 2, outBatch: 10, cacheRead: 0.05 },
  { id: 'sonnet55', name: 'Sonnet 5.5', inStd: 2, outStd: 10, inBatch: 1, outBatch: 5, cacheRead: 0.05 },
  { id: 'haiku55', name: 'Haiku 5.5 (prompt up to 100K)', inStd: 0.1, outStd: 0.5, inBatch: 0.05, outBatch: 0.25, cacheRead: 0.1 },
];

export interface TierLimits {
  id: string;
  name: string;
  rpm: number;
  itpm: number;
  otpm: number;
  /** Max batch requests in the processing queue. */
  queue: number;
}

export const TIER_LIMITS: TierLimits[] = [
  { id: 'start', name: 'Start', rpm: 1000, itpm: 2_000_000, otpm: 400_000, queue: 200_000 },
  { id: 'build', name: 'Build', rpm: 5000, itpm: 5_000_000, otpm: 1_000_000, queue: 300_000 },
  { id: 'scale', name: 'Scale', rpm: 10_000, itpm: 10_000_000, otpm: 2_000_000, queue: 500_000 },
];

export const MAX_PER_BATCH = 100_000;
export const MAX_BATCH_MB = 256;

export interface Job {
  requests: number;
  inTokens: number;
  outTokens: number;
  /** Share of input tokens that are cache reads, 0 to 0.9. Cache writes are ignored. */
  cacheShare: number;
}

export function cost(m: BatchModel, j: Job, batch: boolean): number {
  const pin = batch ? m.inBatch : m.inStd;
  const pout = batch ? m.outBatch : m.outStd;
  const inEff = j.inTokens * (1 - j.cacheShare) + j.inTokens * j.cacheShare * m.cacheRead;
  return (j.requests * (inEff * pin + j.outTokens * pout)) / 1e6;
}

/**
 * Minutes to push the job through sync calls at the tier limits, if you used the full budget with no gaps.
 * Cache reads do not count toward ITPM on these models. A request needs 1 RPM, uncached input for ITPM, and output for OTPM.
 */
export function syncMinutes(t: TierLimits, j: Job): { minutes: number; binding: 'RPM' | 'ITPM' | 'OTPM' } {
  const uncached = j.inTokens * (1 - j.cacheShare);
  const byR = t.rpm;
  const byI = uncached > 0 ? t.itpm / uncached : Infinity;
  const byO = j.outTokens > 0 ? t.otpm / j.outTokens : Infinity;
  const rate = Math.min(byR, byI, byO);
  return { minutes: j.requests / rate, binding: rate === byR ? 'RPM' : rate === byI ? 'ITPM' : 'OTPM' };
}

export const batchesNeeded = (requests: number) => Math.max(1, Math.ceil(requests / MAX_PER_BATCH));

export function fmtDuration(min: number): string {
  if (min < 1) return `${Math.round(min * 60)} s`;
  if (min < 120) return `${min < 10 ? min.toFixed(1) : Math.round(min)} min`;
  if (min < 60 * 48) return `${(min / 60).toFixed(1)} h`;
  return `${(min / 1440).toFixed(1)} days`;
}
