/**
 * Pure maths for lesson E1.7 (drift and model aging). All numbers are illustrative.
 * Decay is modelled as a straight line between retrains. Real curves bend, so measure yours.
 */

export type Pt = [number, number];

/** Polyline of a quality score over weeks. A retrain draws a vertical jump back to `start`. */
export function decaySeries(weeks: number, start: number, perWeek: number, interval: number | null): Pt[] {
  const pts: Pt[] = [[0, start]];
  for (let w = 1; w <= weeks; w++) {
    const since = interval ? w % interval : w;
    if (interval && since === 0) {
      pts.push([w, start - perWeek * interval]);
      pts.push([w, start]);
    } else {
      pts.push([w, start - perWeek * since]);
    }
  }
  return pts;
}

/** Longest retrain interval (whole weeks) that keeps the worst point at or above the floor. */
export function maxInterval(start: number, floor: number, perWeek: number): number {
  return Math.floor((start - floor) / perWeek + 1e-9);
}

export const BINS = 12;

/** Probability mass of a normal curve in each of 12 unit bins [0,12). Normalised to sum to 1. */
export function binProbs(mean: number, sd: number): number[] {
  const cdf = (x: number) => 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
  const raw = Array.from({ length: BINS }, (_, i) => cdf(i + 1) - cdf(i));
  const s = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / s);
}

/** Abramowitz and Stegun 7.1.26 approximation of erf. */
export function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}

/** Total variation distance: half the sum of absolute bin differences. 0 means same shape, 1 means no overlap. */
export function tvd(p: number[], q: number[]): number {
  return 0.5 * p.reduce((a, v, i) => a + Math.abs(v - q[i]), 0);
}

export interface LiveView {
  train: number[];
  live: number[];
  distance: number;
  coverage: number;
}

/** Live traffic after a mean shift, a spread change, and a share of missing values. Missing rows leave the histogram. */
export function liveView(shift: number, spread: number, missingPct: number): LiveView {
  const train = binProbs(5.5, 1.6);
  const live = binProbs(5.5 + shift, 1.6 * spread);
  return { train, live, distance: tvd(train, live), coverage: 1 - missingPct / 100 };
}
