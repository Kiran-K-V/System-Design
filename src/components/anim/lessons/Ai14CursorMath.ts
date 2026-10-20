/**
 * Maths for the Cursor teardown (A14.2). Pure functions, no DOM.
 * Published figures are marked PUBLISHED. Everything else is derived here or ILLUSTRATIVE.
 */

/** PUBLISHED (Cursor, 2026-01-27): time-to-first-query, before and after index reuse. Seconds. */
export const REUSE = [
  { label: 'Median repo', before: 7.87, after: 0.525 },
  { label: '90th percentile', before: 2.82 * 60, after: 1.87 },
  { label: '99th percentile', before: 4.03 * 3600, after: 21 },
] as const;

/** PUBLISHED (Cursor, 2024-05-14): the fast-apply speed and its two stated ratios. */
export const APPLY = {
  tokensPerSecond: 1000,
  charsPerSecond: 3500,
  speedupVsVanillaLlama: 13,
  speedupVsPrevGptSpec: 9,
} as const;

/** Files in a tree with the given fan-out and depth (depth = edges from root to a file). */
export function files(fanout: number, depth: number): number {
  return fanout ** depth;
}

/** Hash comparisons to locate ONE changed file: the root, then every child of the diverging node at each level. */
export function merkleCompares(fanout: number, depth: number): number {
  return 1 + fanout * depth;
}

/** Nodes in the whole tree (files, folders, root). */
export function treeNodes(fanout: number, depth: number): number {
  let n = 0;
  for (let d = 0; d <= depth; d++) n += fanout ** d;
  return n;
}

/** Time ratio, before over after. */
export function ratio(before: number, after: number): number {
  return before / after;
}

/** Seconds to write `tokens` at `tps` tokens per second. */
export function secondsAt(tokens: number, tps: number): number {
  return tokens / tps;
}

/** Tokens per second implied by a published ratio against the published 1,000 tokens per second. DERIVED, not published. */
export function impliedBaseline(ratioX: number): number {
  return APPLY.tokensPerSecond / ratioX;
}

export interface SpecPass {
  /** Tokens added to the output in this pass. */
  gained: number;
  note: string;
}

/**
 * ILLUSTRATIVE toy of speculative edits on lines of 10 tokens.
 * The old file has 10 lines. The new output copies lines 1-4 and 7-10 and writes 3 new lines (30 tokens) in place of old lines 5-6.
 * A guess window is 3 lines (30 tokens). A pass accepts the longest correct prefix of the guess, plus one token written by the model.
 */
export function toyPasses(): SpecPass[] {
  const out: SpecPass[] = [];
  out.push({ gained: 30, note: 'guess L1-L3, all accepted' });
  out.push({ gained: 10 + 1, note: 'guess L4-L6: L4 accepted, L5 rejected, model writes first token of N1' });
  for (let i = 0; i < 29; i++) out.push({ gained: 1, note: 'no guess available: one token per pass' });
  out.push({ gained: 30, note: 'guess L7-L9, all accepted' });
  out.push({ gained: 10, note: 'guess L10, accepted' });
  return out;
}

export const TOY_TOKENS = 110;

/** Floor on seconds per token for a memory-bound decode step: weight bytes divided by (GPUs times bandwidth). Lesson A2.2. */
export function decodeFloorTps(weightGB: number, gpus: number, bwGBs: number): number {
  return 1 / (weightGB / (gpus * bwGBs));
}

/** Tokens that must be accepted per pass to reach `tps`, if one pass runs at `floorTps`. ILLUSTRATIVE: ignores that a longer pass costs a little more. */
export function tokensPerPassNeeded(tps: number, floorTps: number): number {
  return tps / floorTps;
}

/** Simple simhash over 8-bit item hashes, as in a textbook. Returns the counters and the bit string. */
export function simhash(items: number[], bits = 8): { counters: number[]; fingerprint: string } {
  const counters = new Array(bits).fill(0);
  for (const h of items) {
    for (let i = 0; i < bits; i++) counters[i] += (h >> (bits - 1 - i)) & 1 ? 1 : -1;
  }
  return { counters, fingerprint: counters.map((c) => (c > 0 ? '1' : '0')).join('') };
}

export function hamming(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}
