/**
 * Logic for lesson E3.3 (FlashAttention). Pure functions, no React.
 * Memory-traffic counts follow Algorithm 0 (standard attention) and Algorithm 1 (FlashAttention) of the paper, forward pass, one head.
 * Units are elements (numbers), not bytes. Masking, dropout and the backward pass are left out, so this is a model, not a benchmark.
 */

/** Standard attention: write S, read S, write P, read P, plus Q, K, V in and O out. */
export function naiveTraffic(N: number, d: number): number {
  return 4 * N * d + 4 * N * N;
}

/** Block sizes from Algorithm 1 line 1. M is the SRAM size in elements. */
export function blocks(M: number, d: number) {
  const Bc = Math.ceil(M / (4 * d));
  const Br = Math.min(Bc, d);
  return { Bc, Br };
}

/** FlashAttention: K and V are read once. For every K/V block, every Q block, O, and the two softmax statistics are read and written. */
export function flashTraffic(N: number, d: number, M: number): number {
  const { Bc } = blocks(M, d);
  const Tc = Math.ceil(N / Bc);
  return 2 * N * d + Tc * (3 * N * d + 4 * N);
}

/** Elements of score matrix kept in HBM at once: S and P for standard attention, two statistics per row for FlashAttention. */
export function naiveScoreStore(N: number): number {
  return 2 * N * N;
}
export function flashScoreStore(N: number): number {
  return 2 * N;
}

/* ---------- Tile walk for the animation: N = 8, d = 2, Br = 2, Bc = 4 ---------- */

export const TOY = { N: 8, d: 2, Br: 2, Bc: 4 };
export const TR = TOY.N / TOY.Br; // Q blocks
export const TC = TOY.N / TOY.Bc; // K/V blocks

/** Elements moved for one K,V block load. */
export const KV_LOAD = 2 * TOY.Bc * TOY.d;
/** Elements moved for one (Q block, K/V block) tile: read Q, O, l, m and write O, l, m. */
export const TILE_IO = 3 * TOY.Br * TOY.d + 4 * TOY.Br;

export function toyTraffic(kvLoads: number, tiles: number): number {
  return kvLoads * KV_LOAD + tiles * TILE_IO;
}
export const TOY_FLASH_TOTAL = toyTraffic(TC, TC * TR);
export const TOY_NAIVE_TOTAL = naiveTraffic(TOY.N, TOY.d);
