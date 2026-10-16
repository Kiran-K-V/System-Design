/** Long context versus RAG, cost per query. Prices as of 2026-10-16: Claude Sonnet 5.5 $2 input, $10 output, $2.50 cache write, $0.10 cache read per 1M tokens. Window: up to 1M tokens (pricing page). */
export const P = { in: 2, out: 10, write: 2.5, read: 0.1 } as const;
export const WINDOW = 1_000_000;
/** Our assumptions. */
export const A = { question: 200, answer: 300 } as const;

export interface QCost {
  fits: boolean;
  uncached: number;
  /** Per query when the corpus sits in the prompt cache and every query hits it. Write cost is spread over n queries. */
  cached: number;
  rag: number;
}

export function queryCost(corpus: number, ragTokens: number, n: number): QCost {
  const out = (A.answer * P.out) / 1e6;
  const q = (A.question * P.in) / 1e6;
  return {
    fits: corpus + A.question + A.answer <= WINDOW,
    uncached: (corpus * P.in) / 1e6 + q + out,
    cached: (corpus * P.read) / 1e6 + (corpus * P.write) / 1e6 / n + q + out,
    rag: ((ragTokens + A.question) * P.in) / 1e6 + out,
  };
}
