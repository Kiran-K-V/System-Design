/** Prompt-saving arithmetic for lesson A11.1. Pure functions. Input tokens only. */

export interface Price {
  id: string;
  label: string;
  /** USD per million input tokens, list price. */
  input: number;
  /** USD per million tokens on a prompt-cache hit. */
  cacheHit: number;
}

/** Claude API list prices, as of 2026-10-16, https://platform.claude.com/docs/en/about-claude/pricing. Haiku 5.5 is the up-to-100K-token price. */
export const PRICES: Price[] = [
  { id: 'haiku', label: 'Haiku 5.5 ($0.10 in)', input: 0.1, cacheHit: 0.01 },
  { id: 'sonnet', label: 'Sonnet 5.5 ($2 in)', input: 2, cacheHit: 0.1 },
  { id: 'opus', label: 'Opus 5.5 ($4 in)', input: 4, cacheHit: 0.2 },
];

/** USD per million tokens when a share of the tokens hit the prompt cache. Cache-write cost is ignored. */
export const effectivePrice = (p: Price, hitShare: number) => hitShare * p.cacheHit + (1 - hitShare) * p.input;

export interface Inputs {
  reqPerDay: number;
  tokensBefore: number;
  tokensAfter: number;
  price: Price;
  hitShare: number;
  /** Price multiplier for serving the tuned model. 1 means the same price as the base model. */
  premium: number;
  oneTimeUsd: number;
}

export function breakEven(i: Inputs) {
  const eff = effectivePrice(i.price, i.hitShare);
  const before = (i.tokensBefore * eff) / 1e6;
  const after = (i.tokensAfter * eff * i.premium) / 1e6;
  const savePerReq = before - after;
  const savePerDay = savePerReq * i.reqPerDay;
  const days = savePerDay > 0 ? i.oneTimeUsd / savePerDay : Infinity;
  return { eff, before, after, savePerReq, savePerDay, days };
}
