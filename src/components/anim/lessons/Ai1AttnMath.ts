import { PRESETS, kvBytesPerToken, params } from './Ai1FwdMath';

/** Llama 3 70B (paper Table 3). */
export const CFG = PRESETS[1].cfg;
export const P = params(CFG);
export const N = P.total;
const D = CFG.dModel; // heads x head_dim
const L = CFG.layers;

/** Prompt (prefill) FLOPs of the weight matmuls: 2N per token, n tokens. */
export const linearFlops = (n: number) => 2 * N * n;

/** Attention score and value FLOPs: QK^T and AV each cost 2 n^2 d per layer. Causal skipping of masked blocks halves it. */
export const attnFlops = (n: number, causal: boolean) => 4 * n * n * D * L * (causal ? 0.5 : 1);

export const ratio = (n: number, causal: boolean) => attnFlops(n, causal) / linearFlops(n);

/** Context length where attention FLOPs equal the linear FLOPs: n = N / (2 d L) for the full mask. */
export const crossover = (causal: boolean) => (N / (2 * D * L)) * (causal ? 2 : 1);

/** Naive attention writes the n x n score matrix for every head in BF16 (one layer, one sequence). */
export const naiveScoreBytes = (n: number) => CFG.heads * n * n * 2;

/** FlashAttention never stores the matrix. It keeps about one fp32 statistic per row per head: O(n). */
export const flashExtraBytes = (n: number) => CFG.heads * n * 4;

export const kvBytes = (n: number) => n * kvBytesPerToken(CFG);

export const LENGTHS = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
