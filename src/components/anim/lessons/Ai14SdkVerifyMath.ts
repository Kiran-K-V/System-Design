/**
 * Math for lesson A14.5 (Claude Agent SDK teardown): a task of n steps, with and without a verify stage.
 * Pure functions. Every input is ILLUSTRATIVE. The source post publishes no pass rates, detection rates, or latencies.
 *
 * Model (our assumptions, not the post's):
 * - A task needs n steps. Each attempt at a step is correct with probability p. Attempts are independent.
 * - A verifier looks at each attempt. It flags a wrong attempt with probability d (detection)
 *   and flags a correct attempt by mistake with probability f (false alarm).
 * - A flagged attempt is retried, up to R retries per step. A retry is a fresh draw with the same p.
 * - An unflagged attempt is accepted, right or wrong. A step that is still flagged after R retries is unresolved:
 *   the run stops and reports a known failure (a loud failure).
 */

export interface VerifyInput {
  n: number;
  p: number;
  d: number;
  f: number;
  retries: number;
  /** Cost of one check, as a share of the cost of one attempt. */
  checkCost: number;
}

export interface StepOutcome {
  /** Step ends accepted and correct. */
  good: number;
  /** Step ends accepted but wrong (the check missed it). */
  silent: number;
  /** Step ends flagged with no retries left. */
  loud: number;
  /** Expected attempts at this step, counting the first one. */
  attempts: number;
}

export interface TaskOutcome extends StepOutcome {
  /** Chance the whole task ends correct. */
  correct: number;
  /** Chance the run ends and reports a known failure. */
  loudTask: number;
  /** Chance the run ends and says "done" but is wrong. */
  silentTask: number;
  /** Expected attempts for the whole run (the run may stop early on a loud failure). */
  runAttempts: number;
  /** Expected cost of the run in units of one attempt: attempts plus checks. */
  runCost: number;
}

/** Per-step outcome with a verifier and `retries` retries. */
export function stepOutcome(p: number, d: number, f: number, retries: number): StepOutcome {
  const flag = p * f + (1 - p) * d;
  const goodPass = p * (1 - f);
  const badPass = (1 - p) * (1 - d);
  let sum = 0;
  let pow = 1;
  for (let k = 0; k <= retries; k++) {
    sum += pow;
    pow *= flag;
  }
  return { good: goodPass * sum, silent: badPass * sum, loud: pow, attempts: sum };
}

/** No verifier: one attempt per step, accepted as it is. */
export function noVerifyTask(n: number, p: number): TaskOutcome {
  const correct = Math.pow(p, n);
  return {
    good: p, silent: 1 - p, loud: 0, attempts: 1,
    correct, loudTask: 0, silentTask: 1 - correct,
    runAttempts: n, runCost: n,
  };
}

export function verifyTask(i: VerifyInput): TaskOutcome {
  const s = stepOutcome(i.p, i.d, i.f, i.retries);
  const accepted = s.good + s.silent;
  const correct = Math.pow(s.good, i.n);
  const completes = Math.pow(accepted, i.n);
  // Expected steps started: the run reaches step k only if steps 1..k-1 were accepted.
  let started = 0;
  for (let k = 0; k < i.n; k++) started += Math.pow(accepted, k);
  const runAttempts = started * s.attempts;
  return {
    ...s,
    correct,
    silentTask: completes - correct,
    loudTask: 1 - completes,
    runAttempts,
    runCost: runAttempts * (1 + i.checkCost),
  };
}

/** Verifier presets. Illustrative values only, chosen to show the shape. */
export const PRESETS = {
  rules: { label: 'Rules (tests, lint)', d: 0.95, f: 0.02, checkCost: 0.05 },
  visual: { label: 'Visual check', d: 0.8, f: 0.05, checkCost: 0.4 },
  judge: { label: 'LLM judge', d: 0.6, f: 0.15, checkCost: 1 },
} as const;
export type PresetId = keyof typeof PRESETS;

/** Tokens re-read by a run of `calls` model calls. Each call adds `added` tokens to a history that starts at `start`. */
export function inputTokens(calls: number, start: number, added: number): number {
  return calls * start + added * ((calls * (calls - 1)) / 2);
}

/** Largest number of calls that fit in a window. */
export function callsToFill(window: number, start: number, added: number): number {
  return Math.floor((window - start) / added) + 1;
}
