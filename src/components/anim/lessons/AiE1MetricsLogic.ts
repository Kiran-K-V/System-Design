/**
 * Logic for lesson E1.6 (offline and online metrics). Pure functions. All data illustrative.
 * Score model: positives and negatives have normal score distributions with the same spread.
 */

/** Standard normal CDF (Abramowitz and Stegun 7.1.26 erf approximation, error below 2e-7). */
export function phi(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x / Math.SQRT2));
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = 1 - poly * Math.exp(-(x * x) / 2);
  return 0.5 * (1 + (x >= 0 ? erf : -erf));
}

export const MODEL = { muPos: 0.65, muNeg: 0.4, sigma: 0.18 };
export const TOTAL = 1000;

export interface Matrix {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  accuracy: number;
}

/** Expected confusion matrix for 1,000 cases, at a threshold, with a given share of positives. */
export function matrix(threshold: number, positiveShare: number, m = MODEL): Matrix {
  const pos = TOTAL * positiveShare;
  const neg = TOTAL - pos;
  const tp = pos * (1 - phi((threshold - m.muPos) / m.sigma));
  const fn = pos - tp;
  const fp = neg * (1 - phi((threshold - m.muNeg) / m.sigma));
  const tn = neg - fp;
  return {
    tp,
    fp,
    fn,
    tn,
    precision: tp + fp === 0 ? 1 : tp / (tp + fp),
    recall: pos === 0 ? 0 : tp / pos,
    accuracy: (tp + tn) / TOTAL,
  };
}

/** Chance that a random positive scores above a random negative. Does not depend on threshold or share. */
export function auc(m = MODEL): number {
  return phi((m.muPos - m.muNeg) / (m.sigma * Math.SQRT2));
}

/** Illustrative past experiments: offline gain (percent) and online effect (percent). */
export interface Exp {
  id: string;
  offline: number;
  online: number;
}

export const EXPERIMENTS: Exp[] = [
  { id: 'e1', offline: 0.2, online: 0.1 },
  { id: 'e2', offline: 0.4, online: -0.3 },
  { id: 'e3', offline: 0.6, online: 0.5 },
  { id: 'e4', offline: 0.8, online: 0.0 },
  { id: 'e5', offline: 1.0, online: 0.9 },
  { id: 'e6', offline: 1.2, online: -0.4 },
  { id: 'e7', offline: 1.5, online: 0.3 },
  { id: 'e8', offline: 2.0, online: 0.0 },
  { id: 'e9', offline: 2.4, online: 1.1 },
  { id: 'e10', offline: 2.8, online: -0.2 },
  { id: 'e11', offline: 0.1, online: -0.1 },
  { id: 'e12', offline: -0.3, online: 0.2 },
  { id: 'e13', offline: -0.8, online: -0.5 },
  { id: 'e14', offline: -1.2, online: 0.4 },
];

/** Online changes inside this band are treated as noise (illustrative). */
export const NOISE = 0.3;

export type Outcome = 'win' | 'loss' | 'flat';
export const outcome = (e: Exp): Outcome => (e.online > NOISE ? 'win' : e.online < -NOISE ? 'loss' : 'flat');

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

export function summary(list: Exp[]) {
  const r = pearson(list.map((e) => e.offline), list.map((e) => e.online));
  const c = { win: 0, loss: 0, flat: 0 };
  for (const e of list) c[outcome(e)]++;
  return { n: list.length, r, ...c };
}

/** Offline winners: experiments whose offline gain is above the given bar. */
export const winners = (bar: number) => EXPERIMENTS.filter((e) => e.offline > bar);
