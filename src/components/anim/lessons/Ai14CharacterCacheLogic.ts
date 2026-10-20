/**
 * Inter-turn cache simulator for lesson A14.1. Pure and deterministic (seeded generator).
 *
 * What Character.AI publishes (2024-06-20): KV values of every prefilled prefix and generated message are cached on
 * host memory; entries sit in an LRU cache with a tree structure, indexed by a rolling hash of prefix tokens; a new
 * query takes the longest matching prefix; sticky sessions send a dialogue to the same server; the system "achieves a
 * 95% cache rate". Not published: how "cache rate" is counted, the model, the size of a message, the server count.
 *
 * ILLUSTRATIVE ASSUMPTIONS, not measurements:
 *  - 8 servers. Each keeps `slots` dialogues in an LRU cache. One slot is one dialogue, whatever its length.
 *  - `dialogues` dialogues are open. Each turn picks one uniformly at random (the hardest case for an LRU cache).
 *  - History starts between 20 and 340 messages (mean 180, the post's average). A message is 50 tokens. A turn adds
 *    a 50-token user message and a 50-token reply. The reply is cached when it is generated, so the next turn only
 *    has to prefill the new user message.
 *  - An "edit" turn rewinds to a random point of the cached history (regenerate or edit an old message). The cache
 *    supplies the prefix before that point. This is the partial match the rolling hash allows.
 *  - "Sticky" sends a turn to the dialogue's home server (id modulo 8). `stickyShare` is the share of turns that obey
 *    that rule; the rest go to a random server (a deploy, a failure, a rebalance).
 *  - "Spread" sends every turn to a random server. Stale copies on other servers still give partial matches.
 *  - "Cache rate" here = prompt tokens taken from cache / prompt tokens. This is our definition.
 */
export const SERVERS = 8;
export const MSG_TOKENS = 50;
export const TURN_TOKENS = 2 * MSG_TOKENS;
export const TURNS_TOTAL = 60_000;
export const TURNS_WARM = 30_000;

export interface CacheParams {
  dialogues: number;
  slots: number;
  /** 0 to 1: share of turns that follow the sticky rule. */
  stickyShare: number;
  /** 0 to 1: share of turns that rewind to an earlier point. */
  editShare: number;
}

export interface CacheResult {
  /** Prompt tokens served from cache / prompt tokens. */
  cacheRate: number;
  /** Share of turns that reuse every cached token, with no miss and no rewind. */
  fullHitTurns: number;
  /** Mean tokens prefilled per turn. */
  prefillPerTurn: number;
  /** Mean prompt tokens per turn. */
  promptPerTurn: number;
  /** Prefill work relative to a service with no cache (1 = no saving). */
  workVsNoCache: number;
}

export type Router = 'spread' | 'sticky';

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

export function simulate(router: Router, p: CacheParams, seed = 7): CacheResult {
  const rand = rng(seed);
  const len: number[] = [];
  for (let d = 0; d < p.dialogues; d++) len.push((20 + Math.floor(rand() * 321)) * MSG_TOKENS);
  // One Map per server keeps insertion order, so the first key is the least recently used.
  const caches: Map<number, number>[] = Array.from({ length: SERVERS }, () => new Map());
  let prompt = 0;
  let reused = 0;
  let full = 0;
  let counted = 0;
  for (let t = 0; t < TURNS_TOTAL; t++) {
    const d = Math.floor(rand() * p.dialogues);
    const home = d % SERVERS;
    const s = router === 'sticky' && rand() < p.stickyShare ? home : Math.floor(rand() * SERVERS);
    const history = len[d];
    const promptTokens = history + MSG_TOKENS;
    const cache = caches[s];
    let have = cache.get(d) ?? 0;
    const edited = rand() < p.editShare;
    const reuse = edited ? Math.floor(rand() * (have + 1)) : have;
    if (t >= TURNS_WARM) {
      prompt += promptTokens;
      reused += reuse;
      counted++;
      if (!edited && have >= history) full++;
    }
    have = history + TURN_TOKENS;
    len[d] = history + TURN_TOKENS;
    cache.delete(d);
    cache.set(d, have);
    if (cache.size > p.slots) cache.delete(cache.keys().next().value as number);
  }
  const prefill = (prompt - reused) / counted;
  return {
    cacheRate: reused / prompt,
    fullHitTurns: full / counted,
    prefillPerTurn: prefill,
    promptPerTurn: prompt / counted,
    workVsNoCache: (prompt - reused) / prompt,
  };
}
