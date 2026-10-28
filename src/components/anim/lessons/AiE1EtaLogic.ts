/**
 * ETA asymmetric-loss logic for lesson E1.11. Pure and deterministic.
 *
 * ILLUSTRATIVE model. The real delivery time is log-normal with median 30 minutes and spread 0.35 (a right tail:
 * a few orders take much longer). We pick one promised ETA for every order. Cost: each minute late costs `ratio`
 * times a minute early. The loss that fits this cost is the quantile (pinball) loss, and its best answer is the
 * quantile ratio / (1 + ratio) of the delivery time.
 */
export const MEDIAN = 30;
export const SIGMA = 0.35;
const N = 4000;

/** Inverse of the standard normal CDF (Acklam's approximation, error below 1.2e-9). */
export function invNorm(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - lo) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Delivery time at quantile u. */
export const timeAt = (u: number) => MEDIAN * Math.exp(SIGMA * invNorm(u));

const TIMES = Array.from({ length: N }, (_, k) => timeAt((k + 0.5) / N));

export const bestQuantile = (ratio: number) => ratio / (1 + ratio);

export function evaluate(eta: number, ratio: number) {
  let abs = 0, late = 0, lateMin = 0, earlyMin = 0, cost = 0;
  for (const t of TIMES) {
    if (t > eta) { late++; lateMin += t - eta; cost += ratio * (t - eta); } // arrived after the promise
    else { earlyMin += eta - t; cost += eta - t; }
    abs += Math.abs(t - eta);
  }
  return { mae: abs / N, lateRate: late / N, meanLate: lateMin / N, meanEarly: earlyMin / N, cost: cost / N };
}

/** The promised ETA with the lowest cost for this ratio. */
export const bestEta = (ratio: number) => timeAt(bestQuantile(ratio));
