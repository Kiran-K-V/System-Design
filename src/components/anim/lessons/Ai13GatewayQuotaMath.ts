/**
 * Quota, cost, and eval arithmetic for lesson A13.1 (LLM gateway). Pure functions.
 *
 * Prices are USD per million tokens, read from the Anthropic pricing page on 2026-10-19
 * (https://platform.claude.com/docs/en/about-claude/pricing). The traffic shape is illustrative:
 * 3,000 input tokens and 500 output tokens per request, 50 requests per second at peak.
 * The simulator is a fluid model with one-second ticks. Its assumptions are listed in the lesson.
 */

export const PRICES = {
  opus: { in: 4, out: 20 },
  sonnet: { in: 2, out: 10 },
  haiku: { in: 0.1, out: 0.5 },
  /** Haiku 5.5 price for prompts over 100,000 tokens. */
  haikuLong: { in: 0.5, out: 2.5 },
} as const;

export type Price = { in: number; out: number };

/** Dollars for one request. */
export const requestCost = (p: Price, inTok: number, outTok: number) => (inTok * p.in + outTok * p.out) / 1e6;

/** Reserve up front, refund when the call ends. */
export function reserveRefund(inTok: number, maxTokens: number, actualOut: number) {
  const reserve = inTok + maxTokens;
  const used = Math.min(actualOut, maxTokens);
  const refund = maxTokens - used;
  return { reserve, refund, charged: reserve - refund };
}

/** Cascade: every request goes to the cheap model. A share `escalate` also pays for the strong model. */
export const cascadeCost = (cheap: number, judge: number, strong: number, escalate: number) => cheap + judge + escalate * strong;

/** Router that predicts the target: no double pay. */
export const routedCost = (cheap: number, strong: number, cheapShare: number) => cheapShare * cheap + (1 - cheapShare) * strong;

/** Escalation rate at which the cascade costs the same as sending everything to the strong model. */
export const breakEvenEscalation = (cheap: number, judge: number, strong: number) => 1 - (cheap + judge) / strong;

/** Dollars per million tokens of traffic (input plus output) for a cost per request. */
export const perMillionTokens = (costPerRequest: number, tokensPerRequest: number) => (costPerRequest / tokensPerRequest) * 1e6;

/** Eval cost of one release: cases x runs x (judge cost + optional candidate cost), with a batch discount. */
export const evalReleaseCost = (cases: number, runs: number, judgeCost: number, candidateCost = 0, discount = 1) =>
  cases * runs * (judgeCost + candidateCost) * discount;

/** 95% margin of error, in points of pass rate, for n cases at pass rate p. */
export const passRateMargin = (p: number, n: number) => 1.96 * Math.sqrt((p * (1 - p)) / n);

// ---------------------------------------------------------------------------------------------
// Quota simulator
// ---------------------------------------------------------------------------------------------

export type Policy = 'shared' | 'quota' | 'fair';

export interface Team {
  id: 'A' | 'B' | 'C';
  name: string;
  /** Guaranteed tokens per second (input plus output). */
  g: number;
  /** Baseline demand, requests per second. */
  base: number;
}

export const IN_TOK = 3000;
export const OUT_TOK = 500;
/** Seconds a request holds its reservation (time to finish streaming the answer). */
export const HOLD = 8;
/** The surge window, in seconds from the start. */
export const SURGE_FROM = 20;
export const SURGE_TO = 50;
export const T_END = 80;

/** 25, 15, and 10 requests per second of 3,500 tokens: 50 requests per second in all. */
export const TEAMS: Team[] = [
  { id: 'A', name: 'Checkout assistant', g: 87500, base: 20 },
  { id: 'B', name: 'Batch summaries', g: 52500, base: 10 },
  { id: 'C', name: 'Support bot', g: 35000, base: 8 },
];

export interface SimParams {
  policy: Policy;
  /** Multiplier on team B's demand during the surge window. */
  surge: number;
  /** Bucket depth, in seconds of a team's guaranteed rate. */
  depth: number;
  /** The max_tokens value each request reserves. */
  maxTokens: number;
}

export interface SimResult {
  /** served[team][t] in requests per second. */
  served: number[][];
  demand: number[][];
  /** Totals over the whole run. */
  totals: TeamTotal[];
  /** Totals over the surge window only. */
  surgeTotals: TeamTotal[];
}

export interface TeamTotal {
  id: string;
  name: string;
  demand: number;
  served: number;
  rejected: number;
  rejectedShare: number;
}

export const demandAt = (team: Team, t: number, surge: number) =>
  team.id === 'B' && t >= SURGE_FROM && t < SURGE_TO ? team.base * surge : team.base;

export function simulate(p: SimParams): SimResult {
  const n = TEAMS.length;
  const { charge, refund } = (() => {
    const r = reserveRefund(IN_TOK, p.maxTokens, OUT_TOK);
    return { charge: r.reserve, refund: r.refund };
  })();
  const gSum = TEAMS.reduce((a, t) => a + t.g, 0);
  const cap = TEAMS.map((t) => t.g * p.depth);
  const bucket = [...cap];
  let shared = gSum * p.depth;
  const sharedCap = gSum * p.depth;
  const due: number[][] = TEAMS.map(() => new Array(T_END + HOLD + 2).fill(0));
  const sharedDue = new Array(T_END + HOLD + 2).fill(0);

  const served = TEAMS.map(() => new Array(T_END).fill(0));
  const demand = TEAMS.map(() => new Array(T_END).fill(0));

  for (let t = 0; t < T_END; t++) {
    const d = TEAMS.map((team) => demandAt(team, t, p.surge));
    d.forEach((x, i) => (demand[i][t] = x));

    if (p.policy === 'shared') {
      shared = Math.min(sharedCap, shared + gSum) + sharedDue[t];
      const total = d.reduce((a, b) => a + b, 0);
      const k = Math.min(total, shared / charge);
      shared -= k * charge;
      sharedDue[t + HOLD] += k * refund;
      d.forEach((x, i) => (served[i][t] = total > 0 ? (k * x) / total : 0));
      continue;
    }

    const overflow = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const refilled = bucket[i] + TEAMS[i].g;
      overflow[i] = Math.max(0, refilled - cap[i]);
      bucket[i] = Math.min(cap[i], refilled) + due[i][t];
    }
    const k = d.map((x, i) => Math.min(x, bucket[i] / charge));
    for (let i = 0; i < n; i++) {
      bucket[i] -= k[i] * charge;
      due[i][t + HOLD] += k[i] * refund;
    }

    if (p.policy === 'fair') {
      // Lend only the refill that would have overflowed a full bucket. Weighted max-min fill.
      let pool = overflow.reduce((a, b) => a + b, 0);
      let want = d.map((x, i) => Math.max(0, x - k[i]) * charge);
      for (let round = 0; round < n && pool > 1e-9; round++) {
        const open = want.map((w, i) => (w > 1e-9 ? i : -1)).filter((i) => i >= 0);
        if (open.length === 0) break;
        const wSum = open.reduce((a, i) => a + TEAMS[i].g, 0);
        let used = 0;
        for (const i of open) {
          const give = Math.min(want[i], (pool * TEAMS[i].g) / wSum);
          k[i] += give / charge;
          want[i] -= give;
          used += give;
        }
        pool -= used;
      }
    }
    k.forEach((x, i) => (served[i][t] = x));
  }

  const tally = (from: number, to: number): TeamTotal[] =>
    TEAMS.map((team, i) => {
      const dsum = demand[i].slice(from, to).reduce((a, b) => a + b, 0);
      const ssum = served[i].slice(from, to).reduce((a, b) => a + b, 0);
      return { id: team.id, name: team.name, demand: dsum, served: ssum, rejected: dsum - ssum, rejectedShare: dsum > 0 ? (dsum - ssum) / dsum : 0 };
    });
  return { served, demand, totals: tally(0, T_END), surgeTotals: tally(SURGE_FROM, SURGE_TO) };
}
