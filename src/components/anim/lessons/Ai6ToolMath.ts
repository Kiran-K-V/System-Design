/** Arithmetic for the tool-definition cost calculator in lesson A6.5. Prices: USD per 1M input tokens, as of 2026-10-16 (claude.com/pricing). Pure functions. */

export interface ToolPriceModel {
  id: 'sonnet55' | 'opus55' | 'haiku55';
  name: string;
  /** Base input price per 1M tokens. */
  input: number;
  /** Cache read as a multiple of the base price. */
  readMult: number;
  /** Cache write (5 minute) as a multiple of the base price. */
  writeMult: number;
}

export const TOOL_MODELS: ToolPriceModel[] = [
  { id: 'sonnet55', name: 'Sonnet 5.5 ($2)', input: 2, readMult: 0.05, writeMult: 1.25 },
  { id: 'opus55', name: 'Opus 5.5 ($4)', input: 4, readMult: 0.05, writeMult: 1.25 },
  { id: 'haiku55', name: 'Haiku 5.5 ($0.10)', input: 0.1, readMult: 0.1, writeMult: 1.25 },
];

export interface ToolCost {
  /** Tokens of tool definitions sent in one model call. */
  perCall: number;
  /** Tokens of tool definitions sent across all model calls of one task. */
  perTask: number;
  /** Dollars for those tokens, one task, no caching. */
  taskUncached: number;
  /** Dollars for those tokens, one task. First call writes the cache, the rest read it. */
  taskCached: number;
}

/** n tools, t tokens per definition, calls model calls per task (the API is stateless, so each call resends every definition). */
export function toolCost(n: number, t: number, calls: number, m: ToolPriceModel): ToolCost {
  const perCall = n * t;
  const perTask = perCall * calls;
  const unit = (perCall * m.input) / 1e6;
  return {
    perCall,
    perTask,
    taskUncached: unit * calls,
    taskCached: calls <= 0 ? 0 : unit * (m.writeMult + (calls - 1) * m.readMult),
  };
}
