/**
 * Cost and time model for the deep-research case (lesson A13.7). Pure functions, no imports.
 *
 * PRICES are live list prices from https://platform.claude.com/docs/en/about-claude/pricing as of 2026-10-20
 * (USD per million tokens). Web search is $10 per 1,000 searches (same page). Web fetch has no extra charge beyond tokens.
 *
 * Every other constant below is an ILLUSTRATIVE assumption chosen by the lesson author. None is measured.
 */

export type ModelId = 'opus' | 'sonnet' | 'haiku';

export interface Price {
  name: string;
  /** USD per million input tokens. */
  inp: number;
  /** USD per million output tokens. */
  out: number;
  /** Cache hit (read), USD per million tokens. */
  cacheRead: number;
  /** 5-minute cache write, USD per million tokens. */
  cacheWrite: number;
}

// Haiku 5.5 prices apply to prompts up to 100,000 tokens. The model keeps every call under that (see MAX_CALLS).
export const PRICES: Record<ModelId, Price> = {
  opus: { name: 'Claude Opus 5.5', inp: 4, out: 20, cacheRead: 0.2, cacheWrite: 5 },
  sonnet: { name: 'Claude Sonnet 5.5', inp: 2, out: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  haiku: { name: 'Claude Haiku 5.5', inp: 0.1, out: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

/** One web search, USD (Anthropic: $10 per 1,000 searches). */
export const SEARCH_USD = 10 / 1000;

// ---- Illustrative assumptions (tokens) ----
/** System prompt plus the brief a worker starts with. */
export const S0 = 3000;
/** Tool result appended after each tool call (search snippets or a fetched page extract). */
export const R = 3000;
/** Model output per tool-calling step (a short thought plus the call). */
export const O = 300;
/** Final summary a worker returns. */
export const F = 1500;
export const LEAD_PLAN_IN = 2000;
export const LEAD_PLAN_OUT = 1000;
export const MERGE_BASE_IN = 3000;
export const MERGE_PER_WORKER_IN = 1500;
export const REPORT_OUT = 3000;
export const CITE_BASE_IN = 3000;
export const CITE_PER_SOURCE_IN = 1500;
export const CITE_OUT = 1500;
// ---- Illustrative assumptions (seconds) ----
export const CALL_S = 8;
export const PLAN_S = 10;
export const MERGE_S = 40;
export const CITE_S = 20;

/** Keeps the largest worker prompt (S0 + MAX_CALLS x (O + R)) under 100,000 tokens, so Haiku 5.5 stays in its low price tier. */
export const MAX_CALLS = 25;
export const MAX_WORKERS = 50;

/** The chat the lesson compares against: 4,000 tokens in and 1,000 out. */
export const CHAT_IN = 4000;
export const CHAT_OUT = 1000;

export interface RunConfig {
  workers: number;
  /** Tool calls per worker. */
  calls: number;
  lead: ModelId;
  worker: ModelId;
  cache: boolean;
}

const usd = (tokens: number, perM: number) => (tokens * perM) / 1e6;

/** Input tokens one worker sends over its whole life: k+1 model calls, each re-sending the whole context. */
export function workerInputTokens(k: number): number {
  return (k + 1) * S0 + ((O + R) * k * (k + 1)) / 2;
}
export function workerOutputTokens(k: number): number {
  return k * O + F;
}

/** Dollars for one worker's tokens (no search fees). */
export function workerTokenUsd(k: number, m: ModelId, cache: boolean): number {
  const p = PRICES[m];
  const out = usd(workerOutputTokens(k), p.out);
  if (!cache) return usd(workerInputTokens(k), p.inp) + out;
  // Call 0 writes the starting prompt to the cache. Call i reads the context of call i-1 and writes the new O + R tokens.
  let readTokens = 0;
  for (let i = 1; i <= k; i++) readTokens += S0 + (i - 1) * (O + R);
  const writeTokens = S0 + k * (O + R);
  return usd(readTokens, p.cacheRead) + usd(writeTokens, p.cacheWrite) + out;
}

export function sourcesCited(totalCalls: number): number {
  return Math.ceil(totalCalls / 2);
}

export interface RunResult {
  workerUsd: number;
  searchUsd: number;
  leadUsd: number;
  citeUsd: number;
  totalUsd: number;
  tokens: number;
  /** tokens / (CHAT_IN + CHAT_OUT) */
  chatMultiple: number;
  /** USD of the chat answered by the worker model, same prices. */
  chatUsd: number;
  searches: number;
  /** Wall-clock with workers in parallel. */
  parallelS: number;
  /** One agent making the same calls in a row, no lead. */
  serialS: number;
}

export function runCost(c: RunConfig): RunResult {
  const n = c.workers;
  const k = c.calls;
  const wp = PRICES[c.worker];
  const lp = PRICES[c.lead];
  const searches = n * k;
  const workerUsd = n * workerTokenUsd(k, c.worker, c.cache);
  const searchUsd = searches * SEARCH_USD;
  let leadUsd = 0;
  let leadTokens = 0;
  if (n >= 2) {
    const mergeIn = MERGE_BASE_IN + MERGE_PER_WORKER_IN * n;
    leadUsd = usd(LEAD_PLAN_IN, lp.inp) + usd(LEAD_PLAN_OUT, lp.out) + usd(mergeIn, lp.inp) + usd(REPORT_OUT, lp.out);
    leadTokens = LEAD_PLAN_IN + LEAD_PLAN_OUT + mergeIn + REPORT_OUT;
  }
  const citeIn = CITE_BASE_IN + CITE_PER_SOURCE_IN * sourcesCited(searches);
  const citeUsd = usd(citeIn, wp.inp) + usd(CITE_OUT, wp.out);
  const tokens = n * (workerInputTokens(k) + workerOutputTokens(k)) + leadTokens + citeIn + CITE_OUT;
  const parallelS = (k + 1) * CALL_S + (n >= 2 ? PLAN_S + MERGE_S : 0) + CITE_S;
  const serialS = n * (k + 1) * CALL_S + CITE_S;
  return {
    workerUsd,
    searchUsd,
    leadUsd,
    citeUsd,
    totalUsd: workerUsd + searchUsd + leadUsd + citeUsd,
    tokens,
    chatMultiple: tokens / (CHAT_IN + CHAT_OUT),
    chatUsd: usd(CHAT_IN, wp.inp) + usd(CHAT_OUT, wp.out),
    searches,
    parallelS,
    serialS,
  };
}

export interface EffortRow {
  id: 'simple' | 'compare' | 'complex';
  label: string;
  /** Rule from the Anthropic post (workers) and the default we price. */
  workers: number;
  calls: number;
  /** Quoted band for subagents. hi = Infinity for "more than 10". */
  workersBand: [number, number];
  /** Quoted band for calls per subagent, or null where the post gives none. */
  callsBand: [number, number] | null;
  rule: string;
}

export const EFFORT_ROWS: EffortRow[] = [
  { id: 'simple', label: 'Simple fact-finding', workers: 1, calls: 6, workersBand: [1, 1], callsBand: [3, 10], rule: '1 agent, 3-10 tool calls' },
  { id: 'compare', label: 'Direct comparison', workers: 3, calls: 12, workersBand: [2, 4], callsBand: [10, 15], rule: '2-4 subagents, 10-15 calls each' },
  { id: 'complex', label: 'Complex research', workers: 12, calls: 15, workersBand: [11, Infinity], callsBand: null, rule: 'more than 10 subagents, divided responsibilities' },
];

/** Is the setting inside the quoted band of the row? Calls are only checked where the post gives a band. */
export function inBand(row: EffortRow, workers: number, calls: number): boolean {
  const okW = workers >= row.workersBand[0] && workers <= row.workersBand[1];
  const okC = row.callsBand ? calls >= row.callsBand[0] && calls <= row.callsBand[1] : true;
  return okW && okC;
}

/** Marginal dollars of one more worker with k calls (same lead, merge grows by MERGE_PER_WORKER_IN). */
export function marginalWorkerUsd(c: RunConfig): number {
  return runCost({ ...c, workers: c.workers + 1 }).totalUsd - runCost(c).totalUsd;
}
