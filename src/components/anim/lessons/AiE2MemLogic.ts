/** Shared math for lessons E2.2 and E2.3. Pure functions, no React. Source: ZeRO paper (2 + 2 + K bytes per parameter, K = 12 for Adam in mixed precision). */

export const PARTS = [
  { id: 'weights', label: 'Weights (16-bit)', bytes: 2 },
  { id: 'grads', label: 'Gradients (16-bit)', bytes: 2 },
  { id: 'master', label: 'Master weights (32-bit)', bytes: 4 },
  { id: 'momentum', label: 'Momentum (32-bit)', bytes: 4 },
  { id: 'variance', label: 'Variance (32-bit)', bytes: 4 },
] as const;

export const BYTES_PER_PARAM = PARTS.reduce((n, p) => n + p.bytes, 0); // 16
export const OPT_BYTES = 12; // master + momentum + variance

export interface TrainModel {
  id: string;
  label: string;
  params: number;
}
/** Nominal sizes. 1.5B and 7.5B are the examples used in the ZeRO paper. */
export const TRAIN_MODELS: TrainModel[] = [
  { id: '1.5b', label: '1.5B (GPT-2 size)', params: 1.5e9 },
  { id: '7.5b', label: '7.5B (ZeRO paper)', params: 7.5e9 },
  { id: '8b', label: '8B (Llama 3)', params: 8e9 },
  { id: '70b', label: '70B (Llama 3)', params: 70e9 },
  { id: '405b', label: '405B (Llama 3)', params: 405e9 },
];

export const GPU_BYTES = 80e9; // one 80 GB H100 SXM

export const model = (id: string) => TRAIN_MODELS.find((m) => m.id === id) ?? TRAIN_MODELS[0];

/** Total model-state bytes (weights + grads + optimizer), before activations. */
export const stateBytes = (params: number) => BYTES_PER_PARAM * params;

/** Fewest 80 GB GPUs whose combined memory could hold the states, ignoring activations. */
export const minGpus = (params: number, gpuBytes = GPU_BYTES) => Math.ceil(stateBytes(params) / gpuBytes);

export type Stage = 0 | 1 | 2 | 3;

/** Per-GPU model-state bytes under ZeRO stage 0 (plain data parallel) to 3, with nd data-parallel GPUs. */
export function perGpuState(params: number, stage: Stage, nd: number): number {
  const p = params;
  switch (stage) {
    case 0:
      return 16 * p;
    case 1:
      return 4 * p + (OPT_BYTES * p) / nd;
    case 2:
      return 2 * p + ((2 + OPT_BYTES) * p) / nd;
    case 3:
      return (16 * p) / nd;
  }
}

/** Per-step communication volume per GPU, in multiples of the parameter count, as the ZeRO paper states it: 2 for DP, ZeRO-1 and ZeRO-2; 3 for ZeRO-3. */
export const commVolume = (stage: Stage) => (stage === 3 ? 3 : 2);

/** Which of the 5 parts one GPU keeps whole (1) or one share of (1/nd). */
export function partFraction(partId: string, stage: Stage, nd: number): number {
  const opt = partId === 'master' || partId === 'momentum' || partId === 'variance';
  if (opt) return stage >= 1 ? 1 / nd : 1;
  if (partId === 'grads') return stage >= 2 ? 1 / nd : 1;
  return stage >= 3 ? 1 / nd : 1;
}
