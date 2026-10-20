/**
 * Endpointing model for lesson A13.8. Pure functions.
 *
 * The stage times are the P50 and P95 values of the ElevenLabs latency budget used in lesson A12.2
 * (https://elevenlabs.io/blog/voice-agent-latency-optimization). The page calls them illustrative.
 * The pause model (how often and how long people pause inside a turn), the turn-model effect, and the
 * start time of speculative work are ILLUSTRATIVE assumptions of this lesson. They are not measured data.
 */

/** STT final 60 + network 60 + LLM first token 250 + TTS first audio 110 + player buffer 80. */
export const OTHER_P50 = 560;
/** The same stages at P95: 150 + 160 + 600 + 220 + 150. */
export const OTHER_P95 = 1280;
/** The P95 of capture and endpointing (280) minus its P50 (120). */
export const JITTER_P95 = 160;

export const TARGET_P50 = 800;
export const TARGET_P95 = 1500;

/** Mid-turn pauses per turn (assumed). */
export const PAUSES_PER_TURN = 1.5;
/** Mean length of a mid-turn pause in ms. Lengths are assumed to follow an exponential spread. */
export const MEAN_PAUSE_MS = 220;
/** Share of mid-turn pauses that a turn-detection model recognises as "not finished" (assumed). */
export const MODEL_CATCH = 0.7;
/** Extra time the turn-detection model adds, ms (assumed). */
export const MODEL_MS = 50;
/** Speculative generation starts after this much silence, ms (assumed). */
export const SPEC_START_MS = 100;
/** STT final 60 + LLM first token 250 + TTS first audio 110: the work that speculation starts early. */
const SPEC_WORK_MS = 420;
const SPEC_WORK_P95_MS = 150 + 600 + 220;

export interface Setup {
  /** Silence threshold in ms. */
  silenceMs: number;
  /** True when a model that reads the words backs up the timer. */
  turnModel: boolean;
  /** True when the LLM starts before the turn is confirmed. */
  speculate: boolean;
}

const lambda = (s: Setup) => PAUSES_PER_TURN * (s.turnModel ? 1 - MODEL_CATCH : 1);
const wait = (s: Setup) => s.silenceMs + (s.turnModel ? MODEL_MS : 0);

/** Share of turns where the agent starts while the user is still talking. */
export function cutRate(s: Setup): number {
  return 1 - Math.exp(-lambda(s) * Math.exp(-s.silenceMs / MEAN_PAUSE_MS));
}

/** Chance of at least one cut-off in a call of n turns, with independent turns. */
export const callCutRate = (c: number, n: number) => 1 - Math.pow(1 - c, n);

/** Median time to first audio, ms. */
export function p50(s: Setup): number {
  const w = wait(s);
  if (!s.speculate) return w + OTHER_P50;
  return Math.max(w, SPEC_START_MS + SPEC_WORK_MS) + 60 + 80;
}

/** P95 time to first audio, ms (stage P95 values summed, a planning shortcut). */
export function p95(s: Setup): number {
  const w = wait(s);
  if (!s.speculate) return w + JITTER_P95 + OTHER_P95;
  return Math.max(w + JITTER_P95, SPEC_START_MS + SPEC_WORK_P95_MS) + 160 + 150;
}

/** LLM calls per turn. Without speculation it is 1. With it, each pause longer than the start time adds one. */
export function llmCallsPerTurn(s: Setup): number {
  if (!s.speculate) return 1;
  return 1 + lambda(s) * Math.exp(-SPEC_START_MS / MEAN_PAUSE_MS);
}

/** Largest silence threshold (step 10) that still meets the P50 target, or 0 if none does. */
export function maxSilenceForP50(turnModel: boolean, speculate: boolean): number {
  let best = 0;
  for (let t = 0; t <= 2000; t += 10) if (p50({ silenceMs: t, turnModel, speculate }) <= TARGET_P50) best = t;
  return best;
}
