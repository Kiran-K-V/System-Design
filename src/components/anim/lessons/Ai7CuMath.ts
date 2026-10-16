/** Computer-use arithmetic for lesson A7.5. Prices: USD per 1M input tokens, as of 2026-10-16 (claude.com/pricing). Pure functions. */

export interface CuModel {
  id: string;
  name: string;
  input: number;
}

export const CU_MODELS: CuModel[] = [
  { id: 'haiku55', name: 'Haiku 5.5 (prompt up to 100K)', input: 0.1 },
  { id: 'sonnet55', name: 'Sonnet 5.5', input: 2 },
  { id: 'opus55', name: 'Opus 5.5', input: 4 },
];

export type Policy = 'all' | 'last3';

/** Visual tokens for one image on models that accept up to 4784 visual tokens: ceil(w/28) x ceil(h/28). */
export const visualTokens = (w: number, h: number) => Math.ceil(w / 28) * Math.ceil(h / 28);

/** Number of screenshot-sends over n steps. Step k sends min(k, keep) images, or k images when nothing is pruned. */
export function screenshotSends(steps: number, policy: Policy, keep = 3): number {
  let total = 0;
  for (let k = 1; k <= steps; k++) total += policy === 'all' ? k : Math.min(k, keep);
  return total;
}

export interface CuRun {
  sends: number;
  imageTokens: number;
  dollars: number;
  seconds: number;
  success: number;
}

/** Cost, time, and success of an n-step run. Image tokens only; text, system prompt, and output are left out. */
export function cuRun(steps: number, tokensPerShot: number, policy: Policy, pricePerM: number, secondsPerStep: number, perStepSuccess: number): CuRun {
  const sends = screenshotSends(steps, policy);
  const imageTokens = sends * tokensPerShot;
  return {
    sends,
    imageTokens,
    dollars: (imageTokens * pricePerM) / 1e6,
    seconds: steps * secondsPerStep,
    success: Math.pow(perStepSuccess, steps),
  };
}
