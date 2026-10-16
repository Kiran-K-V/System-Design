/** Prompt-caching arithmetic for lesson A2.5. Prices: USD per 1M input tokens, as of 2026-10-16. Pure functions. */

export interface CacheModel {
  id: string;
  provider: 'Anthropic' | 'OpenAI' | 'Google';
  name: string;
  /** Base (uncached) input price. */
  input: number;
  /** Price of a cache read (hit). */
  read: number;
  /** Write multiplier for a 5-minute (or only) entry. 1 means no extra write fee. */
  write5: number;
  /** Write multiplier for a 1-hour entry. null when the provider has no such option. */
  write1h: number | null;
}

export const CACHE_MODELS: CacheModel[] = [
  { id: 'sonnet55', provider: 'Anthropic', name: 'Sonnet 5.5', input: 2, read: 0.1, write5: 1.25, write1h: 2 },
  { id: 'haiku55', provider: 'Anthropic', name: 'Haiku 5.5 (prompt up to 100K)', input: 0.1, read: 0.01, write5: 1.25, write1h: 2 },
  { id: 'opus55', provider: 'Anthropic', name: 'Opus 5.5', input: 4, read: 0.2, write5: 1.25, write1h: 2 },
  { id: 'sonnet46', provider: 'Anthropic', name: 'Sonnet 4.6', input: 3, read: 0.3, write5: 1.25, write1h: 2 },
  { id: 'gpt6sol', provider: 'OpenAI', name: 'gpt-6-sol (write 1.25x, GPT-5.6 and later)', input: 2, read: 0.2, write5: 1.25, write1h: null },
  { id: 'gpt54mini', provider: 'OpenAI', name: 'gpt-5.4-mini (no write fee)', input: 0.75, read: 0.075, write5: 1, write1h: null },
  { id: 'gem25flash', provider: 'Google', name: 'Gemini 2.5 Flash (implicit, no storage fee)', input: 0.3, read: 0.03, write5: 1, write1h: null },
];

/** Extra fraction of the base price a write costs, over an uncached call. */
export const writeExtra = (writeMult: number) => writeMult - 1;

/** Reads needed before the cache has paid for its write. (w - 1) / (1 - r), with r the read multiplier. */
export function breakEvenReads(writeMult: number, readMult: number): number {
  if (writeMult <= 1) return 0;
  return (writeMult - 1) / (1 - readMult);
}

/** Smallest whole number of reads that makes caching cheaper. */
export const breakEvenWhole = (writeMult: number, readMult: number) => Math.ceil(breakEvenReads(writeMult, readMult) - 1e-9);

/** Dollar cost of the cached prefix over one write and k reads, against k+1 uncached calls. */
export function cycleCost(prefixTokens: number, inputPrice: number, writeMult: number, readMult: number, reads: number) {
  const unit = (prefixTokens * inputPrice) / 1e6;
  return { cached: unit * (writeMult + reads * readMult), uncached: unit * (reads + 1) };
}

/** Hit rate when each write is followed by k reads. */
export const hitRate = (reads: number) => reads / (reads + 1);
