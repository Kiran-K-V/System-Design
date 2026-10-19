/**
 * Arithmetic for lesson A13.5 (text-to-SQL). Pure functions.
 *
 * Sourced: Uber says some tables span "over 200 columns" and can use "as much as 40-60K tokens"
 * (https://www.uber.com/en-CA/blog/query-gpt/, read 2026-10-19). Claude Sonnet 5.5 input is $2 per
 * million tokens (https://platform.claude.com/docs/en/about-claude/pricing, read 2026-10-19).
 * Illustrative (our model, not measured): the retriever model below, 30 columns per table,
 * 15 tokens per bare column, 200 tokens per documented column, 2,000 fixed prompt tokens.
 */

export const COLS_PER_TABLE = 30;
export const BARE_TOKENS_PER_COL = 15;
/** Derived from Uber: 40-60K tokens for "over 200" columns is at most 200-300 per column. We take 200. */
export const DOC_TOKENS_PER_COL = 200;
export const PRUNED_COLS = 8;
export const FIXED_TOKENS = 2000;
/** Uber's LLM call "only supported 32K tokens" at the time. Used as a marker, not as a model limit. */
export const UBER_LIMIT = 32000;
export const PRICE_PER_MTOK = 2;

export type Detail = 'bare' | 'documented' | 'pruned';

export const tokensPerTable = (d: Detail): number =>
  d === 'bare' ? COLS_PER_TABLE * BARE_TOKENS_PER_COL : d === 'documented' ? COLS_PER_TABLE * DOC_TOKENS_PER_COL : PRUNED_COLS * DOC_TOKENS_PER_COL;

/** Tokens to paste every table. */
export const wholeSchemaTokens = (tables: number, d: Detail = 'bare') => tables * tokensPerTable(d);

export interface Retriever {
  /** Tables in the warehouse. */
  n: number;
  /** Share of gold tables whose documentation lets the retriever find them (metadata quality). */
  p: number;
  /** Mean rank of a findable gold table (geometric). */
  meanRank: number;
  /** Tables the query needs. */
  gold: number;
}

/**
 * Model: with probability p a gold table is findable, and its rank is geometric with mean `meanRank`.
 * Otherwise its rank is uniform over all n tables (the retriever has no signal).
 * recall@k for one gold table = p * (1 - (1 - 1/m)^k) + (1 - p) * k / n.
 */
export function singleRecall(r: Retriever, k: number): number {
  const kk = Math.min(Math.max(k, 0), r.n);
  return r.p * (1 - Math.pow(1 - 1 / r.meanRank, kk)) + ((1 - r.p) * kk) / r.n;
}

/** Share of questions whose every gold table is in the top k (assumes independent ranks: pessimistic). */
export const allGoldRecall = (r: Retriever, k: number) => Math.pow(singleRecall(r, k), r.gold);

export const promptTokens = (k: number, d: Detail) => FIXED_TOKENS + k * tokensPerTable(d);

export const inputCostUsd = (tokens: number) => (tokens * PRICE_PER_MTOK) / 1e6;

/** Smallest k whose all-gold recall reaches the target, or null if the ceiling is below it. */
export function kForRecall(r: Retriever, target: number, maxK = r.n): number | null {
  for (let k = 1; k <= maxK; k++) if (allGoldRecall(r, k) >= target) return k;
  return null;
}
