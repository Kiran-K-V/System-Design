/** Logic for E3.4 speculative decoding. Pure functions. Formulas follow the original speculative decoding paper. */

/** Expected tokens produced per large-model pass: (1 - a^(g+1)) / (1 - a). Assumes each drafted token is accepted with the same chance a. */
export function expectedTokens(alpha: number, gamma: number): number {
  if (alpha >= 1) return gamma + 1;
  return (1 - Math.pow(alpha, gamma + 1)) / (1 - alpha);
}

/** Wall-time speedup when the large model is not the only cost. c is the draft step time over the large step time. */
export function speedup(alpha: number, gamma: number, c: number): number {
  return expectedTokens(alpha, gamma) / (gamma * c + 1);
}

/** Factor by which total arithmetic grows (the paper's measure). Here the draft op ratio equals c. */
export function opsFactor(alpha: number, gamma: number, c: number): number {
  return ((gamma * c + gamma + 1) * (1 - alpha)) / (1 - Math.pow(alpha, gamma + 1));
}

export function bestGamma(alpha: number, c: number, max = 12): number {
  let best = 1;
  for (let g = 1; g <= max; g++) if (speedup(alpha, g, c) > speedup(alpha, best, c)) best = g;
  return best;
}

export const RIDGE = 295; // H100 BF16 ridge point from lesson A2.2 (FLOPs per byte, about tokens per weight read)

/** Relative step time of a large-model pass that checks `tokens` positions, in units of the memory-bound floor. */
function stepTime(tokens: number): number {
  return Math.max(1, tokens / RIDGE);
}

/**
 * Per-user speedup at a given batch size. Each request verifies gamma + 1 positions, so the step carries batch x (gamma + 1) tokens.
 * Once that crosses the ridge the step is compute-bound and grows. The draft cost is gamma x c (draft treated as memory-bound at any batch).
 */
export function speedupAtBatch(alpha: number, gamma: number, c: number, batch: number): number {
  const base = stepTime(batch);
  const spec = stepTime(batch * (gamma + 1)) + gamma * c;
  return expectedTokens(alpha, gamma) / (spec / base);
}
