/**
 * Moderation cascade model for the content-moderation drill in lesson A13.8. Pure functions.
 *
 * A cheap classifier scores every item. Items below the LOW threshold pass. Items at or above HIGH (0.98) are removed.
 * Items in between go to an LLM. The LLM allows, removes, or says "unsure". Unsure items go to a person.
 * Every number here is ILLUSTRATIVE: the score spreads, the LLM behaviour, the volume, and the prices of a review.
 * The LLM call price is derived from the Claude Haiku 5.5 list price (as of 2026-10-20).
 */

export const ITEMS_PER_DAY = 1_000_000;
export const PREVALENCE = 0.005;
export const HIGH = 0.98;

/** Classifier score on the logit scale: benign items spread around -4, harmful items around +1.5. */
const BENIGN = { mean: -4, sd: 1.5 };
const HARMFUL = { mean: 1.5, sd: 2 };

/** What the LLM does with a benign and a harmful item that reaches it. Each row sums to 1. */
export const LLM_BENIGN = { allow: 0.93, unsure: 0.06, remove: 0.01 };
export const LLM_HARMFUL = { allow: 0.05, unsure: 0.15, remove: 0.8 };

/** LLM call: 1,500 policy tokens + 200 item tokens in, 30 tokens out. Haiku 5.5: $0.10 in, $0.50 out per million tokens. */
export const LLM_IN_TOKENS = 1700;
export const LLM_OUT_TOKENS = 30;
export const LLM_CALL_USD = (LLM_IN_TOKENS * 0.1 + LLM_OUT_TOKENS * 0.5) / 1e6;
/** Cost of one human review in dollars (assumption, no source). */
export const HUMAN_REVIEW_USD = 0.4;

/** Standard normal CDF (Abramowitz and Stegun 7.1.26 for erf). */
function phi(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

const logit = (p: number) => Math.log(p / (1 - p));
/** Share of a class whose score is below p. */
const below = (c: { mean: number; sd: number }, p: number) => phi((logit(p) - c.mean) / c.sd);

export interface Result {
  /** Items per day that go to the LLM. */
  toLlm: number;
  /** Items per day that reach a person. */
  toHuman: number;
  /** Harmful items per day that stay online. */
  missed: number;
  /** Harmless items per day that are removed. */
  wrongRemoved: number;
  llmUsd: number;
  humanUsd: number;
  /** Share of all items that reach the LLM. */
  llmShare: number;
}

export function evaluate(low: number): Result {
  const harmful = ITEMS_PER_DAY * PREVALENCE;
  const benign = ITEMS_PER_DAY - harmful;
  const bBand = benign * (below(BENIGN, HIGH) - below(BENIGN, low));
  const hBand = harmful * (below(HARMFUL, HIGH) - below(HARMFUL, low));
  const hLow = harmful * below(HARMFUL, low);
  const bAuto = benign * (1 - below(BENIGN, HIGH));
  const toLlm = bBand + hBand;
  const toHuman = bBand * LLM_BENIGN.unsure + hBand * LLM_HARMFUL.unsure;
  const missed = hLow + hBand * LLM_HARMFUL.allow;
  const wrongRemoved = bBand * LLM_BENIGN.remove + bAuto;
  return {
    toLlm,
    toHuman,
    missed,
    wrongRemoved,
    llmUsd: toLlm * LLM_CALL_USD,
    humanUsd: toHuman * HUMAN_REVIEW_USD,
    llmShare: toLlm / ITEMS_PER_DAY,
  };
}

export const LOWS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5];
