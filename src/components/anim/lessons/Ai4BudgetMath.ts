/** Context budget arithmetic for lesson A4.3. Pure functions. Sizes in tokens. */

export interface Budget {
  window: number;
  system: number;
  tools: number;
  examples: number;
  docs: number;
  history: number;
  /** Space kept free for the reply (max_tokens, including thinking). */
  reserve: number;
}

export const inputTokens = (b: Budget) => b.system + b.tools + b.examples + b.docs + b.history;

/** Tokens left after the input and the output reservation. Negative means the reply can be cut off. */
export const headroom = (b: Budget) => b.window - inputTokens(b) - b.reserve;

/** Whole turns of history that still fit. Each turn adds `perTurn` tokens. */
export const turnsLeft = (b: Budget, perTurn: number) => Math.max(0, Math.floor(headroom(b) / perTurn));

/** Whole turns until `window` fills, with `fixed` tokens already used and `perTurn` added each turn. */
export const turnsUntilFull = (window: number, fixed: number, perTurn: number) => Math.max(0, Math.floor((window - fixed) / perTurn));
