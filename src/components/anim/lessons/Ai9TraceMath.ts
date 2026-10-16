/** Logic for the A9.1 tracing lesson. Pure functions. Run times and token counts are illustrative. */

export type SpanKind = 'agent' | 'model' | 'tool';

export interface TraceSpan {
  id: string;
  parent: string | null;
  label: string;
  kind: SpanKind;
  /** Milliseconds from the start of the run. */
  start: number;
  end: number;
  depth: number;
  /** Tokens, for model calls only. */
  tokensIn?: number;
  tokensOut?: number;
  stop?: string;
}

/** One support-bot run: search the docs, ask the model, look up the order, ask the model again. */
export const SPANS: TraceSpan[] = [
  { id: 'run', parent: null, label: 'Agent run', kind: 'agent', start: 0, end: 4300, depth: 0 },
  { id: 'docs', parent: 'run', label: 'Search docs (tool)', kind: 'tool', start: 30, end: 420, depth: 1 },
  { id: 'm1', parent: 'run', label: 'Model call 1', kind: 'model', start: 440, end: 1640, depth: 1, tokensIn: 3120, tokensOut: 210, stop: 'tool_use' },
  { id: 'order', parent: 'run', label: 'Look up order (tool)', kind: 'tool', start: 1660, end: 2260, depth: 1 },
  { id: 'm2', parent: 'run', label: 'Model call 2', kind: 'model', start: 2280, end: 4230, depth: 1, tokensIn: 4810, tokensOut: 380, stop: 'end_turn' },
];

export const ms = (s: TraceSpan) => s.end - s.start;

/** Dollar cost of one model call at a per-million-token price, with no caching. */
export function callCost(tokensIn: number, tokensOut: number, priceIn: number, priceOut: number): number {
  return (tokensIn * priceIn + tokensOut * priceOut) / 1e6;
}

/** Share of the run time spent inside model calls. */
export function modelShare(spans: TraceSpan[]): number {
  const run = spans.find((s) => s.parent === null)!;
  const model = spans.filter((s) => s.kind === 'model').reduce((a, s) => a + ms(s), 0);
  return model / ms(run);
}

export interface TokenFields {
  /** What the Anthropic response reports as input_tokens: only tokens after the last cache breakpoint. */
  wireInput: number;
  cacheRead: number;
  cacheWrite: number;
  /** What a trace should store as the input total: the sum of all three. */
  total: number;
}

/** Split a prompt of `total` tokens into the three counts the provider reports. Shares are 0 to 1. */
export function tokenFields(total: number, readShare: number, writeShare: number): TokenFields {
  const cacheRead = Math.round(total * readShare);
  const cacheWrite = Math.min(total - cacheRead, Math.round(total * writeShare));
  return { wireInput: total - cacheRead - cacheWrite, cacheRead, cacheWrite, total };
}

/** How far a dashboard that reads only the wire input field is below the true total, as a share 0 to 1. */
export function fakeDrop(f: TokenFields): number {
  return f.total === 0 ? 0 : 1 - f.wireInput / f.total;
}
