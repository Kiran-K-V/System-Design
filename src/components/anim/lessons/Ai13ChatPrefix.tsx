import { DesignCompare, type CompareVariant } from '../DesignBuild';
import type { FlowNode } from '../FlowDiagram';
import { prefillSeconds } from './Ai13ChatMath';

/**
 * What each history strategy does to the cached prefix of a chat.
 * ILLUSTRATIVE sizes: system prompt 500 tokens, every turn 300 tokens (100 user + 200 answer), new message 100 tokens.
 * Time is the prefill time of one 8-card Llama 3.1 70B replica at 40% of peak (Ai13ChatMath.ts). The engine caches the
 * KV of the answers it wrote, so a turn with no change needs prefill only for the new user message.
 */

const ms = (rest: number, total: number) => Math.round(prefillSeconds(rest, total) * 1000);
const n = (x: number) => x.toLocaleString('en-US');
const pct = (hit: number, total: number) => `${Math.round((hit / total) * 100)}%`;

const SYS = 500;
const TURN = 300;
const NEW = 100;
const HELD = SYS + 8 * TURN;
const FULL = HELD + NEW;

type Tone = FlowNode['tone'];

const row = (labels: string[]): FlowNode[] => {
  const step = labels.length > 10 ? 56 : 66;
  const w = labels.length > 10 ? 46 : 52;
  return labels.map((label, i) => ({ id: `n${i}`, x: 360 + (i - (labels.length - 1) / 2) * step, y: 110, w, h: 44, label }));
};

/** Build a tone map: every node gets `base`, then each [from, to, tone] range overrides it. */
const tones = (count: number, base: Tone, spec: [number, number, Tone][]) => {
  const m: Record<string, Tone> = {};
  for (let i = 0; i < count; i++) m[`n${i}`] = base;
  spec.forEach(([a, b, t]) => {
    for (let i = a; i <= b; i++) m[`n${i}`] = t;
  });
  return m;
};

const note = (text: string, tone: Tone = 'muted') => ({ x: 360, y: 205, text, anchor: 'middle' as const, size: 16, tone });
const legend = { x: 360, y: 262, text: 'green: read from cache   red: recomputed   amber: new text   grey: unused', anchor: 'middle' as const, size: 14, tone: 'muted' as const };
const reuse = (hit: number, total: number, tone: Tone) => note(`reused ${n(hit)} of ${n(total)} tokens (${pct(hit, total)}), prefill ${ms(total - hit, total)} ms`, tone);

const T10 = ['Sys', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'New'];
const baseMs = ms(NEW, FULL);

const append: CompareVariant = {
  id: 'append',
  label: 'Append only',
  nodes: row(T10),
  notes: [legend],
  steps: [
    { caption: `Eight turns are done. The engine holds the cached work for the system prompt (Sys) and turns T1 to T8: 500 + 8 x 300 = ${n(HELD)} tokens. Turn 9 is about to arrive.`, tones: tones(10, 'ok', [[9, 9, 'muted']]), notes: [note(`engine holds ${n(HELD)} tokens of this chat`)] },
    { caption: `The new request is the old one plus the new message. It matches the cache for its first ${n(HELD)} tokens. Only the ${NEW} new tokens need prefill. This is the reference for the other strategies: about ${baseMs} ms.`, tones: tones(10, 'ok', [[9, 9, 'warn']]), notes: [reuse(HELD, FULL, 'ok')] },
  ],
};

const EDIT_HIT = SYS + TURN;
const edit: CompareVariant = {
  id: 'edit',
  label: 'Edit an early turn',
  nodes: row(T10),
  notes: [legend],
  steps: [
    { caption: 'The same state as before: 2,900 tokens cached.', tones: tones(10, 'ok', [[9, 9, 'muted']]), notes: [note(`engine holds ${n(HELD)} tokens of this chat`)] },
    { caption: 'The user edits turn 2 and regenerates. The prompt now differs from the cache at T2. The match runs only up to the edit, which is Sys and T1.', tones: tones(10, 'bad', [[0, 1, 'ok'], [9, 9, 'warn']]), notes: [reuse(EDIT_HIT, FULL, 'bad')] },
    { caption: `T3 to T8 did not change, but their cached work was built after the old T2, so it cannot be reused. The engine prefills ${n(FULL - EDIT_HIT)} tokens in about ${ms(FULL - EDIT_HIT, FULL)} ms, ${Math.round(ms(FULL - EDIT_HIT, FULL) / baseMs)} times the append turn.`, tones: tones(10, 'bad', [[0, 1, 'ok'], [9, 9, 'warn']]), notes: [reuse(EDIT_HIT, FULL, 'bad')] },
  ],
};

const T11 = ['Sys', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'New'];
const SLIDE_TOTAL = SYS + 8 * TURN + NEW;
const slide: CompareVariant = {
  id: 'slide',
  label: 'Slide window every turn',
  nodes: row(T11),
  notes: [legend],
  steps: [
    { caption: 'A window keeps the last 8 turns. Turn 9 was served with Sys and T1 to T8, and now T9 is done too. The engine holds Sys and T1 to T9.', tones: tones(11, 'ok', [[10, 10, 'muted']]), notes: [note(`engine holds ${n(SYS + 9 * TURN)} tokens`)] },
    { caption: 'Turn 10 arrives. The window slides: T1 is dropped and T2 to T9 stay. Now T2 sits where T1 was. The first tokens after Sys differ, so the match ends right after Sys.', tones: tones(11, 'bad', [[0, 0, 'ok'], [1, 1, 'muted'], [10, 10, 'warn']]), notes: [reuse(SYS, SLIDE_TOTAL, 'bad')] },
    { caption: `Every turn after the window fills slides it again, so every turn is a near-total miss: ${n(SLIDE_TOTAL - SYS)} tokens in about ${ms(SLIDE_TOTAL - SYS, SLIDE_TOTAL)} ms, ${Math.round(ms(SLIDE_TOTAL - SYS, SLIDE_TOTAL) / baseMs)} times the append turn. The window shortened the prompt and made the cache useless.`, tones: tones(11, 'bad', [[0, 0, 'ok'], [1, 1, 'muted'], [10, 10, 'warn']]), notes: [reuse(SYS, SLIDE_TOTAL, 'bad')] },
  ],
};

const CUT_TOTAL = SYS + 4 * TURN + NEW;
const chunk: CompareVariant = {
  id: 'chunk',
  label: 'Slide in chunks',
  nodes: row(T10),
  notes: [legend],
  steps: [
    { caption: 'Same window idea, new rule: drop old turns 4 at a time, only when the prompt passes a size limit. Between cuts the prompt only grows at the end.', tones: tones(10, 'ok', [[9, 9, 'muted']]), notes: [note(`engine holds ${n(HELD)} tokens of this chat`)] },
    { caption: 'Between cuts it behaves like append only: almost all of the prompt is reused.', tones: tones(10, 'ok', [[9, 9, 'warn']]), notes: [reuse(HELD, FULL, 'ok')] },
    { caption: `At the cut, T1 to T4 are dropped at once. The prompt is now Sys, T5 to T8, and the new message: ${n(CUT_TOTAL)} tokens. The match ends after Sys, so this one turn misses, in about ${ms(CUT_TOTAL - SYS, CUT_TOTAL)} ms. It happens once in 4 turns, not every turn.`, tones: tones(10, 'bad', [[0, 0, 'ok'], [1, 4, 'muted'], [9, 9, 'warn']]), notes: [reuse(SYS, CUT_TOTAL, 'warn')] },
  ],
};

const T12 = ['Sys', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'Sum', 'T7', 'T8', 'New'];
const SUM_TOK = 200;
const SUM_PROMPT = SYS + SUM_TOK + 2 * TURN + NEW;
const summarize: CompareVariant = {
  id: 'summary',
  label: 'Summarize once',
  nodes: row(T12),
  notes: [legend],
  steps: [
    { caption: 'Same state. The product decides that T1 to T6 (1,800 tokens) become a 200-token summary (Sum), and keeps T7 and T8 word for word.', tones: tones(11, 'ok', [[7, 7, 'muted'], [10, 10, 'muted']]), notes: [note(`engine holds ${n(HELD)} tokens of this chat`)] },
    { caption: `The new prompt is Sys, Sum, T7, T8, and the new message: ${n(SUM_PROMPT)} tokens. Sum is new text right after Sys, so the match ends after Sys. This turn pays one extra model call to write the summary (not counted here) and misses the cache.`, tones: tones(11, 'bad', [[0, 0, 'ok'], [1, 6, 'muted'], [7, 7, 'warn'], [10, 10, 'warn']]), notes: [reuse(SYS, SUM_PROMPT, 'bad')] },
    { caption: `Next turn, Sum is part of the stable front. The prompt is ${n(SUM_PROMPT + TURN)} tokens and ${n(SUM_PROMPT + 200)} of them are reused. The prompt stays ${n(FULL - SUM_PROMPT)} tokens shorter than append only. The price is that detail in T1 to T6 is now a summary.`, tones: tones(11, 'ok', [[1, 6, 'muted'], [10, 10, 'warn']]), notes: [reuse(SUM_PROMPT + 200, SUM_PROMPT + TURN, 'ok')] },
  ],
};

export default function Ai13ChatPrefix() {
  return <DesignCompare title="History strategy and the cached prefix" prompt="Strategy:" variants={[append, edit, slide, chunk, summarize]} height={290} label="Boxes for the system prompt and chat turns coloured by whether the engine can reuse their cached work under five history strategies" />;
}
