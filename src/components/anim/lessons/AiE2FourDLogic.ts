/**
 * 4D layout maths for lesson E2.7.
 *
 * SOURCED (Llama 3 paper, Table 4 and Figure 5): GPUs are divided into groups in the order [TP, CP, PP, DP]. A GPU's
 * position is a vector [D1, D2, D3, D4]. In the 16-GPU example (TP=2, CP=2, PP=2, DP=2) GPU0 and GPU1 share a TP group,
 * GPU0 and GPU2 a CP group, GPU0 and GPU4 a PP group, GPU0 and GPU8 a DP group. So id = tp + 2*cp + 4*pp + 8*dp.
 * Table 4 rows are copied exactly.
 */
export type Dim = 'TP' | 'CP' | 'PP' | 'DP';
export const DIMS: Dim[] = ['TP', 'CP', 'PP', 'DP'];

export interface Layout {
  tp: number;
  cp: number;
  pp: number;
  dp: number;
}

export const EXAMPLE: Layout = { tp: 2, cp: 2, pp: 2, dp: 2 };

export interface Table4Row {
  id: string;
  label: string;
  gpus: number;
  tp: number;
  cp: number;
  pp: number;
  dp: number;
  seqLen: number;
  batchPerDp: number;
  tokensPerBatch: string;
  tflops: number;
  mfu: number;
}

export const TABLE4: Table4Row[] = [
  { id: 'a', label: '8,192 GPUs', gpus: 8192, tp: 8, cp: 1, pp: 16, dp: 64, seqLen: 8192, batchPerDp: 32, tokensPerBatch: '16M', tflops: 430, mfu: 43 },
  { id: 'b', label: '16,384 GPUs', gpus: 16384, tp: 8, cp: 1, pp: 16, dp: 128, seqLen: 8192, batchPerDp: 16, tokensPerBatch: '16M', tflops: 400, mfu: 41 },
  { id: 'c', label: '131K context', gpus: 16384, tp: 8, cp: 16, pp: 16, dp: 8, seqLen: 131072, batchPerDp: 16, tokensPerBatch: '16M', tflops: 380, mfu: 38 },
];

export const product = (r: Layout) => r.tp * r.cp * r.pp * r.dp;

export function coords(id: number, l: Layout = EXAMPLE) {
  const tp = id % l.tp;
  const cp = Math.floor(id / l.tp) % l.cp;
  const pp = Math.floor(id / (l.tp * l.cp)) % l.pp;
  const dp = Math.floor(id / (l.tp * l.cp * l.pp)) % l.dp;
  return { TP: tp, CP: cp, PP: pp, DP: dp };
}

/** GPUs that share the group of `id` along dimension `dim`: they differ only in that coordinate. */
export function group(id: number, dim: Dim, l: Layout = EXAMPLE): number[] {
  const c = coords(id, l);
  const n = product(l);
  const out: number[] = [];
  for (let j = 0; j < n; j++) {
    const o = coords(j, l);
    if (DIMS.every((d) => d === dim || o[d] === c[d])) out.push(j);
  }
  return out;
}

/** GPUs per server is 8 (paper). The TP group is the innermost one, so a TP group of 8 fills one server (our reading). */
export const GPUS_PER_SERVER = 8;
