/**
 * Calibration simulator logic for lesson E1.11. Pure and deterministic.
 *
 * ILLUSTRATIVE model, not a measurement. Six groups of ads with true click rates from 0.2% to 8%.
 * The training log is changed in two ways, and the model is assumed to fit the log it saw exactly:
 *  - Delay: a share `late` of real clicks has not arrived when the example is labelled, so it counts as no click.
 *  - Downsampling: only a share `keep` of the no-click examples are kept for training.
 * Without a fix, the model learns the downsampled rate. With the log-odds fix it undoes the downsampling.
 * Delay is not undone by that fix.
 */
export const TRUE_CTR = [0.002, 0.005, 0.01, 0.02, 0.04, 0.08];
export const SHARE = [0.3, 0.25, 0.2, 0.12, 0.08, 0.05]; // share of impressions per group, sums to 1

export interface CalibInput {
  keep: number; // 0 < keep <= 1
  late: number; // 0 <= late < 1
  fixed: boolean;
}

/** The rate a model learns from the changed log. */
export function learned(p: number, keep: number, late: number): number {
  const seen = p * (1 - late);
  return seen / (seen + (1 - seen) * keep);
}

/** Undo the downsampling with the log-odds fix: p = q*r / (q*r + 1 - q). */
export function undoDownsample(q: number, keep: number): number {
  return (q * keep) / (q * keep + 1 - q);
}

export function predict(p: number, i: CalibInput): number {
  const q = learned(p, i.keep, i.late);
  return i.fixed ? undoDownsample(q, i.keep) : q;
}

export function run(i: CalibInput) {
  const groups = TRUE_CTR.map((p, g) => ({ actual: p, predicted: predict(p, i), share: SHARE[g] }));
  const meanPred = groups.reduce((s, g) => s + g.predicted * g.share, 0);
  const meanTrue = groups.reduce((s, g) => s + g.actual * g.share, 0);
  // Ratio of predicted to real clicks over all impressions. Above 1 means the auction overvalues clicks.
  const ratio = meanPred / meanTrue;
  return { groups, meanPred, meanTrue, ratio };
}
