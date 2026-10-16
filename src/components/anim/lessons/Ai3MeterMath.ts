/** Cost metering math. Prices: claude.com/pricing, USD per 1M tokens, as of 2026-10-16. */
export interface Price {
  id: 'opus' | 'sonnet' | 'haiku';
  name: string;
  input: number;
  output: number;
  /** 5-minute cache write. */
  cacheWrite: number;
  cacheRead: number;
}

/** Haiku 5.5 uses the tier for prompts of 100K tokens or less. */
export const PRICES: Price[] = [
  { id: 'opus', name: 'Opus 5.5', input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  { id: 'sonnet', name: 'Sonnet 5.5', input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.1 },
  { id: 'haiku', name: 'Haiku 5.5', input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
];

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

export interface Lines {
  input: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
  total: number;
}

export function lineCosts(u: Usage, p: Price): Lines {
  const input = (u.input_tokens * p.input) / 1e6;
  const cacheWrite = (u.cache_creation_input_tokens * p.cacheWrite) / 1e6;
  const cacheRead = (u.cache_read_input_tokens * p.cacheRead) / 1e6;
  const output = (u.output_tokens * p.output) / 1e6;
  return { input, cacheWrite, cacheRead, output, total: input + cacheWrite + cacheRead + output };
}

/** Steady state: a share `hit` of the prompt is read from cache, the rest is plain input. Cache writes are ignored. */
export function steadyCost(inTok: number, outTok: number, hit: number, p: Price): number {
  const cached = Math.round(inTok * hit);
  return lineCosts({ input_tokens: inTok - cached, output_tokens: outTok, cache_creation_input_tokens: 0, cache_read_input_tokens: cached }, p).total;
}

export const DAYS = 30;
export const monthly = (reqPerDay: number, perRequest: number) => reqPerDay * DAYS * perRequest;

export type Status = 'ok' | 'warn' | 'over';
export function status(spend: number, budget: number, alertAt: number): Status {
  if (spend > budget) return 'over';
  return spend >= budget * alertAt ? 'warn' : 'ok';
}
