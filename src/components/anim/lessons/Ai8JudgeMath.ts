/** Logic for the A8.4 judge widget. Pure functions. The positive class is "this answer is bad". */

export interface Confusion {
  /** Bad answers the judge flagged. */
  tp: number;
  /** Bad answers the judge passed. */
  fn: number;
  /** Good answers the judge passed. */
  tn: number;
  /** Good answers the judge flagged. */
  fp: number;
}

export interface JudgeStats extends Confusion {
  agreement: number;
  precision: number;
  recall: number;
  specificity: number;
  kappa: number;
}

/**
 * badRate: share of answers a human marked bad (0..1).
 * recall: share of bad answers the judge flags. specificity: share of good answers the judge passes.
 */
export function judgeStats(n: number, badRate: number, recall: number, specificity: number): JudgeStats {
  const bad = n * badRate;
  const good = n - bad;
  const tp = bad * recall;
  const fn = bad - tp;
  const tn = good * specificity;
  const fp = good - tn;
  const agreement = (tp + tn) / n;
  const flagged = tp + fp;
  const precision = flagged === 0 ? 0 : tp / flagged;
  // Chance agreement: both say bad by luck, plus both say good by luck.
  const pe = ((tp + fn) / n) * (flagged / n) + ((tn + fp) / n) * ((tn + fn) / n);
  const kappa = pe === 1 ? 0 : (agreement - pe) / (1 - pe);
  return { tp, fn, tn, fp, agreement, precision, recall, specificity, kappa };
}

/** Wang et al. 2023 (arXiv 2305.17926), Table 2. 80 questions, conflict = verdict changed when the answer order was swapped. */
export const SWAP_ROWS = [
  { judge: 'GPT-4', pair: 'Vicuna-13B vs ChatGPT', conflicts: 37, total: 80 },
  { judge: 'GPT-4', pair: 'Vicuna-13B vs Alpaca-13B', conflicts: 4, total: 80 },
  { judge: 'ChatGPT', pair: 'Vicuna-13B vs ChatGPT', conflicts: 66, total: 80 },
  { judge: 'ChatGPT', pair: 'Vicuna-13B vs Alpaca-13B', conflicts: 42, total: 80 },
] as const;

export const conflictRate = (r: { conflicts: number; total: number }) => r.conflicts / r.total;

/** Cost of judging n items. Prices are dollars per million tokens. */
export function judgeCost(n: number, inTok: number, outTok: number, inPrice: number, outPrice: number, calls = 1): number {
  return (n * calls * (inTok * inPrice + outTok * outPrice)) / 1e6;
}
