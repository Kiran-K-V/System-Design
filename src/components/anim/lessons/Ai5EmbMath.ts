/** Embedding storage and cost math. Prices: OpenAI pricing page, per 1M input tokens, as of 2026-10-16. Pure functions. */

export interface EmbModel {
  id: string;
  name: string;
  /** USD per 1M input tokens. */
  price: number;
  defaultDims: number;
  /** True when the API accepts a `dimensions` parameter. */
  shortenable: boolean;
}

export const EMB_MODELS: EmbModel[] = [
  { id: 'small', name: 'text-embedding-3-small', price: 0.02, defaultDims: 1536, shortenable: true },
  { id: 'large', name: 'text-embedding-3-large', price: 0.13, defaultDims: 3072, shortenable: true },
  { id: 'ada', name: 'text-embedding-ada-002', price: 0.1, defaultDims: 1536, shortenable: false },
];

/** float32 vector bytes. */
export const vectorBytes = (dims: number) => dims * 4;

/** Total storage for n vectors, in bytes (vectors only, no index). */
export const storageBytes = (n: number, dims: number) => n * vectorBytes(dims);

/** Tokens for n chunks. */
export const totalTokens = (n: number, tokensPerChunk: number) => n * tokensPerChunk;

/** Dollars to embed the corpus once at `price` per 1M tokens. */
export const embedCost = (n: number, tokensPerChunk: number, price: number) => (totalTokens(n, tokensPerChunk) / 1e6) * price;

/** Matryoshka points from Kusupati et al., Table 1, ResNet-50, ImageNet-1K linear probe, top-1 %. */
export const MRL_POINTS: { dims: number; top1: number }[] = [
  { dims: 2048, top1: 76.8 },
  { dims: 64, top1: 75.82 },
  { dims: 32, top1: 75.03 },
  { dims: 16, top1: 73.53 },
  { dims: 8, top1: 66.63 },
];
