/**
 * Handoff-policy model for lesson A13.4. Pure functions.
 *
 * Every conversation gets a confidence score. The agent keeps a conversation only when its score is at or above the
 * threshold. The rest go to a person. The ten buckets (share of conversations, accuracy of the AI inside the bucket)
 * are ILLUSTRATIVE and assume a calibrated score. They are not measured data. Real teams must measure them on labelled outcomes.
 */

export interface Bucket {
  /** Middle of the score range, 0.05 means scores from 0.0 to 0.1. */
  mid: number;
  /** Share of all conversations in this bucket. The ten shares sum to 1. */
  share: number;
  /** Chance the AI outcome is right inside this bucket. */
  acc: number;
}

export const BUCKETS: Bucket[] = [
  { mid: 0.05, share: 0.02, acc: 0.3 },
  { mid: 0.15, share: 0.03, acc: 0.4 },
  { mid: 0.25, share: 0.04, acc: 0.5 },
  { mid: 0.35, share: 0.05, acc: 0.58 },
  { mid: 0.45, share: 0.06, acc: 0.66 },
  { mid: 0.55, share: 0.08, acc: 0.74 },
  { mid: 0.65, share: 0.1, acc: 0.82 },
  { mid: 0.75, share: 0.14, acc: 0.9 },
  { mid: 0.85, share: 0.2, acc: 0.96 },
  { mid: 0.95, share: 0.28, acc: 0.995 },
];

/** Cost of one AI conversation, from the lesson budget (8 Sonnet 5.5 calls, 4,000 in and 150 out each, as of 2026-10-19). */
export const AI_COST = 0.08;

export interface Policy {
  /** Index 0 to 10. The AI keeps buckets with index >= idx. 0 means the AI keeps everything. 10 means the AI is off. */
  idx: number;
  /** Cost of a conversation a person handles, in dollars (assumption). */
  humanCost: number;
  /** Cost of one wrong AI outcome, in dollars (assumption). */
  errorCost: number;
}

export interface Result {
  threshold: number;
  /** Share of conversations the AI keeps. */
  kept: number;
  /** Share of all conversations the AI resolves correctly. */
  resolved: number;
  /** Share of all conversations the AI gets wrong. */
  wrong: number;
  /** Wrong share among the conversations the AI keeps. */
  wrongRate: number;
  /** Share a person handles. */
  human: number;
  /** Expected dollars per ticket. */
  cost: number;
}

export function evaluate(p: Policy): Result {
  const kept = BUCKETS.slice(p.idx);
  const keptShare = kept.reduce((a, b) => a + b.share, 0);
  const resolved = kept.reduce((a, b) => a + b.share * b.acc, 0);
  const wrong = keptShare - resolved;
  const aiOn = p.idx < BUCKETS.length;
  const cost = (aiOn ? AI_COST : 0) + (1 - keptShare) * p.humanCost + wrong * p.errorCost;
  return {
    threshold: p.idx / 10,
    kept: keptShare,
    resolved,
    wrong,
    wrongRate: keptShare > 0 ? wrong / keptShare : 0,
    human: 1 - keptShare,
    cost,
  };
}

/** The threshold index with the lowest expected cost. Ties go to the lower index. */
export function bestIdx(humanCost: number, errorCost: number): number {
  let best = 0;
  let bestCost = Infinity;
  for (let i = 0; i <= BUCKETS.length; i++) {
    const c = evaluate({ idx: i, humanCost, errorCost }).cost;
    if (c < bestCost - 1e-12) {
      bestCost = c;
      best = i;
    }
  }
  return best;
}
