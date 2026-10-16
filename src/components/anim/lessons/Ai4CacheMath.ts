/** Cache-layout math. Prices: Claude Sonnet 5.5, USD per million tokens, as of 2026-10-16 (platform.claude.com/docs/en/about-claude/pricing). */
export const PRICE = { base: 2, write: 2.5, read: 0.1 } as const;
/** Minimum cacheable prompt on Sonnet 5.5 (prompt-caching docs). Shorter prompts are processed without caching, with no error. */
export const MIN_CACHEABLE = 512;

export type CacheState = 'write' | 'hit' | 'new';

/** Dollars for a list of (tokens, state) rows. write = 1.25x, hit = 0.05x (on Sonnet 5.5), new = base input price. */
export function rowsCost(rows: { tokens: number; state: CacheState }[]): number {
  const per = { write: PRICE.write, hit: PRICE.read, new: PRICE.base };
  return rows.reduce((s, r) => s + (r.tokens * per[r.state]) / 1e6, 0);
}

export interface LintBlock {
  id: string;
  label: string;
  tokens: number;
  /** true: identical on every request. false: differs between requests (time, user, question). */
  stable: boolean;
  note: string;
}

export const LINT_BLOCKS: LintBlock[] = [
  { id: 'tools', label: 'Tool definitions', tokens: 1500, stable: true, note: 'same on every request' },
  { id: 'system', label: 'System rules', tokens: 500, stable: true, note: 'same on every request' },
  { id: 'time', label: 'Current time', tokens: 20, stable: false, note: 'changes every request' },
  { id: 'examples', label: 'Few-shot examples', tokens: 3000, stable: true, note: 'same on every request' },
  { id: 'doc', label: 'Reference document', tokens: 145000, stable: true, note: 'same on every request' },
  { id: 'profile', label: 'User profile', tokens: 300, stable: false, note: 'changes per user' },
  { id: 'question', label: 'User question', tokens: 180, stable: false, note: 'changes every request' },
];

/** Tokens before the first block that differs between requests. Below the minimum, nothing is cached. */
export function cachedPrefix(order: LintBlock[]): number {
  let n = 0;
  for (const b of order) {
    if (!b.stable) break;
    n += b.tokens;
  }
  return n >= MIN_CACHEABLE ? n : 0;
}

/** Steady-state cost of one request: the cached prefix is read at the hit price, the rest pays base price. Cache writes and TTL expiry are not modeled. */
export function lintCost(order: LintBlock[]) {
  const total = order.reduce((s, b) => s + b.tokens, 0);
  const hit = cachedPrefix(order);
  const cost = (hit * PRICE.read + (total - hit) * PRICE.base) / 1e6;
  const uncached = (total * PRICE.base) / 1e6;
  return { total, hit, cost, uncached, hitShare: hit / total };
}

/** The 20-question example: n requests over the same prefix of `doc` tokens, input tokens only. */
export function questionsCost(doc: number, n: number) {
  const uncached = (n * doc * PRICE.base) / 1e6;
  const cached = (doc * PRICE.write) / 1e6 + ((n - 1) * doc * PRICE.read) / 1e6;
  return { uncached, cached };
}
