/** Toy model for the memory-size simulator in lesson A6.7. Every input is an assumption set by the reader. Pure functions. */

export interface MemInput {
  /** Notes the agent writes per day. */
  writesPerDay: number;
  /** Days a note is kept before expiry. */
  retentionDays: number;
  /** Tokens per note. */
  tokensPerNote: number;
  /** Notes in the store that matter for this request. */
  relevant: number;
  /** Notes the retriever returns. */
  k: number;
  /** Assumed chance that a relevant note is among the k returned (assumption, 0 to 1). */
  recall: number;
  /** USD per 1M input tokens. */
  price: number;
}

export interface MemRow {
  tokens: number;
  /** Share of loaded notes that matter. */
  precision: number;
  /** Share of relevant notes that were loaded. */
  recall: number;
  /** USD for 1,000 requests, input tokens only. */
  per1k: number;
}

export function storeSize(i: MemInput) {
  return i.writesPerDay * i.retentionDays;
}

export function loadAll(i: MemInput): MemRow {
  const m = storeSize(i);
  const tokens = m * i.tokensPerNote;
  const rel = Math.min(i.relevant, m);
  return { tokens, precision: m === 0 ? 0 : rel / m, recall: 1, per1k: (tokens * i.price * 1000) / 1e6 };
}

export function retrieve(i: MemInput): MemRow {
  const m = storeSize(i);
  if (i.k >= m) return loadAll(i);
  const rel = Math.min(i.relevant, m);
  const found = Math.min(rel, i.k) * i.recall;
  const tokens = i.k * i.tokensPerNote;
  return { tokens, precision: found / i.k, recall: rel === 0 ? 0 : found / rel, per1k: (tokens * i.price * 1000) / 1e6 };
}
