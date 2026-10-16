/** Logic for the long-running-context widgets in lesson A6.9. Pure functions, no React. All sizes are illustrative. */

export const WINDOW = 200000;
/** Tokens a cleared tool result still costs (the placeholder text). Illustrative. */
export const PLACEHOLDER = 20;
/** Sonnet 5.5 list price per million tokens, as of 2026-10-16 (claude.com/pricing). */
export const PRICE_IN = 2;
export const PRICE_OUT = 10;

export interface CtxOpts {
  steps: number;
  /** Tokens of model output (reasoning, tool call) added per step. */
  out: number;
  /** Tokens of tool result added per step. */
  tool: number;
  /** System prompt, tool definitions, task. */
  base: number;
  clear: boolean;
  /** Clear when the next call would carry at least this many tokens. */
  threshold: number;
  /** Tool results from this many latest steps stay in full. */
  keep: number;
  /** Append a short note to a notes file every NOTE_EVERY steps. The call stays in context. */
  notes: boolean;
}

export const NOTE_EVERY = 5;
export const NOTE_TOKENS = 200;

export interface Frame {
  /** Tokens sent as input on this call. */
  ctx: number;
  base: number;
  out: number;
  tool: number;
  placeholder: number;
  notes: number;
  cleared: boolean;
}

export interface Run {
  frames: Frame[];
  /** Index (1-based) of the first call whose input would not fit, or null. */
  overflowAt: number | null;
  /** Calls made, up to the overflow. */
  calls: number;
  peak: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  clearEvents: number;
}

export function simulate(o: CtxOpts): Run {
  const tools: number[] = [];
  let noteTok = 0;
  const frames: Frame[] = [];
  let overflowAt: number | null = null;
  let clearEvents = 0;
  for (let k = 1; k <= o.steps; k++) {
    let cleared = false;
    const size = () => o.base + noteTok + tools.length * o.out + tools.reduce((a, b) => a + b, 0);
    if (o.clear && size() >= o.threshold) {
      for (let j = 0; j < tools.length - o.keep; j++) {
        if (tools[j] > PLACEHOLDER) {
          tools[j] = PLACEHOLDER;
          cleared = true;
        }
      }
      if (cleared) clearEvents++;
    }
    const ph = tools.filter((t) => t === PLACEHOLDER && o.tool > PLACEHOLDER).length * PLACEHOLDER;
    const toolFull = tools.reduce((a, b) => a + b, 0) - ph;
    const ctx = size();
    if (ctx > WINDOW) {
      overflowAt = k;
      break;
    }
    frames.push({ ctx, base: o.base, out: tools.length * o.out, tool: toolFull, placeholder: ph, notes: noteTok, cleared });
    tools.push(o.tool);
    if (o.notes && k % NOTE_EVERY === 0) noteTok += NOTE_TOKENS;
  }
  const calls = frames.length;
  const inputTokens = frames.reduce((a, f) => a + f.ctx, 0);
  const outputTokens = calls * o.out;
  return {
    frames,
    overflowAt,
    calls,
    peak: frames.reduce((a, f) => Math.max(a, f.ctx), 0),
    inputTokens,
    outputTokens,
    cost: (inputTokens * PRICE_IN + outputTokens * PRICE_OUT) / 1e6,
    clearEvents,
  };
}

/** The two runs shown in the step-through: same agent, with and without clearing plus notes. */
export const WALK = { steps: 50, out: 500, tool: 4000, base: 5000, threshold: 100000, keep: 3 };
export const walkPlain = () => simulate({ ...WALK, clear: false, notes: false });
export const walkManaged = () => simulate({ ...WALK, clear: true, notes: true });
