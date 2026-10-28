/** Illustrative load-test model for one serving replica with continuous batching. Not a measurement. */
export const OUT_TOKENS = 200; // output tokens per request
export const PREFILL_S = 0.15; // prefill time of one prompt, seconds
export const STEP_BASE_S = 0.02; // decode step time with an empty batch
export const STEP_PER_REQ_S = 0.0008; // extra step time per request in the batch
export const MAX_BATCH = 64; // slots (KV memory limit)
export const WAIT_CAP_S = 30;

export const stepTime = (c: number) => STEP_BASE_S + STEP_PER_REQ_S * c;
export const serviceTime = (c: number) => PREFILL_S + OUT_TOKENS * stepTime(c);
export const maxRate = () => MAX_BATCH / serviceTime(MAX_BATCH);

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Share of requests that meet a target when per-request values spread +-30% around the mean. */
export const shareMeeting = (slo: number, mean: number) => clamp((slo / mean - 0.7) / 0.6, 0, 1);

export interface Point {
  rate: number; // offered requests per second
  batch: number; // requests running at once
  tpotMs: number;
  ttftS: number;
  tokPerSec: number; // all output tokens per second
  goodTokPerSec: number; // output tokens of requests that meet both targets
  goodShare: number;
}

export function point(rate: number, tpotSloMs: number, ttftSloS: number): Point {
  const cap = maxRate();
  let c = 1;
  for (let i = 0; i < 60; i++) c = clamp(rate * serviceTime(c), 1, MAX_BATCH);
  const served = Math.min(rate, cap);
  const rho = rate / cap;
  const wait = rho < 0.98 ? clamp(((serviceTime(c) / MAX_BATCH) * rho) / (1 - rho), 0, WAIT_CAP_S) : WAIT_CAP_S;
  const tpot = stepTime(c);
  const ttft = PREFILL_S + wait;
  const share = shareMeeting(tpotSloMs / 1000, tpot) * shareMeeting(ttftSloS, ttft);
  return { rate, batch: c, tpotMs: tpot * 1000, ttftS: ttft, tokPerSec: served * OUT_TOKENS, goodTokPerSec: served * OUT_TOKENS * share, goodShare: share };
}

export const RATES = Array.from({ length: 36 }, (_, i) => 0.2 + i * 0.13);
export const sweep = (tpotSloMs: number, ttftSloS: number) => RATES.map((r) => point(r, tpotSloMs, ttftSloS));
/** Rate where goodput peaks. */
export function knee(tpotSloMs: number, ttftSloS: number) {
  return sweep(tpotSloMs, ttftSloS).reduce((a, b) => (b.goodTokPerSec > a.goodTokPerSec ? b : a));
}
