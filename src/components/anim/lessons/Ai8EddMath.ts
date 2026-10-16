/** Logic for the A8.1 eval cost calculator. Pure functions. Prices: Anthropic list prices, as of 2026-10-16. */

export interface Price {
  /** Dollars per million input tokens. */
  inp: number;
  /** Dollars per million output tokens. */
  out: number;
}

export type ModelId = 'opus55' | 'sonnet55' | 'haiku55';

export const MODELS: Record<ModelId, { label: string; price: Price }> = {
  opus55: { label: 'Opus 5.5', price: { inp: 4, out: 20 } },
  sonnet55: { label: 'Sonnet 5.5', price: { inp: 2, out: 10 } },
  haiku55: { label: 'Haiku 5.5', price: { inp: 0.1, out: 0.5 } },
};

export interface EvalRun {
  cases: number;
  trials: number;
  sysModel: ModelId;
  judgeModel: ModelId;
  /** Judge calls per trial. 0 means code checks only. */
  judgeCalls: number;
  concurrency: number;
  batch: boolean;
}

/** Illustrative sizes. Real prompts differ: measure yours. */
export const SYS_IN = 2000;
export const SYS_OUT = 500;
export const JUDGE_IN = 2500;
export const JUDGE_OUT = 100;
/** Illustrative wall-clock seconds per call. */
export const SYS_SEC = 8;
export const JUDGE_SEC = 2;

const dollars = (inTok: number, outTok: number, p: Price) => (inTok * p.inp + outTok * p.out) / 1e6;

export interface EvalCost {
  sysCalls: number;
  judgeCalls: number;
  sysCost: number;
  judgeCost: number;
  total: number;
  minutes: number;
}

export function evalCost(r: EvalRun): EvalCost {
  const sysCalls = r.cases * r.trials;
  const judgeCalls = sysCalls * r.judgeCalls;
  const disc = r.batch ? 0.5 : 1;
  const sysCost = dollars(sysCalls * SYS_IN, sysCalls * SYS_OUT, MODELS[r.sysModel].price) * disc;
  const judgeCost = dollars(judgeCalls * JUDGE_IN, judgeCalls * JUDGE_OUT, MODELS[r.judgeModel].price) * disc;
  const seconds = Math.ceil(sysCalls / r.concurrency) * SYS_SEC + Math.ceil(judgeCalls / r.concurrency) * JUDGE_SEC;
  return { sysCalls, judgeCalls, sysCost, judgeCost, total: sysCost + judgeCost, minutes: seconds / 60 };
}
