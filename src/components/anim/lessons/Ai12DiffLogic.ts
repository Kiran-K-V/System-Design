/** Logic for the A12.3 diffusion-serving visuals. Pure functions. */

/** Step time from the Salad benchmark: 4.3 s per image at 50 steps on an A100 (AWS), chart value. */
export const SALAD_A100_SEC = 4.3;
export const SALAD_STEPS = 50;
/** Total image time divided by steps. It folds in the text encoder and the VAE decode. */
export const STEP_SEC = SALAD_A100_SEC / SALAD_STEPS;
/** Lambda on-demand A100 SXM 80 GB, dollars per GPU-hour, as of 2026-10-18. */
export const A100_HOUR = 2.79;

/** Seconds per image: steps x step time. */
export function latency(steps: number, stepSec = STEP_SEC): number {
  return steps * stepSec;
}

export function imagesPerHour(secPerImage: number): number {
  return 3600 / secPerImage;
}

/** GPU cost of one image when the GPU is busy all the time. */
export function costPerImage(gpuHour: number, secPerImage: number): number {
  return gpuHour / imagesPerHour(secPerImage);
}

/** Cost when the GPU is busy only a share `util` (0 to 1) of the paid time. */
export function costAtUtil(gpuHour: number, secPerImage: number, util: number): number {
  return costPerImage(gpuHour, secPerImage) / util;
}

/** Replicas the HPA formula asks for: ceil(current x metric / target). */
export function desiredReplicas(current: number, metric: number, target: number): number {
  return Math.ceil(current * (metric / target));
}

export type Mode = 'standard' | 'distilled';

/** ILLUSTRATIVE quality score from 0 to 1. Made up to show the shape: standard keeps gaining until about 30 steps, distilled models are tuned to be good in 1 to 4. */
export function quality(steps: number, mode: Mode): number {
  return mode === 'standard' ? 1 - Math.exp(-steps / 9) : 0.92 * (1 - Math.exp(-steps / 1.0));
}
