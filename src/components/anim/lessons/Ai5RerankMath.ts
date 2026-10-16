/** Rerank budget. Prices as of 2026-10-16: Voyage rerank-3 $0.05 per 1M tokens; Claude Sonnet 5.5 $2 per 1M input tokens. Latency per pair is ILLUSTRATIVE (no sourced figure). */
export const P = { rerank: 0.05, llmIn: 2 } as const;

export interface Budget {
  rerankMs: number;
  totalMs: number;
  rerankCost: number;
  llmCostTop: number;
  llmCostAll: number;
}

export function budget(o: { n: number; k: number; docTok: number; msPerPair: number; parallel: number; firstStageMs: number }): Budget {
  const rerankMs = (o.n * o.msPerPair) / o.parallel;
  return {
    rerankMs,
    totalMs: o.firstStageMs + rerankMs,
    rerankCost: (o.n * o.docTok * P.rerank) / 1e6,
    llmCostTop: (o.k * o.docTok * P.llmIn) / 1e6,
    llmCostAll: (o.n * o.docTok * P.llmIn) / 1e6,
  };
}
