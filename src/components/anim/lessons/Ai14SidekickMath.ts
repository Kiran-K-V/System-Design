/** Pure maths for the A14.6 Shopify Sidekick lesson. Every size and price here is illustrative, except where the lesson names a source. */

export interface Table2x2 {
  /** Human says bad, judge says bad. */
  tp: number;
  /** Human says bad, judge says ok (a miss). */
  fn: number;
  /** Human says ok, judge says bad (a false alarm). */
  fp: number;
  /** Human says ok, judge says ok. */
  tn: number;
}

/** Cohen's kappa for two raters and two labels: (observed - chance) / (1 - chance). */
export function kappaOf(t: Table2x2) {
  const n = t.tp + t.fn + t.fp + t.tn;
  const observed = (t.tp + t.tn) / n;
  const humanBad = (t.tp + t.fn) / n;
  const judgeBad = (t.tp + t.fp) / n;
  const chance = humanBad * judgeBad + (1 - humanBad) * (1 - judgeBad);
  const kappa = chance === 1 ? 0 : (observed - chance) / (1 - chance);
  return { n, observed, chance, kappa };
}

/** Tokens that N tool schemas add to ONE model call. */
export const schemaTokens = (tools: number, tokensPerSchema: number) => tools * tokensPerSchema;

/** Pairs of tools a reader must check for overlap: N choose 2. */
export const toolPairs = (tools: number) => (tools * (tools - 1)) / 2;

/** Dollar prices per million tokens, Sonnet 5.5, as of 2026-10-20 (platform.claude.com/docs/en/about-claude/pricing). */
export const PRICE = { input: 2, write5m: 2.5, read: 0.1 } as const;

/** Cost of sending a block of tokens on every call of one task. Cached: one write, then reads. */
export function repeatedBlockCost(tokens: number, calls: number) {
  const uncached = (tokens * calls * PRICE.input) / 1e6;
  const cached = (tokens * (PRICE.write5m + (calls - 1) * PRICE.read)) / 1e6;
  return { uncached, cached };
}

/** Cost of ONE request whose cached prefix is partly broken. Tokens before the break are read, tokens after it are written again. */
export function prefixCost(readTokens: number, rewriteTokens: number) {
  return (readTokens * PRICE.read + rewriteTokens * PRICE.write5m) / 1e6;
}
