/** Logic for the subagent widgets in lesson A6.10. Pure functions, no React. Every size is illustrative unless the lesson cites it. */

export const PRICE_IN = 2; // Sonnet 5.5, $ per MTok input, as of 2026-10-16
export const PRICE_OUT = 10; // $ per MTok output

export interface SubOpts {
  /** Number of independent topics. One subagent per topic. */
  k: number;
  /** Model calls each topic needs. */
  n: number;
  /** Tokens a tool result adds per call. */
  g: number;
  /** Tokens the parent holds before the work starts. */
  parent: number;
  /** Start-up tokens of a subagent: its system prompt and tool definitions. */
  overhead: number;
  /** Tokens in the brief the parent writes for each subagent. */
  brief: number;
  /** Tokens in each subagent's final summary. */
  summary: number;
  /** Extra work, in percent, that subagents repeat because they cannot see each other. */
  dup: number;
  /** Output tokens per call. */
  out: number;
  /** Seconds per model call plus tool call. */
  sec: number;
}

export interface Side {
  inputTokens: number;
  outputTokens: number;
  cost: number;
  seconds: number;
  /** Largest single context window in the run. */
  peakWindow: number;
}

const sumArith = (calls: number, start: number, step: number) => calls * start + step * ((calls * (calls - 1)) / 2);
const usd = (i: number, o: number) => (i * PRICE_IN + o * PRICE_OUT) / 1e6;

/** One agent does all k topics in one window, one after another. */
export function single(o: SubOpts): Side {
  const calls = o.k * o.n;
  const input = sumArith(calls, o.parent, o.g);
  const output = calls * o.out;
  return { inputTokens: input, outputTokens: output, cost: usd(input, output), seconds: calls * o.sec, peakWindow: o.parent + calls * o.g };
}

/** k subagents run at the same time. The parent spawns, waits, then writes the answer. */
export function fanOut(o: SubOpts): Side {
  const callsEach = Math.max(1, Math.round(o.n * (1 + o.dup / 100)));
  const subInput = sumArith(callsEach, o.overhead + o.brief, o.g);
  const parentInput = o.parent + (o.parent + o.k * (o.brief + o.summary)); // spawn call, then synthesis call
  const input = o.k * subInput + parentInput;
  const output = (o.k * callsEach + 2) * o.out;
  return {
    inputTokens: input,
    outputTokens: output,
    cost: usd(input, output),
    // spawn call + slowest subagent + synthesis call
    seconds: (callsEach + 2) * o.sec,
    peakWindow: Math.max(o.overhead + o.brief + callsEach * o.g, o.parent + o.k * (o.brief + o.summary)),
  };
}
