/** Logic for the A11.5 distillation and eval-slice visuals. Pure functions. */

/** 95% half-width of an accuracy estimate from n examples at true accuracy p (normal approximation). */
export function halfWidth(n: number, p = 0.5): number {
  return n <= 0 ? 1 : 1.96 * Math.sqrt((p * (1 - p)) / n);
}

/** Examples of a slice you get when you sample an eval set in proportion to traffic. */
export function sliceCount(evalSize: number, share: number): number {
  return evalSize * share;
}

/** Eval size that gives at least `perSlice` examples of a slice when sampling in proportion to traffic. */
export function evalSizeFor(share: number, perSlice: number): number {
  return Math.ceil(perSlice / share);
}

export interface Mix {
  common: number;
  rare: number;
}

/** Overall accuracy when a slice with traffic share `share` has accuracy `rare` and the rest has `common`. */
export function overall(m: Mix, share: number): number {
  return (1 - share) * m.common + share * m.rare;
}

export const TEACHER: Mix = { common: 0.97, rare: 0.9 };
export const STUDENT: Mix = { common: 0.96, rare: 0.5 };

/** R1 distilled models: weights memory in bf16 is params x 2 bytes. AIME 2024 pass@1 from the DeepSeek-R1 repo. */
export interface Pt {
  name: string;
  params: number;
  aime: number;
}
export const R1_POINTS: Pt[] = [
  { name: 'Qwen 1.5B', params: 1.5, aime: 28.9 },
  { name: 'Qwen 7B', params: 7, aime: 55.5 },
  { name: 'Llama 8B', params: 8, aime: 50.4 },
  { name: 'Qwen 14B', params: 14, aime: 69.7 },
  { name: 'Qwen 32B', params: 32, aime: 72.6 },
  { name: 'Llama 70B', params: 70, aime: 70.0 },
];
export const bf16GB = (billions: number) => billions * 2;
