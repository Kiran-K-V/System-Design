/**
 * Routing simulator for lesson A13.2. Pure and deterministic: a seeded generator makes the same arrivals every run.
 *
 * Three routers see the same stream of chat turns:
 *   rr     round-robin, ignores the chat
 *   sticky session affinity: chat id modulo replicas
 *   cost   our sketch of cache-and-load-aware routing: send the turn to the replica with the lowest
 *          (prefill time given what that replica has cached) + (queue wait there)
 *
 * ILLUSTRATIVE ASSUMPTIONS, not measurements:
 *  - 4 replicas, each one 8-card Llama 3.1 70B replica (arithmetic in Ai13ChatMath.ts, 40% of peak).
 *  - 400 chats. Start length is log-normal (median 3,000 tokens, spread 0.9, cap 32,000). A turn adds 100 user tokens
 *    and 200 answer tokens, so the history grows by 300 tokens per turn.
 *  - Each replica keeps the KV of `slots` chats and drops the least recently used one when full. One slot is one chat,
 *    whatever its length (a simplification).
 *  - A replica is one first-in-first-out server. A turn costs its prefill time plus a fixed 60 ms of decode share.
 *  - The hot chats are 8 chats whose ids all hash to replica 0 (an unlucky case, chosen on purpose).
 *  - Arrivals are Poisson. The first 60 s of 180 s warm the caches and are not counted.
 */
import { prefillSeconds } from './Ai13ChatMath';

export const REPLICAS = 4;
export const CHATS = 400;
export const HOT = 8;
export const USER_TOK = 100;
export const ANSWER_TOK = 200;
export const DECODE_SHARE = 0.06;
export const SIM_SECONDS = 180;
export const WARM_SECONDS = 60;
export const LONG_CTX = 8000;
export const MAX_LEN = 32000;

export type Policy = 'rr' | 'sticky' | 'cost';
export const POLICIES: Policy[] = ['rr', 'sticky', 'cost'];

export interface SimParams {
  /** Share of turns that come from the 8 hot chats (0 to 0.8). */
  skew: number;
  /** Turns per second across the fleet. */
  rate: number;
  /** Chats of KV each replica can hold. */
  slots: number;
}

export interface PolicyResult {
  /** Share of prompt tokens served from cached KV. */
  hitRate: number;
  meanTtft: number;
  p95Ttft: number;
  /** P95 TTFT for turns whose prompt is over 8,000 tokens. NaN when there are none. */
  p95TtftLong: number;
  /** Busy share of the busiest replica over the counted window. 1 means saturated. */
  hotUtil: number;
  /** P95 queue wait on the busiest replica, seconds. */
  hotWait: number;
  /** Share of counted turns each replica served. */
  share: number[];
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(r: () => number) {
  const u = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

const quantile = (xs: number[], q: number) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

interface Turn {
  t: number;
  chat: number;
}

/** The arrival stream depends on skew and rate only, so every router sees the same turns. */
export function arrivals(skew: number, rate: number): { turns: Turn[]; startLen: number[] } {
  const r = rng(20261019);
  const startLen = Array.from({ length: CHATS }, () =>
    Math.min(MAX_LEN, Math.max(300, Math.round(3000 * Math.exp(0.9 * normal(r)) / 50) * 50)),
  );
  const turns: Turn[] = [];
  let t = 0;
  for (;;) {
    t += -Math.log(Math.max(r(), 1e-12)) / rate;
    if (t >= SIM_SECONDS) break;
    const hot = r() < skew;
    const chat = hot ? Math.floor(r() * HOT) * REPLICAS : Math.floor(r() * CHATS);
    turns.push({ t, chat });
  }
  return { turns, startLen };
}

export function runPolicy(policy: Policy, p: SimParams, input = arrivals(p.skew, p.rate)): PolicyResult {
  const len = [...input.startLen];
  const caches: Map<number, number>[] = Array.from({ length: REPLICAS }, () => new Map());
  const free = new Array(REPLICAS).fill(0);
  const busy = new Array(REPLICAS).fill(0);
  const waits: number[][] = Array.from({ length: REPLICAS }, () => []);
  const served = new Array(REPLICAS).fill(0);
  const ttfts: number[] = [];
  const ttftsLong: number[] = [];
  let reused = 0;
  let total = 0;
  let rrNext = 0;

  input.turns.forEach(({ t, chat }) => {
    const ctx = len[chat] + USER_TOK;
    const newTok = (r: number) => ctx - Math.min(len[chat], caches[r].get(chat) ?? 0);
    let r: number;
    if (policy === 'rr') {
      r = rrNext++ % REPLICAS;
    } else if (policy === 'sticky') {
      r = chat % REPLICAS;
    } else {
      r = chat % REPLICAS;
      let best = Infinity;
      for (let k = 0; k < REPLICAS; k++) {
        const c = prefillSeconds(newTok(k), ctx) + Math.max(0, free[k] - t);
        if (c < best - 1e-9) {
          best = c;
          r = k;
        }
      }
    }
    const nt = newTok(r);
    const pre = prefillSeconds(nt, ctx);
    const start = Math.max(t, free[r]);
    const wait = start - t;
    free[r] = start + pre + DECODE_SHARE;
    // LRU: remove then set, so the chat moves to the newest position.
    caches[r].delete(chat);
    len[chat] = Math.min(MAX_LEN, len[chat] + USER_TOK + ANSWER_TOK);
    caches[r].set(chat, len[chat]);
    if (caches[r].size > p.slots) caches[r].delete(caches[r].keys().next().value as number);
    if (t >= WARM_SECONDS) {
      const ttft = wait + pre;
      ttfts.push(ttft);
      if (ctx > LONG_CTX) ttftsLong.push(ttft);
      reused += ctx - nt;
      total += ctx;
      busy[r] += pre + DECODE_SHARE;
      waits[r].push(wait);
      served[r]++;
    }
  });

  const window = SIM_SECONDS - WARM_SECONDS;
  const hotR = busy.indexOf(Math.max(...busy));
  const n = ttfts.length || 1;
  return {
    hitRate: total ? reused / total : 0,
    meanTtft: ttfts.reduce((a, b) => a + b, 0) / n,
    p95Ttft: quantile(ttfts, 0.95),
    p95TtftLong: quantile(ttftsLong, 0.95),
    hotUtil: busy[hotR] / window,
    hotWait: quantile(waits[hotR], 0.95),
    share: served.map((s) => s / n),
  };
}

export function runAll(p: SimParams): Record<Policy, PolicyResult> {
  const input = arrivals(p.skew, p.rate);
  return { rr: runPolicy('rr', p, input), sticky: runPolicy('sticky', p, input), cost: runPolicy('cost', p, input) };
}
