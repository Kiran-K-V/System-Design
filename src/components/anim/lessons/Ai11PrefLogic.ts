/** Logic for the A11.3 preference-tuning visuals. Pure functions. The toy numbers are illustrative. */

export const BETA = 0.1;

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * DPO loss for one pair. dw and dl are log-ratios: log(policy prob / reference prob)
 * of the chosen and the rejected answer, summed over their tokens (in nats).
 */
export function dpoLoss(dw: number, dl: number, beta = BETA): number {
  return -Math.log(sigmoid(beta * (dw - dl)));
}

/** The implicit reward margin: beta times the gap between the two log-ratios. */
export function margin(dw: number, dl: number, beta = BETA): number {
  return beta * (dw - dl);
}

/** Gradient weight from the DPO paper: sigmoid(r_l - r_w). It is large when the model still ranks the pair wrong. */
export function pullWeight(dw: number, dl: number, beta = BETA): number {
  return sigmoid(beta * (dl - dw));
}

export interface DpoState {
  /** Log-ratio of the chosen answer against the frozen reference. */
  dw: number;
  /** Log-ratio of the rejected answer. */
  dl: number;
}

export const DPO_STATES: DpoState[] = [
  { dw: 0, dl: 0 },
  { dw: 1, dl: -1.5 },
  { dw: 2, dl: -4 },
  { dw: 3, dl: -8 },
  { dw: -2, dl: -9 },
];

/** One preference pair, with the length of each answer in tokens. Illustrative. */
export interface LenPair {
  chosen: number;
  rejected: number;
}

export const LEN_PAIRS: LenPair[] = [
  { chosen: 420, rejected: 260 },
  { chosen: 510, rejected: 300 },
  { chosen: 400, rejected: 380 },
  { chosen: 600, rejected: 350 },
  { chosen: 450, rejected: 210 },
  { chosen: 300, rejected: 310 },
  { chosen: 520, rejected: 280 },
  { chosen: 470, rejected: 430 },
  { chosen: 350, rejected: 200 },
  { chosen: 560, rejected: 330 },
  { chosen: 290, rejected: 340 },
  { chosen: 480, rejected: 250 },
  { chosen: 330, rejected: 350 },
  { chosen: 410, rejected: 400 },
  { chosen: 360, rejected: 430 },
  { chosen: 440, rejected: 410 },
];

/** Relative length gap: |c - r| / max(c, r). */
export const gapOf = (p: LenPair) => Math.abs(p.chosen - p.rejected) / Math.max(p.chosen, p.rejected);

/** Keep the pairs whose answers differ in length by at most `maxGap` (0 to 1). */
export function keepPairs(pairs: LenPair[], maxGap: number): boolean[] {
  return pairs.map((p) => gapOf(p) <= maxGap + 1e-9);
}

export interface LenStats {
  kept: number;
  /** Share of kept pairs where the chosen answer is the longer one. */
  longerWins: number;
  /** Mean of (chosen - rejected) tokens over kept pairs. */
  meanGap: number;
}

export function lenStats(pairs: LenPair[], keep: boolean[]): LenStats {
  const k = pairs.filter((_, i) => keep[i]);
  if (k.length === 0) return { kept: 0, longerWins: 0, meanGap: 0 };
  const wins = k.filter((p) => p.chosen > p.rejected).length;
  const gap = k.reduce((s, p) => s + (p.chosen - p.rejected), 0) / k.length;
  return { kept: k.length, longerWins: wins / k.length, meanGap: gap };
}
