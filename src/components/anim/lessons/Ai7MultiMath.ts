/** Multi-agent arithmetic for lesson A7.6. Ratios 4x and 15x are Anthropic's published averages, not measurements of your task. */

export const CHAT_TOKENS = 10_000;
export const AGENT_RATIO = 4;
export const MULTI_RATIO = 15;

export const PRICES = [
  { id: 'haiku55', name: 'Haiku 5.5', input: 0.1 },
  { id: 'sonnet55', name: 'Sonnet 5.5', input: 2 },
  { id: 'opus55', name: 'Opus 5.5', input: 4 },
];

export type Verdict = 'multi' | 'single' | 'mixed';

export interface Compare {
  singleTokens: number;
  multiTokens: number;
  /** Wall-clock time of the multi-agent run, relative to the single agent (1 = same). */
  timeRatio: number;
  /** Share of time saved. */
  saved: number;
  verdict: Verdict;
}

/**
 * Illustrative model. Coupling c is the share of the work where each step depends on decisions made in another step (0 to 1).
 * The coupled part stays serial; the independent part is split over k subagents.
 * The verdict thresholds are a teaching heuristic, not a measured result.
 */
export function compare(coupling: number, k: number, chatTokens = CHAT_TOKENS): Compare {
  const timeRatio = coupling + (1 - coupling) / k;
  const verdict: Verdict = coupling <= 0.3 ? 'multi' : coupling >= 0.6 ? 'single' : 'mixed';
  return {
    singleTokens: chatTokens * AGENT_RATIO,
    multiTokens: chatTokens * MULTI_RATIO,
    timeRatio,
    saved: 1 - timeRatio,
    verdict,
  };
}

export const dollars = (tokens: number, pricePerM: number) => (tokens * pricePerM) / 1e6;
