/** Toy cost model for the planner toggle in lesson A6.8. Input tokens only. All inputs are assumptions. Pure functions. */

export interface PlanInput {
  /** Steps the task needs. */
  steps: number;
  /** Tokens of system prompt and tools in every call. */
  base: number;
  /** Tokens each step adds to the history (tool call plus result). */
  perStep: number;
  /** Tokens of the written plan. */
  planTokens: number;
  /** Failed steps. */
  failures: number;
  /** USD per 1M input tokens for the strong model (interleaved agent, planner, replanner). */
  strongPrice: number;
  /** USD per 1M input tokens for executors. */
  execPrice: number;
}

export interface PlanRun {
  calls: number;
  tokens: number;
  usd: number;
}

/** One loop, history grows by perStep every call. A failure costs one extra call (a retry). */
export function interleaved(i: PlanInput): PlanRun {
  const calls = i.steps + i.failures;
  const tokens = calls * i.base + (i.perStep * calls * (calls - 1)) / 2;
  return { calls, tokens, usd: (tokens * i.strongPrice) / 1e6 };
}

/**
 * Planner call, then one executor call per step. An executor sees base + plan + one result, not the whole history.
 * A failure costs one extra executor call and one replan call. The replan sees the plan and the results so far
 * (assumed: half of the steps were done).
 */
export function planned(i: PlanInput): PlanRun {
  const planner = i.base;
  const execCalls = i.steps + i.failures;
  const execTokens = execCalls * (i.base + i.planTokens + i.perStep);
  const replanTokens = i.failures * (i.base + i.planTokens + Math.floor(i.steps / 2) * i.perStep);
  const strongTokens = planner + replanTokens;
  return {
    calls: 1 + execCalls + i.failures,
    tokens: strongTokens + execTokens,
    usd: (strongTokens * i.strongPrice + execTokens * i.execPrice) / 1e6,
  };
}
