/** Logic for the A9.2 cost lesson. Prices: platform.claude.com pricing page, USD per million tokens, as of 2026-10-16. */

export type ModelId = 'haiku' | 'sonnet' | 'opus' | 'fable';

export interface ModelPrice {
  id: ModelId;
  name: string;
  input: number;
  output: number;
  /** Cache read price. */
  read: number;
  /** 5-minute cache write price. */
  write: number;
}

/** Haiku 5.5 uses the tier for prompts of 100,000 tokens or less. */
export const PRICES: Record<ModelId, ModelPrice> = {
  haiku: { id: 'haiku', name: 'Haiku 5.5', input: 0.1, output: 0.5, read: 0.01, write: 0.125 },
  sonnet: { id: 'sonnet', name: 'Sonnet 5.5', input: 2, output: 10, read: 0.1, write: 2.5 },
  opus: { id: 'opus', name: 'Opus 5.5', input: 4, output: 20, read: 0.2, write: 5 },
  fable: { id: 'fable', name: 'Fable 5.1', input: 10, output: 50, read: 0.25, write: 12.5 },
};

/** Batch API: 50% off input and output. Cache multipliers stack with it. */
export const BATCH_FACTOR = 0.5;

export interface Load {
  requests: number;
  inTok: number;
  outTok: number;
  /** Share of input tokens read from cache, 0 to 1. */
  hit: number;
  /** Share of requests run through the Batch API, 0 to 1. */
  batchShare: number;
}

/** Dollars for one request at standard prices. Cache writes are ignored. */
export function perRequest(m: ModelPrice, inTok: number, outTok: number, hit: number): number {
  const cached = inTok * hit;
  return ((inTok - cached) * m.input + cached * m.read + outTok * m.output) / 1e6;
}

/** Dollars per month for a load on one model. */
export function monthly(m: ModelPrice, l: Load): number {
  const per = perRequest(m, l.inTok, l.outTok, l.hit);
  return l.requests * per * (1 - (1 - BATCH_FACTOR) * l.batchShare);
}

/** Extra dollars per month when the cached prefix is rewritten every 5 minutes (30-day month). */
export function writeOverhead(m: ModelPrice, cachedTokens: number): number {
  const writesPerMonth = 30 * 24 * 12;
  return (writesPerMonth * cachedTokens * m.write) / 1e6;
}

export interface Stage {
  label: string;
  total: number;
  detail: string;
}

export const BASE: Load = { requests: 5_000_000, inTok: 3000, outTok: 500, hit: 0, batchShare: 0 };

/** The lever stack used in the lesson. The batch share and the routed share are illustrative. */
export function waterfall(): Stage[] {
  const out: Stage[] = [];
  const opus = monthly(PRICES.opus, BASE);
  out.push({ label: 'Opus 5.5, no levers', total: opus, detail: 'list price' });
  const sonnet = monthly(PRICES.sonnet, BASE);
  out.push({ label: 'Smaller model: Sonnet 5.5', total: sonnet, detail: 'same quality bar on the eval set' });
  const cached: Load = { ...BASE, hit: 0.8 };
  out.push({ label: 'Cache 80% of input', total: monthly(PRICES.sonnet, cached), detail: '2,400 of 3,000 tokens read at $0.10' });
  const short: Load = { ...cached, outTok: 300 };
  out.push({ label: 'Output 500 to 300 tokens', total: monthly(PRICES.sonnet, short), detail: 'tighter answers' });
  const batched: Load = { ...short, batchShare: 0.3 };
  out.push({ label: 'Batch the 30% nobody waits for', total: monthly(PRICES.sonnet, batched), detail: 'half price on that share' });
  const routed = 0.5 * monthly(PRICES.sonnet, batched) + 0.5 * monthly(PRICES.haiku, batched);
  out.push({ label: 'Route half to Haiku 5.5', total: routed, detail: 'only if Haiku passes the eval on those requests' });
  return out;
}

export interface Candidate {
  id: ModelId;
  pass: number;
  perReq: number;
  perSuccess: number;
  eligible: boolean;
  dominated: boolean;
  best: boolean;
}

/** Cost per successful task = cost per attempt / pass rate, when a failed attempt is retried until one passes. */
export function candidates(pass: Record<'haiku' | 'sonnet' | 'opus', number>, bar: number, inTok: number, outTok: number, hit: number): Candidate[] {
  const ids: ('haiku' | 'sonnet' | 'opus')[] = ['haiku', 'sonnet', 'opus'];
  const rows = ids.map((id) => {
    const perReq = perRequest(PRICES[id], inTok, outTok, hit);
    return { id, pass: pass[id], perReq, perSuccess: pass[id] > 0 ? perReq / pass[id] : Infinity };
  });
  const dominated = (r: (typeof rows)[number]) =>
    rows.some((o) => o !== r && o.perSuccess <= r.perSuccess && o.pass >= r.pass && (o.perSuccess < r.perSuccess || o.pass > r.pass));
  const eligible = rows.filter((r) => r.pass >= bar);
  const bestId = eligible.length ? eligible.reduce((a, b) => (b.perSuccess < a.perSuccess ? b : a)).id : null;
  return rows.map((r) => ({ ...r, eligible: r.pass >= bar, dominated: dominated(r), best: r.id === bestId }));
}
