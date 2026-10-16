/** Math for lesson A8.8. Pure functions. Canary power, rule of three, shadow cost. */

const Z_ALPHA = 1.959964;
const Z_BETA = 0.841621;

/**
 * Canary requests needed to see a drop in a pass rate with 80% power at alpha 0.05 (two-sided).
 * The canary gets share `f` of traffic and the rest is control, so the control arm is k = (1 - f) / f times larger.
 */
export function canaryN(base: number, drop: number, f: number): number {
  const p2 = base;
  const p1 = base - drop;
  const k = (1 - f) / f;
  const pbar = (p1 + k * p2) / (1 + k);
  const a = Z_ALPHA * Math.sqrt((1 + 1 / k) * pbar * (1 - pbar));
  const b = Z_BETA * Math.sqrt(p1 * (1 - p1) + (p2 * (1 - p2)) / k);
  return Math.ceil(((a + b) * (a + b)) / (drop * drop));
}

/** Hours of traffic the canary needs to see `canaryN` requests. */
export function hoursToDetect(base: number, drop: number, f: number, perDay: number): number {
  return (canaryN(base, drop, f) / (perDay * f)) * 24;
}

/** Exact 95% upper bound on a failure rate after n clean requests: 1 - 0.05^(1/n). About 3 / n. */
export function upperBound(n: number): number {
  return 1 - Math.pow(0.05, 1 / n);
}

/** Dollars per day to run a shadow copy of a share `f` of traffic. Prices are dollars per million tokens. */
export function shadowPerDay(perDay: number, f: number, inTok: number, outTok: number, inPrice: number, outPrice: number): number {
  return (perDay * f * (inTok * inPrice + outTok * outPrice)) / 1e6;
}
