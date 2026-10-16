/** Chunk-size cost model. Prices as of 2026-10-16: OpenAI text-embedding-3-small $0.02 per 1M tokens; Claude Haiku 5.5 (prompts up to 100K) $0.10 in, $0.50 out, $0.125 cache write, $0.01 cache read per 1M tokens. */
export const P = { embed: 0.02, in: 0.1, out: 0.5, write: 0.125, read: 0.01 } as const;
/** Anthropic's cost example assumptions (contextual-retrieval post): 8k-token documents, 50-token instruction, 100 tokens of context per chunk. */
export const CTX = { doc: 8000, instr: 50, add: 100 } as const;

export interface ChunkStats {
  chunks: number;
  /** Tokens sent to the embedding model (each chunk counted in full). */
  embedded: number;
  /** Tokens embedded more than once because of overlap, about chunks x overlap. */
  duplicated: number;
  embedCost: number;
}

export function chunkStats(corpus: number, chunk: number, overlap: number, ctx = false): ChunkStats {
  const stride = Math.max(1, chunk - overlap);
  const chunks = Math.ceil(corpus / stride);
  const per = chunk + (ctx ? CTX.add : 0);
  const embedded = chunks * per;
  return { chunks, embedded, duplicated: chunks * overlap, embedCost: (embedded * P.embed) / 1e6 };
}

/** One-time cost to write a 100-token context for every chunk, with the document held in the prompt cache. */
export function contextCost(corpus: number, chunk: number, overlap: number): number {
  const stride = Math.max(1, chunk - overlap);
  const nd = Math.ceil(CTX.doc / stride);
  const perDoc = (CTX.doc * P.write + (nd - 1) * CTX.doc * P.read + nd * (CTX.instr + chunk) * P.in + nd * CTX.add * P.out) / 1e6;
  return (corpus / CTX.doc) * perDoc;
}

/** Anthropic's four failure rates, top-20 (percent). */
export const FAIL = [
  { label: 'Embeddings only', v: 5.7 },
  { label: '+ contextual embeddings', v: 3.7 },
  { label: '+ contextual BM25', v: 2.9 },
  { label: '+ reranking', v: 1.9 },
] as const;
