/** Logic for the verifier-quality slider in lesson A6.4. Pure functions, no React. Illustrative model, not measured data. */

export interface LoopResult {
  /** Chance the returned answer is correct. */
  correct: number;
  /** Chance a wrong answer passed the verifier and was returned as if it were fine. */
  wrongAccepted: number;
  /** Chance the round cap hit and the last answer, which was wrong, was returned. */
  wrongAtCap: number;
  /** Expected number of generate-and-check rounds. */
  rounds: number;
  /** Chance the loop ran all R rounds without an accept. */
  hitCap: number;
}

/**
 * Generate, check, retry up to R rounds.
 * g: chance one generation is correct. Rounds are independent: feedback does not raise g.
 * q: verifier accuracy. It accepts a correct answer with probability q and rejects a wrong one with probability q.
 * A rejected answer is regenerated. After round R the last answer is returned whatever the verdict.
 */
export function verifierLoop(g: number, q: number, R: number): LoopResult {
  const rej = g * (1 - q) + (1 - g) * q;
  let reach = 1;
  let correct = 0;
  let wrongAccepted = 0;
  let wrongAtCap = 0;
  let rounds = 0;
  for (let r = 1; r <= R; r++) {
    rounds += reach;
    wrongAccepted += reach * (1 - g) * (1 - q);
    if (r < R) {
      correct += reach * g * q;
      reach *= rej;
    } else {
      correct += reach * g;
      wrongAtCap += reach * (1 - g) * q;
    }
  }
  return { correct, wrongAccepted, wrongAtCap, rounds, hitCap: Math.pow(rej, R) };
}

/** Input tokens over R rounds when each round resends a start prompt plus all earlier rounds. Each round adds `grow` tokens. */
export function roundsInput(start: number, grow: number, R: number): number {
  return R * start + grow * ((R * (R - 1)) / 2);
}
