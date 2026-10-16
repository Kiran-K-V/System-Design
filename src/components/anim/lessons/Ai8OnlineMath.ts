/** Math for lesson A8.7. Pure functions. Two-proportion A/B test, normal approximation. */

/** z for a two-sided alpha of 0.05. */
export const Z_ALPHA = 1.959964;
/** z for power 0.80 and 0.90. */
export const Z_POWER: Record<number, number> = { 0.8: 0.841621, 0.9: 1.281552 };

/** Users (or answers) needed per arm to detect a relative lift in a rate. */
export function nPerArm(base: number, relLift: number, power: 0.8 | 0.9 = 0.8): number {
  const p1 = base;
  const p2 = base * (1 + relLift);
  const pbar = (p1 + p2) / 2;
  const d = p2 - p1;
  const a = Z_ALPHA * Math.sqrt(2 * pbar * (1 - pbar));
  const b = Z_POWER[power] * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return Math.ceil(((a + b) * (a + b)) / (d * d));
}

/** Half-width of a 95% interval for one rate after n observations. */
export function halfWidth(p: number, n: number): number {
  return Z_ALPHA * Math.sqrt((p * (1 - p)) / n);
}

/** Chi-square for a 50/50 split with counts a and b (1 degree of freedom). */
export function srmChi2(a: number, b: number): number {
  const e = (a + b) / 2;
  return ((a - e) ** 2 + (b - e) ** 2) / e;
}

/** Critical chi-square (1 df) for p = 0.001. */
export const SRM_CRIT = 10.83;

/** Cost of judging n answers with one judge call each. Prices are dollars per million tokens. */
export function judgeCost(n: number, inTok: number, outTok: number, inPrice: number, outPrice: number): number {
  return (n * (inTok * inPrice + outTok * outPrice)) / 1e6;
}

/** Days to collect 2n answers when `perDay` answers arrive and each user sees one arm. */
export function daysNeeded(n: number, perDay: number): number {
  return (2 * n) / perDay;
}
