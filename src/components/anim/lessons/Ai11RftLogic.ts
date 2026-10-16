/** Logic for the A11.4 reinforcement fine-tuning visuals. Pure functions. */

export interface Adv {
  mean: number;
  std: number;
  adv: number[];
}

/** GRPO advantage (DeepSeekMath): (reward - group mean) / group standard deviation. Zero when every reward is equal. */
export function advantages(rewards: number[]): Adv {
  const n = rewards.length;
  const mean = rewards.reduce((s, r) => s + r, 0) / n;
  const std = Math.sqrt(rewards.reduce((s, r) => s + (r - mean) ** 2, 0) / n);
  return { mean, std, adv: rewards.map((r) => (std === 0 ? 0 : (r - mean) / std)) };
}

/** Chance that a group of G samples at pass rate p holds at least one right and one wrong answer (so it gives a signal). */
export function pInformative(p: number, g: number): number {
  return 1 - p ** g - (1 - p) ** g;
}

/** Samples you pay for per prompt that teaches something. Infinity when no signal is possible. */
export function samplesPerSignal(p: number, g: number): number {
  const q = pInformative(p, g);
  return q <= 0 ? Infinity : g / q;
}
