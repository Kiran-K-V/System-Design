/** Pure circuit breaker for lesson 7.3. The three states and the rules follow Martin Fowler's "CircuitBreaker" article. */

export type BreakerState = 'closed' | 'open' | 'half-open';

export interface Breaker {
  state: BreakerState;
  /** Failures since the last success. Only counted while closed. */
  failures: number;
  /** Time (s) the breaker last opened. */
  openedAt: number;
}

export interface Config {
  /** Consecutive failures that trip the breaker. */
  threshold: number;
  /** Seconds the breaker stays open before it allows one trial call. */
  resetSec: number;
}

export const start = (): Breaker => ({ state: 'closed', failures: 0, openedAt: 0 });

/** What the breaker shows at time `now`: an open breaker whose timeout has passed is ready for a trial call. */
export function stateAt(b: Breaker, cfg: Config, now: number): BreakerState {
  return b.state === 'open' && now - b.openedAt >= cfg.resetSec ? 'half-open' : b.state;
}

export interface CallResult {
  breaker: Breaker;
  /** Did the call reach the dependency? */
  made: boolean;
  /** The outcome the caller sees. A call that was not made is a fast failure. */
  outcome: 'ok' | 'failed' | 'rejected';
  /** True when this call was the trial call. */
  trial: boolean;
}

/** One call at time `now`. `dependencyOk` says whether the dependency would answer well. It is ignored when the call is not made. */
export function call(b: Breaker, cfg: Config, now: number, dependencyOk: boolean): CallResult {
  const state = stateAt(b, cfg, now);
  if (state === 'open') return { breaker: b, made: false, outcome: 'rejected', trial: false };

  const trial = state === 'half-open';
  if (dependencyOk) return { breaker: { state: 'closed', failures: 0, openedAt: b.openedAt }, made: true, outcome: 'ok', trial };

  const failures = trial ? cfg.threshold : b.failures + 1;
  const opens = trial || failures >= cfg.threshold;
  return {
    breaker: opens ? { state: 'open', failures, openedAt: now } : { state: 'closed', failures, openedAt: b.openedAt },
    made: true,
    outcome: 'failed',
    trial,
  };
}
