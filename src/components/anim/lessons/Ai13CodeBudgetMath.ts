/**
 * Budget model for lesson A13.6 (coding agent). Pure functions.
 *
 * One run is a list of model calls. Each call re-sends the whole history. With prompt caching, the prefix from the
 * last call is a cache read and only the new tokens are a cache write. Without caching, every call pays full input price.
 *
 * Prices are USD per million tokens, from https://platform.claude.com/docs/en/about-claude/pricing, as of 2026-10-20.
 * The token sizes (start context, growth per call, output per call) are ILLUSTRATIVE, not measured.
 * Assumption: every call arrives within the 5 minute cache lifetime, so the cache stays warm.
 */

export type ModelId = 'sonnet' | 'opus' | 'haiku';

interface Price {
  in: number;
  write: number;
  read: number;
  out: number;
}

export const MODEL_LABEL: Record<ModelId, string> = {
  sonnet: 'Sonnet 5.5',
  opus: 'Opus 5.5',
  haiku: 'Haiku 5.5',
};

const PRICES: Record<ModelId, Price> = {
  sonnet: { in: 2, write: 2.5, read: 0.1, out: 10 },
  opus: { in: 4, write: 5, read: 0.2, out: 20 },
  haiku: { in: 0.1, write: 0.125, read: 0.01, out: 0.5 },
};
/** Haiku 5.5 prompts over 100,000 tokens bill at a higher tier. */
const HAIKU_LONG: Price = { in: 0.5, write: 0.625, read: 0.05, out: 2.5 };

export function priceFor(model: ModelId, ctxTokens: number): Price {
  return model === 'haiku' && ctxTokens > 100_000 ? HAIKU_LONG : PRICES[model];
}

export interface CallInput {
  model: ModelId;
  cached: boolean;
  /** Tokens already in the history before this call (the cache-read part). */
  prefix: number;
  /** New tokens this call adds to the input (cache-write part). */
  delta: number;
  /** Tokens the model writes in this call. */
  out: number;
}

export function callCost(c: CallInput): number {
  const p = priceFor(c.model, c.prefix + c.delta);
  const input = c.cached ? c.prefix * p.read + c.delta * p.write : (c.prefix + c.delta) * p.in;
  return (input + c.out * p.out) / 1e6;
}

export type Scenario = 'healthy' | 'stuck';
export type StopReason = 'passed' | 'retry cap' | 'same failure' | 'budget cap' | 'turn cap';

export interface RunInput {
  model: ModelId;
  cached: boolean;
  scenario: Scenario;
  /** Fix attempts a healthy run needs. */
  attemptsNeeded: number;
  startCtx: number;
  growth: number;
  outPerCall: number;
  /** Search and read calls before the first edit. */
  gatherCalls: number;
  /** 0 means off. */
  retryCap: number;
  /** Stop after this many identical failures in a row. 0 means off. */
  sameFailureLimit: number;
  /** Dollar cap, checked after a call completes. 0 means off. */
  budgetUsd: number;
  turnCap: number;
}

export interface RunResult {
  calls: number;
  attempts: number;
  cost: number;
  finalCtx: number;
  stoppedBy: StopReason;
  /** Cumulative dollars after each call. */
  curve: number[];
}

/** Each attempt is two calls: an edit call, then a call that reads the test result. */
export function runTask(r: RunInput): RunResult {
  let calls = 0;
  let attempts = 0;
  let cost = 0;
  let ctx = 0;
  let sameFail = 0;
  const curve: number[] = [];
  const step = (): void => {
    const delta = calls === 0 ? r.startCtx : r.growth;
    cost += callCost({ model: r.model, cached: r.cached, prefix: ctx, delta, out: r.outPerCall });
    ctx += delta;
    calls += 1;
    curve.push(cost);
  };
  const budgetHit = () => r.budgetUsd > 0 && cost >= r.budgetUsd;
  for (let i = 0; i < r.gatherCalls; i++) {
    step();
    if (calls >= r.turnCap) return done('turn cap');
    if (budgetHit()) return done('budget cap');
  }
  for (;;) {
    step(); // edit
    attempts += 1;
    if (calls >= r.turnCap) return done('turn cap');
    if (budgetHit()) return done('budget cap');
    step(); // run tests, read the result
    const passes = r.scenario === 'healthy' && attempts >= r.attemptsNeeded;
    if (passes) {
      step(); // final reply with no tool call
      return done('passed');
    }
    sameFail = r.scenario === 'stuck' ? sameFail + 1 : 0;
    if (r.sameFailureLimit > 0 && sameFail >= r.sameFailureLimit) return done('same failure');
    if (r.retryCap > 0 && attempts >= r.retryCap) return done('retry cap');
    if (calls >= r.turnCap) return done('turn cap');
    if (budgetHit()) return done('budget cap');
  }
  function done(stoppedBy: StopReason): RunResult {
    return { calls, attempts, cost, finalCtx: ctx, stoppedBy, curve };
  }
}

export const DEFAULTS: RunInput = {
  model: 'sonnet',
  cached: true,
  scenario: 'stuck',
  attemptsNeeded: 3,
  startCtx: 20_000,
  growth: 2_500,
  outPerCall: 600,
  gatherCalls: 6,
  retryCap: 0,
  sameFailureLimit: 0,
  budgetUsd: 0,
  turnCap: 300,
};
