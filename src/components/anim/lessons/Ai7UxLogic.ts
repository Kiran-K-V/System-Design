/** Logic for lesson A7.10 (agent UX). Line counts are for an illustrative 12-step run. The 97% figure is from Anthropic. */

export type Signal = 'plan' | 'steps' | 'cost' | 'undo' | 'approve';

export const STEPS_IN_RUN = 12;
export const RISKY_STEPS = 3;
export const PLAN_LINES = 5;

/** Questions a user wants answered during a long run. */
export const QUESTIONS = [
  { id: 'now', label: 'What is it doing now?' },
  { id: 'next', label: 'What will it do next?' },
  { id: 'spent', label: 'How much time and money so far?' },
  { id: 'undo', label: 'Can I take it back?' },
  { id: 'stuck', label: 'Is it stuck?' },
] as const;

export type QId = (typeof QUESTIONS)[number]['id'];

export const ANSWERS: Record<Signal, QId[]> = {
  plan: ['next'],
  steps: ['now', 'stuck'],
  cost: ['spent', 'stuck'],
  undo: ['undo'],
  approve: ['now'],
};

/** UI lines a signal adds to the screen for the illustrative run. */
export const LINES: Record<Signal, number> = {
  plan: PLAN_LINES,
  steps: STEPS_IN_RUN,
  cost: 1,
  undo: 1,
  approve: RISKY_STEPS,
};

export function summary(on: Signal[]) {
  const answered = new Set<QId>();
  let lines = 0;
  for (const s of on) {
    ANSWERS[s].forEach((q) => answered.add(q));
    lines += LINES[s];
  }
  return { answered: [...answered], lines };
}

/** Anthropic reports that users approve 97% of permission prompts. */
export const APPROVE_RATE = 0.97;

/** Expected rejections among n prompts, and how many prompts pass per rejection. */
export function fatigue(n: number) {
  const reject = 1 - APPROVE_RATE;
  return { rejections: n * reject, perRejection: 1 / reject };
}
