/** Logic for lesson A4.1. Illustrative eval data: 8 cases, 5 prompt versions. Not from a real model run. */

export const CASES = [
  'Plain refund request',
  'Refund with order id',
  'Empty message',
  'Non-English message',
  'Very long message',
  'Sarcastic complaint',
  'Two requests in one',
  'Injection attempt',
];

export interface PromptVersion {
  id: string;
  change: string;
  /** One entry per case. true = the output passed the check. */
  pass: boolean[];
}

const p = (s: string) => s.split('').map((c) => c === '1');

export const VERSIONS: PromptVersion[] = [
  { id: 'v1', change: 'First draft: one paragraph of instructions.', pass: p('11001000') },
  { id: 'v2', change: 'Add an output format and a field list.', pass: p('11001110') },
  { id: 'v3', change: 'Add a rule for empty input.', pass: p('11101110') },
  { id: 'v4', change: 'Add "always answer in the user\'s language, keep it short".', pass: p('11110000') },
  { id: 'v5', change: 'Rewrite v4 as two separate rules, with one example.', pass: p('11111110') },
];

export const score = (v: PromptVersion) => v.pass.filter(Boolean).length;

/** Cases that failed in `prev` and pass in `next` (fixed), and the reverse (broken). */
export function diffCases(prev: PromptVersion, next: PromptVersion) {
  const fixed: number[] = [];
  const broken: number[] = [];
  next.pass.forEach((ok, i) => {
    if (ok && !prev.pass[i]) fixed.push(i);
    if (!ok && prev.pass[i]) broken.push(i);
  });
  return { fixed, broken };
}

export type GateRule = 'score' | 'no-regress';

/** Release gate. 'score': total must not fall. 'no-regress': no case that passed may now fail. */
export function gate(prev: PromptVersion, next: PromptVersion, rule: GateRule) {
  const { broken } = diffCases(prev, next);
  const ok = rule === 'score' ? score(next) >= score(prev) : broken.length === 0;
  return ok;
}
