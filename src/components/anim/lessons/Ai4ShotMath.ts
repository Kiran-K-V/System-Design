/** Cost of few-shot examples for lesson A4.2. Prices: Claude Sonnet 5.5, USD per 1M input tokens, as of 2026-10-16 (platform.claude.com/docs/en/about-claude/pricing). */
export const PRICE = { input: 2, write5m: 2.5, read: 0.1 };

export type Mode = 'fixed-uncached' | 'fixed-cached' | 'dynamic';

export interface ShotCost {
  /** Extra input tokens in every call. */
  tokensPerCall: number;
  /** Extra input cost per call, USD. */
  perCall: number;
  perDay: number;
}

/**
 * Fixed set, no cache: every call pays full input price.
 * Fixed set, cached: a fraction `hit` of calls read the prefix at the read price; the others write it at the write price.
 * Dynamic set: examples differ per query, so they cannot sit in a shared prefix. Full input price.
 */
export function shotCost(k: number, tokPerShot: number, callsPerDay: number, mode: Mode, hit: number): ShotCost {
  const tokensPerCall = k * tokPerShot;
  const m = tokensPerCall / 1e6;
  const perCall = mode === 'fixed-cached' ? m * (hit * PRICE.read + (1 - hit) * PRICE.write5m) : m * PRICE.input;
  return { tokensPerCall, perCall, perDay: perCall * callsPerDay };
}
