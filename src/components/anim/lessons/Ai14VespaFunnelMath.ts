/**
 * Ranking funnel and network-hop model for the Perplexity-on-Vespa lesson (A14.3). Pure functions, no imports.
 *
 * Every input is ILLUSTRATIVE. The Vespa page publishes no candidate counts, no hop counts and no milliseconds.
 * The only sourced input is the same-data-centre round trip of about 0.5 ms (backend lesson 1.5).
 *
 * Three designs of one request path:
 *  - stitched: separate stores and services (embed, vector + keyword, metadata, light ranker, GPU reranker)
 *  - engine-out: one engine retrieves, filters and light-ranks; the neural reranker is a separate service
 *  - engine-in: the neural reranker also runs inside the engine
 */

export type DesignId = 'stitched' | 'engineOut' | 'engineIn';

export interface Inputs {
  /** Candidates retrieved from the index (hybrid retrieval). */
  n0: number;
  /** Candidates that survive the light ranker and reach the neural reranker. */
  n1: number;
  /** Passages kept after the neural rerank and returned to the answer service. */
  n2: number;
  /** Neural reranker time per (query, passage) pair, in ms. */
  msPerPair: number;
  /** Pairs the reranker scores at the same time. */
  parallel: number;
  /** One network round trip, in ms. */
  rttMs: number;
}

/** Fixed illustrative constants. */
export const LIGHT_US_PER_CANDIDATE = 5;
export const RETRIEVE_MS = 10;
export const KB_PER_PASSAGE = 2;
/** A 10 Gbit/s link is 1.25 GB/s; real throughput is lower, so this favours the stitched design. */
export const LINK_GB_PER_S = 1.25;
export const P99_SLOW = 0.01;

export interface DesignShape {
  id: DesignId;
  label: string;
  /** Network round trips in a row on the critical path (parallel calls count once). */
  hops: number;
  /** Calls made, parallel ones counted separately. */
  calls: number;
}

export const SHAPES: DesignShape[] = [
  { id: 'stitched', label: 'Separate stores and services', hops: 5, calls: 6 },
  { id: 'engineOut', label: 'One engine, reranker outside', hops: 3, calls: 3 },
  { id: 'engineIn', label: 'One engine, inference inside', hops: 2, calls: 2 },
];

/** Passages that cross the network. Each candidate list crosses twice per stitched hop pair: in to the answer service, out to the next one. */
export function passagesOnWire(id: DesignId, i: Inputs): number {
  if (id === 'stitched') return 2 * i.n0 + 2 * i.n1;
  if (id === 'engineOut') return 2 * i.n1;
  return i.n2;
}

export interface Breakdown {
  id: DesignId;
  retrieveMs: number;
  lightMs: number;
  neuralMs: number;
  rttPartMs: number;
  payloadMs: number;
  networkMs: number;
  totalMs: number;
  hops: number;
  calls: number;
  megabytes: number;
  /** Chance that at least one call lands in its own slowest 1%. */
  pSlowCall: number;
}

export function lightMs(i: Inputs): number {
  return (i.n0 * LIGHT_US_PER_CANDIDATE) / 1000;
}

export function neuralMs(pairs: number, i: Inputs): number {
  return (pairs * i.msPerPair) / i.parallel;
}

export function megabytes(passages: number): number {
  return (passages * KB_PER_PASSAGE) / 1000;
}

export function payloadMs(mb: number): number {
  return (mb / 1000 / LINK_GB_PER_S) * 1000;
}

export function breakdown(id: DesignId, i: Inputs): Breakdown {
  const shape = SHAPES.find((s) => s.id === id)!;
  const mb = megabytes(passagesOnWire(id, i));
  const rttPartMs = shape.hops * i.rttMs;
  const pay = payloadMs(mb);
  const light = lightMs(i);
  const neural = neuralMs(i.n1, i);
  return {
    id,
    retrieveMs: RETRIEVE_MS,
    lightMs: light,
    neuralMs: neural,
    rttPartMs,
    payloadMs: pay,
    networkMs: rttPartMs + pay,
    totalMs: RETRIEVE_MS + light + neural + rttPartMs + pay,
    hops: shape.hops,
    calls: shape.calls,
    megabytes: mb,
    pSlowCall: 1 - Math.pow(1 - P99_SLOW, shape.calls),
  };
}

/** The same request with no funnel: the neural model scores every retrieved candidate. */
export function noFunnelMs(i: Inputs): number {
  return RETRIEVE_MS + neuralMs(i.n0, i);
}

/** Share of work left after each stage, for the funnel bars. */
export function funnelShares(i: Inputs): number[] {
  return [1, i.n1 / i.n0, i.n2 / i.n0];
}

/** Queries per second from a monthly total, for a month of the given days. */
export function qps(perMonth: number, days = 30): number {
  return perMonth / (days * 86400);
}

/** Growth after m months at a monthly rate. */
export function grow(rate: number, m: number): number {
  return Math.pow(1 + rate, m);
}
