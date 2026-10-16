/** Context growth simulator for lesson A4.4. Pure functions. Sizes in tokens.
 *
 * Model (all assumptions are ours):
 * - Each turn adds `perTurn` tokens. A share `toolShare` of them are tool results.
 * - Tool-result clearing (opt-in): when the context reaches `clearAt`, every tool result is cleared except
 *   those of the last `keep` turns. A cleared result is counted as 0 tokens (the real placeholder is a few tokens).
 * - Compaction (opt-in): when the context reaches `compactAt`, all of it is replaced by `summary` tokens.
 * - The check runs after the turn is added. Clearing runs before compaction.
 */
export interface SimOpts {
  turns: number;
  perTurn: number;
  toolShare: number;
  clearing: boolean;
  clearAt: number;
  keep: number;
  compaction: boolean;
  compactAt: number;
  summary: number;
}

export interface SimResult {
  /** Context size after each turn. Index 0 is turn 1. */
  size: number[];
  clearEvents: number[];
  compactEvents: number[];
}

export function simulate(o: SimOpts): SimResult {
  // Each live turn: [total tokens, tool tokens still present]
  let live: { all: number; tool: number }[] = [];
  let base = 0; // summary tokens
  const size: number[] = [];
  const clearEvents: number[] = [];
  const compactEvents: number[] = [];
  const total = () => base + live.reduce((a, t) => a + t.all, 0);
  for (let t = 1; t <= o.turns; t++) {
    live.push({ all: o.perTurn, tool: o.perTurn * o.toolShare });
    if (o.clearing && total() >= o.clearAt) {
      const cut = live.length - o.keep;
      let freed = 0;
      for (let i = 0; i < cut; i++) {
        freed += live[i].tool;
        live[i] = { all: live[i].all - live[i].tool, tool: 0 };
      }
      if (freed > 0) clearEvents.push(t);
    }
    if (o.compaction && total() >= o.compactAt) {
      live = [];
      base = o.summary;
      compactEvents.push(t);
    }
    size.push(total());
  }
  return { size, clearEvents, compactEvents };
}

/** First turn (1-based) at which context size reaches `window`, or null. */
export function firstFull(size: number[], window: number): number | null {
  const i = size.findIndex((s) => s >= window);
  return i === -1 ? null : i + 1;
}
