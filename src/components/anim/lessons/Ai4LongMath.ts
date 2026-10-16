/** Long-document strategy cost model. Prices: Claude Sonnet 5.5, USD per million tokens, as of 2026-10-16. */
export const P = { inp: 2, out: 10, write: 2.5, read: 0.1 } as const;
/** Context window of Sonnet 5.5 at standard price (pricing page: 4.6 and later models include the full 1M window, Haiku 5.5 excepted). */
export const WINDOW = 1_000_000;
/** Our assumptions, not provider numbers. */
export const A = { chunk: 5000, prompt: 200, mapOut: 300, q: 100, ans: 300, tocPerChunk: 50, routeRead: 3, ragChunk: 500, ragTop: 5, tpotMs: 20 } as const;

export type Strategy = 'stuff' | 'mapreduce' | 'route' | 'retrieve';
export type Kind = 'lookup' | 'multi' | 'whole';

export interface Cost {
  feasible: boolean;
  /** One-time cost before the first question (index building). */
  setup: number;
  /** Total for n questions, including setup. */
  total: number;
  /** Sequential model calls on the critical path for one question. */
  rounds: number;
  /** Seconds spent decoding output on that path at tpotMs, parallel calls counted once. Prefill is not modeled. */
  decodeS: number;
}

const usd = (inTok: number, outTok: number) => (inTok * P.inp + outTok * P.out) / 1e6;
const qa = usd(A.q, A.ans);
const sec = (tok: number) => (tok * A.tpotMs) / 1000;

export function chunks(doc: number) {
  return Math.ceil(doc / A.chunk);
}

export function strategyCost(s: Strategy, doc: number, n: number): Cost {
  const k = chunks(doc);
  if (s === 'stuff') {
    const feasible = doc + A.q + A.ans <= WINDOW;
    const uncached = n * usd(doc, 0);
    const cached = (doc * P.write + (n - 1) * doc * P.read) / 1e6;
    return { feasible, setup: 0, total: Math.min(uncached, cached) + n * qa, rounds: 1, decodeS: sec(A.ans) };
  }
  if (s === 'mapreduce') {
    const map = k * usd(A.chunk + A.prompt, A.mapOut);
    const reduce = usd(k * A.mapOut + A.prompt, A.ans);
    return { feasible: k * A.mapOut + A.prompt + A.ans <= WINDOW, setup: 0, total: n * (map + reduce), rounds: 2, decodeS: sec(A.mapOut) + sec(A.ans) };
  }
  if (s === 'route') {
    const setup = k * usd(A.chunk + A.prompt, A.tocPerChunk);
    const router = usd(k * A.tocPerChunk + A.prompt, A.q);
    const read = usd(A.routeRead * A.chunk + A.prompt, A.ans);
    return { feasible: true, setup, total: setup + n * (router + read), rounds: 2, decodeS: sec(A.q) + sec(A.ans) };
  }
  const read = usd(A.ragTop * A.ragChunk + A.prompt, A.ans);
  return { feasible: true, setup: 0, total: n * read, rounds: 1, decodeS: sec(A.ans) };
}

/** Rule of thumb, not a measured result. Whole-document questions need every part, so retrieval would miss parts. */
export function recommend(kind: Kind, doc: number, n: number): { s: Strategy; why: string } {
  if (kind === 'whole') {
    return doc + A.q + A.ans <= WINDOW
      ? { s: 'stuff', why: 'The question needs the whole text and it fits in the window. Put it all in, and cache it.' }
      : { s: 'mapreduce', why: 'The question needs the whole text and it does not fit. Summarize parts, then merge.' };
  }
  if (doc <= 30_000) return { s: 'stuff', why: 'The document is short. Put it all in; the extra cost is small.' };
  if (kind === 'lookup') return { s: 'retrieve', why: 'One fact lives in one place. Fetch the best chunks (module A5).' };
  return n >= 5
    ? { s: 'retrieve', why: 'A few scattered passages, many questions. An index pays off (module A5).' }
    : { s: 'route', why: 'A few scattered passages, few questions. A cheap routing call picks chunks without building an index.' };
}
