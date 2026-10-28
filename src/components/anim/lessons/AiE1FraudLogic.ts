/**
 * Maths for lesson E1.12 (fraud detection). Pure functions. Every input is ILLUSTRATIVE.
 *
 * Score model: a good payment scores z ~ Normal(0, 1). A fraud payment scores z ~ Normal(d, 1).
 * A larger gap d is a stronger model. The block rule is "block when the score is at or above t".
 */

/** Standard normal cumulative distribution, via the Abramowitz and Stegun erf approximation (error under 1.5e-7). */
export function phi(x: number): number {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * a);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = 1 - poly * Math.exp(-a * a);
  return 0.5 * (1 + s * erf);
}

export const FRAUD_RATE = 0.001; // about 1 in 1,000 payments (Stripe, 2023-03-29)
export const PAYMENTS = 1_000_000; // payments per run of the widget

export interface FraudInput {
  /** Gap between the fraud and good score centres. */
  d: number;
  /** Score threshold. */
  t: number;
  /** Cost of blocking one good payment (lost margin, a support contact, a lost customer). */
  costBlock: number;
  /** Cost of letting one fraud payment through (goods or cash lost, the dispute fee). */
  costMiss: number;
}

export interface FraudOut {
  fpr: number;
  recall: number;
  goodBlocked: number;
  fraudCaught: number;
  fraudMissed: number;
  /** Share of blocked payments that were truly fraud. */
  precision: number;
  cost: number;
}

export function evaluate({ d, t, costBlock, costMiss }: FraudInput): FraudOut {
  const fraudN = PAYMENTS * FRAUD_RATE;
  const goodN = PAYMENTS - fraudN;
  const fpr = 1 - phi(t);
  const recall = 1 - phi(t - d);
  const goodBlocked = goodN * fpr;
  const fraudCaught = fraudN * recall;
  const fraudMissed = fraudN - fraudCaught;
  const blocked = goodBlocked + fraudCaught;
  return {
    fpr,
    recall,
    goodBlocked,
    fraudCaught,
    fraudMissed,
    precision: blocked === 0 ? 1 : fraudCaught / blocked,
    cost: goodBlocked * costBlock + fraudMissed * costMiss,
  };
}

/** Threshold grid used by the widget (step 0.1). */
export const T_MIN = 1;
export const T_MAX = 6;
export const T_STEP = 0.1;

export function bestThreshold(d: number, costBlock: number, costMiss: number): number {
  let best = T_MIN;
  let bestCost = Infinity;
  for (let i = 0; i <= Math.round((T_MAX - T_MIN) / T_STEP); i++) {
    const t = Math.round((T_MIN + i * T_STEP) * 10) / 10;
    const c = evaluate({ d, t, costBlock, costMiss }).cost;
    if (c < bestCost) {
      bestCost = c;
      best = t;
    }
  }
  return best;
}

/**
 * Label maturity: the share of a cohort's eventual fraud labels that are known at a given age in weeks.
 * ILLUSTRATIVE shape. Card networks typically allow disputes up to 120 days (about 17 weeks) after a payment (Stripe docs).
 */
export const MATURITY: { week: number; known: number }[] = [
  { week: 1, known: 0.3 },
  { week: 2, known: 0.5 },
  { week: 4, known: 0.72 },
  { week: 8, known: 0.9 },
  { week: 12, known: 0.97 },
  { week: 17, known: 1 },
];
