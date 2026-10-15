/** Parameter and FLOP math for a Llama-style decoder (SwiGLU MLP with 3 matrices, grouped-query attention). */
export interface Config {
  layers: number;
  dModel: number;
  ffn: number;
  heads: number;
  kvHeads: number;
  vocab: number;
  tied: boolean;
}

export const PRESETS: { id: string; label: string; cfg: Config; paperB: number }[] = [
  { id: '8b', label: 'Llama 3 8B', paperB: 8, cfg: { layers: 32, dModel: 4096, ffn: 14336, heads: 32, kvHeads: 8, vocab: 128000, tied: false } },
  { id: '70b', label: 'Llama 3 70B', paperB: 70, cfg: { layers: 80, dModel: 8192, ffn: 28672, heads: 64, kvHeads: 8, vocab: 128000, tied: false } },
  { id: '405b', label: 'Llama 3 405B', paperB: 405, cfg: { layers: 126, dModel: 16384, ffn: 53248, heads: 128, kvHeads: 8, vocab: 128000, tied: false } },
];

export function params(c: Config) {
  const headDim = c.dModel / c.heads;
  const kvDim = c.kvHeads * headDim;
  const attn = c.dModel * c.dModel * 2 + c.dModel * kvDim * 2; // Wq, Wo, Wk, Wv
  const mlp = 3 * c.dModel * c.ffn; // gate, up, down
  const embed = c.vocab * c.dModel;
  const out = c.tied ? 0 : embed;
  const perLayer = attn + mlp;
  const total = c.layers * perLayer + embed + out;
  return { headDim, kvDim, attn, mlp, embed, out, perLayer, total, mlpShare: (c.layers * mlp) / total };
}

/** Forward-pass FLOPs per token, about 2 per parameter that takes part in a matrix multiply. Input embedding is a lookup. */
export function flopsPerToken(c: Config) {
  const p = params(c);
  return { rule2N: 2 * p.total, matmul: 2 * (p.total - p.embed) };
}

/** BF16 KV cache bytes per token: K and V, every layer, kvHeads x headDim, 2 bytes. */
export const kvBytesPerToken = (c: Config) => 2 * c.layers * c.kvHeads * (c.dModel / c.heads) * 2;
