/**
 * Latency and cost arithmetic for lesson A12.2. Pure functions.
 *
 * Stage P50 and P95 values are the "illustrative ranges" in the ElevenLabs voice-agent latency
 * budget (https://elevenlabs.io/blog/voice-agent-latency-optimization, read 2026-10-18).
 * The sequential model (answer length, decode speed, whole-clip TTS time) is illustrative.
 */

export interface Stage {
  id: string;
  label: string;
  p50: number;
  p95: number;
  /** Slider maximum, in ms. */
  max: number;
}

export const STAGES: Stage[] = [
  { id: 'cap', label: 'Capture and endpointing', p50: 120, p95: 280, max: 1000 },
  { id: 'stt', label: 'STT finalization', p50: 60, p95: 150, max: 500 },
  { id: 'net', label: 'Network', p50: 60, p95: 160, max: 500 },
  { id: 'llm', label: 'LLM first token', p50: 250, p95: 600, max: 1500 },
  { id: 'tts', label: 'TTS first audio', p50: 110, p95: 220, max: 800 },
  { id: 'buf', label: 'Player buffering', p50: 80, p95: 150, max: 500 },
];

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const totalP50 = () => sum(STAGES.map((s) => s.p50));
export const totalP95 = () => sum(STAGES.map((s) => s.p95));

/** Vendor targets from the same page: P50 under 800 ms, P95 under 1,500 ms. */
export const TARGET_P50 = 800;
export const TARGET_P95 = 1500;

export function verdict(totalMs: number, targetMs: number) {
  const slack = targetMs - totalMs;
  return { ok: slack >= 0, slack, shareOfTarget: totalMs / targetMs };
}

/** The stage that takes the largest share of a given total. */
export function biggest(ms: number[]) {
  let k = 0;
  ms.forEach((v, i) => {
    if (v > ms[k]) k = i;
  });
  return { index: k, share: ms[k] / sum(ms) };
}

/** Illustrative answer used for the sequential run. */
export const ANSWER = {
  /** Tokens after the first one. About 30 words in all. */
  moreTokens: 40,
  /** Decode speed after the first token, tokens per second. */
  tokPerS: 80,
  /** Time for TTS to synthesize the whole clip once it has all the text, ms. */
  ttsWholeMs: 400,
};

export interface Bar {
  id: string;
  label: string;
  start: number;
  dur: number;
  /** Tail work that runs in parallel with later stages. */
  tail?: boolean;
}

const byId = (id: string) => STAGES.find((s) => s.id === id)!;

/** LLM time to the last token, ms. */
export const llmFullMs = () => byId('llm').p50 + (ANSWER.moreTokens / ANSWER.tokPerS) * 1000;

/** Naive: each stage finishes completely before the next starts. */
export function sequentialBars(): Bar[] {
  const durs: [string, number][] = [
    ['cap', byId('cap').p50],
    ['stt', byId('stt').p50],
    ['net', byId('net').p50],
    ['llm', llmFullMs()],
    ['tts', ANSWER.ttsWholeMs],
    ['buf', byId('buf').p50],
  ];
  let t = 0;
  return durs.map(([id, dur]) => {
    const b = { id, label: byId(id).label, start: t, dur };
    t += dur;
    return b;
  });
}

/** Streamed: each stage hands over its first output at once. The LLM tail runs on in parallel. */
export function streamedBars(): Bar[] {
  let t = 0;
  const bars: Bar[] = STAGES.map((s) => {
    const b = { id: s.id, label: s.label, start: t, dur: s.p50 };
    t += s.p50;
    return b;
  });
  const llm = bars.find((b) => b.id === 'llm')!;
  bars.push({ id: 'llm-tail', label: 'LLM keeps writing', start: llm.start + llm.dur, dur: llmFullMs() - byId('llm').p50, tail: true });
  return bars;
}

/** Time to first audio: the end of the last non-tail bar. */
export const firstAudioMs = (bars: Bar[]) => Math.max(...bars.filter((b) => !b.tail).map((b) => b.start + b.dur));

/** Replace the endpointing stage by a silence wait of `ms`, as in the ElevenLabs 700 ms example. */
export const withEndpoint = (ms: number) => totalP50() - byId('cap').p50 + ms;

export interface CostInputs {
  /** Seconds of user audio sent to STT per call-minute. */
  sttSec: number;
  /** STT price, USD per hour of audio. */
  sttPerHour: number;
  /** LLM calls per call-minute. */
  turns: number;
  /** Input tokens per LLM call (the whole history is sent each time). */
  inTok: number;
  /** Output tokens per call-minute in all. */
  outTok: number;
  /** USD per million input and output tokens. */
  llmIn: number;
  llmOut: number;
  /** Characters sent to TTS per call-minute. */
  ttsChars: number;
  /** TTS price, USD per 1,000 characters. */
  ttsPer1k: number;
}

export function costPerMinute(c: CostInputs) {
  const stt = (c.sttSec / 3600) * c.sttPerHour;
  const llm = (c.turns * c.inTok * c.llmIn + c.outTok * c.llmOut) / 1e6;
  const tts = (c.ttsChars / 1000) * c.ttsPer1k;
  return { stt, llm, tts, total: stt + llm + tts };
}

/** The worked example in the lesson. Every input is an assumption; the prices are list prices as of 2026-10-18. */
export const EXAMPLE: CostInputs = {
  sttSec: 60,
  sttPerHour: 0.39,
  turns: 4,
  inTok: 1500,
  outTok: 100,
  llmIn: 2,
  llmOut: 10,
  ttsChars: 450,
  ttsPer1k: 0.04,
};
