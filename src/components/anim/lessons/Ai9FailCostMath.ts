/** Prices: platform.claude.com/docs/en/about-claude/pricing, as of 2026-10-16. USD per million tokens.
 *  Minimums: platform.claude.com/docs/en/build-with-claude/prompt-caching, as of 2026-10-16.
 *  Haiku 5.5 uses the tier for prompts up to 100,000 tokens. */
export interface Model {
  id: string;
  name: string;
  input: number;
  /** 5-minute cache write. */
  write: number;
  /** Cache hit. */
  hit: number;
  output: number;
  /** Shortest prefix, in tokens, that the provider will cache. */
  min: number;
}

export const MODELS: Model[] = [
  { id: 'sonnet55', name: 'Sonnet 5.5', input: 2, write: 2.5, hit: 0.1, output: 10, min: 512 },
  { id: 'sonnet46', name: 'Sonnet 4.6', input: 3, write: 3.75, hit: 0.3, output: 15, min: 1024 },
  { id: 'haiku55', name: 'Haiku 5.5', input: 0.1, write: 0.125, hit: 0.01, output: 0.5, min: 512 },
  { id: 'haiku45', name: 'Haiku 4.5', input: 1, write: 1.25, hit: 0.1, output: 5, min: 4096 },
];

export type CacheState = 'hit' | 'write';

export interface Cost {
  /** True when the prefix is long enough to be cached. A short prefix is processed at the full price, with no error. */
  cached: boolean;
  usd: number;
}

/** Cost of one request. `state` says whether the cached prefix is already stored (hit) or is being stored now (write). */
export function perRequest(m: Model, prefix: number, user: number, out: number, state: CacheState): Cost {
  const cached = prefix >= m.min;
  const prefixRate = !cached ? m.input : state === 'hit' ? m.hit : m.write;
  return { cached, usd: (prefix * prefixRate + user * m.input + out * m.output) / 1e6 };
}
