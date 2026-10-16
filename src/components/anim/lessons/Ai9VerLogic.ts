/** Logic for lesson A9.3 (versioning). Pure functions. Numbers in the demos are illustrative. */

/** FNV-1a hash, 32 bit, as 6 hex characters. A real content hash of the text, so a one-character edit gives a new value. */
export function shortHash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6);
}

export interface Manifest {
  prompt: string;
  model: string;
  tools: string;
  index: string;
  settings: string;
}

export const ROWS: { key: keyof Manifest; label: string }[] = [
  { key: 'prompt', label: 'Prompt' },
  { key: 'model', label: 'Model ID' },
  { key: 'tools', label: 'Tools' },
  { key: 'index', label: 'Search index' },
  { key: 'settings', label: 'Settings' },
];

/** The release id is the hash of every field together. Change one field and the id changes. */
export function releaseId(m: Manifest): string {
  return shortHash(ROWS.map((r) => `${r.key}=${m[r.key]}`).join('\n'));
}

/** Release r12 and r13 of the demo support bot. Prompt and tools are shown as the hash of their text. */
export const R12_TEXT = {
  prompt: 'You are a support agent. Be brief and polite.',
  tools: 'search_orders: Find a customer order by id or email.',
};
export const R13_TEXT = {
  prompt: 'You are a support agent. Be brief, polite, and warm.',
  tools: 'search_orders: Look up orders. Use for any question about a customer.',
};

export const R12: Manifest = {
  prompt: shortHash(R12_TEXT.prompt),
  model: 'claude-sonnet-5-5',
  tools: shortHash(R12_TEXT.tools),
  index: 'idx-7',
  settings: 'max_tokens 2048',
};
export const R13: Manifest = {
  prompt: shortHash(R13_TEXT.prompt),
  model: 'claude-sonnet-5-5',
  tools: shortHash(R13_TEXT.tools),
  index: 'idx-8',
  settings: 'max_tokens 1024',
};

export function changedKeys(a: Manifest, b: Manifest): (keyof Manifest)[] {
  return ROWS.map((r) => r.key).filter((k) => a[k] !== b[k]);
}

/** Standard error of a pass rate measured on n cases, in percentage points. */
export function stdErrPoints(passRate: number, n: number): number {
  return Math.sqrt((passRate * (1 - passRate)) / n) * 100;
}

/** Wald 95% half-width of a failure rate, in percentage points. */
export function halfWidth95(rate: number, n: number): number {
  return 1.96 * Math.sqrt((rate * (1 - rate)) / n) * 100;
}

export type Reason = 'wrong_tool' | 'bad_format' | 'no_answer';

export interface Release {
  id: string;
  label: string;
  change: string;
  /** Failure counts out of N traces, by reason. */
  fails: Record<Reason, number>;
}

export const N_TRACES = 300;

/** Four releases, each with one change. Illustrative counts. The tool text release doubles the failure rate. */
export const RELEASES: Release[] = [
  { id: 'r1', label: 'r1', change: 'Baseline', fails: { wrong_tool: 9, bad_format: 12, no_answer: 6 } },
  { id: 'r2', label: 'r2', change: 'Prompt edit', fails: { wrong_tool: 9, bad_format: 15, no_answer: 6 } },
  { id: 'r3', label: 'r3', change: 'New search index', fails: { wrong_tool: 9, bad_format: 12, no_answer: 12 } },
  { id: 'r4', label: 'r4', change: 'Tool text rewrite', fails: { wrong_tool: 42, bad_format: 15, no_answer: 9 } },
];

export const failTotal = (r: Release) => r.fails.wrong_tool + r.fails.bad_format + r.fails.no_answer;

/** Deterministic spread of failing traces across a grid of N slots, so the dots look scattered. */
export function failSlots(n: number, fails: number, seed: number): boolean[] {
  const slots = Array.from({ length: n }, (_, i) => i);
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const bad = new Set(slots.slice(0, fails));
  return Array.from({ length: n }, (_, i) => bad.has(i));
}

/** Days from a to b (UTC dates). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

/** Tokens after a tokenizer change that yields about 30% more tokens for the same text. */
export function tokensAfterSwap(tokens: number, factor = 1.3): number {
  return Math.round(tokens * factor);
}
