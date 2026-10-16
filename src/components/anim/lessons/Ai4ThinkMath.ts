/** Thinking-token latency and cost. Output prices in USD per million tokens, as of 2026-10-16 (platform.claude.com/docs/en/about-claude/pricing). */
export const OUT_PRICE = { sonnet: 10, haiku: 0.5, opus: 20 } as const;
export type ModelKey = keyof typeof OUT_PRICE;
/** Assumed decode speed. Our assumption: 20 ms per output token (50 tokens per second). Real speed varies by model and load. */
export const TPOT_MS = 20;

/** Seconds to decode n tokens. */
export const decodeSeconds = (n: number, tpotMs = TPOT_MS) => (n * tpotMs) / 1000;
/** Dollars for n output tokens (thinking tokens bill as output). */
export const outputCost = (n: number, pricePerM: number) => (n * pricePerM) / 1e6;

/** ILLUSTRATIVE accuracy curve: a saturating shape with made-up constants. Not data. */
export const ILLUS = { floor: 40, ceil: 85, tau: 4000 } as const;
export const illusAccuracy = (think: number) => ILLUS.floor + (ILLUS.ceil - ILLUS.floor) * (1 - Math.exp(-think / ILLUS.tau));
/** Tokens where the curve has covered 90% of its possible gain: tau * ln(10). */
export const illusKnee = () => ILLUS.tau * Math.log(10);
