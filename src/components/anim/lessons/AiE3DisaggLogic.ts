/** Logic for E3.5. A deliberately simple model of one long prompt arriving while other users decode. Numbers are illustrative. */

export const DECODE_STEP_MS = 25; // memory-bound floor of one decode step (illustrative; same order as A2.2 for a 70B model on 2 GPUs)
export const PREFILL_MS_PER_TOKEN = 0.05; // compute-bound prefill cost (illustrative; about 0.1 s for 2,000 tokens, as in A2.2)
export const KV_BYTES_PER_TOKEN = 327680; // Llama 3 70B BF16, from lesson A2.3
export const LAYERS = 80; // Llama 3 70B

export interface Link {
  id: string;
  label: string;
  gbPerS: number;
}

export const LINKS: Link[] = [
  { id: 'eth', label: '25 Gbps network', gbPerS: 25 / 8 },
  { id: 'ib', label: '50 GB/s fast fabric', gbPerS: 50 },
  { id: 'nvl', label: '900 GB/s NVLink', gbPerS: 900 },
];

export interface Outcome {
  /** Worst gap between two tokens for users already decoding, in ms. */
  gapMs: number;
  /** Time to first token for the new long prompt, in ms. */
  ttftMs: number;
  /** Time spent moving KV that the user waits for, in ms (disaggregated only). */
  transferMs: number;
}

export function kvBytes(promptTokens: number): number {
  return promptTokens * KV_BYTES_PER_TOKEN;
}

/** Time to move the KV cache of one prompt over a link, in ms. */
export function transferTime(promptTokens: number, gbPerS: number): number {
  return (kvBytes(promptTokens) / (gbPerS * 1e9)) * 1000;
}

/** Colocated, whole prompt in one step. Decoders wait for the whole prefill. */
export function whole(promptTokens: number): Outcome {
  const step = DECODE_STEP_MS + promptTokens * PREFILL_MS_PER_TOKEN;
  return { gapMs: step, ttftMs: step, transferMs: 0 };
}

/** Colocated, prompt cut into chunks. Each step carries one chunk plus the decodes. */
export function chunked(promptTokens: number, chunk: number): Outcome {
  const c = Math.min(chunk, promptTokens);
  const full = Math.floor(promptTokens / c);
  const rem = promptTokens - full * c;
  let ttft = full * (DECODE_STEP_MS + c * PREFILL_MS_PER_TOKEN);
  if (rem > 0) ttft += DECODE_STEP_MS + rem * PREFILL_MS_PER_TOKEN;
  return { gapMs: DECODE_STEP_MS + c * PREFILL_MS_PER_TOKEN, ttftMs: ttft, transferMs: 0 };
}

/** Separate pools. Decoders never see the prefill. The user waits for prefill plus the part of the transfer that is not hidden. */
export function split(promptTokens: number, gbPerS: number, overlap: boolean): Outcome {
  const prefill = promptTokens * PREFILL_MS_PER_TOKEN;
  const raw = transferTime(promptTokens, gbPerS);
  const exposed = overlap ? Math.max(raw / LAYERS, raw - prefill) : raw;
  return { gapMs: DECODE_STEP_MS, ttftMs: prefill + exposed, transferMs: exposed };
}
