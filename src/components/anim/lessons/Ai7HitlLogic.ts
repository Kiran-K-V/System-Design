/** Logic for the A7.3 approval-fatigue model. Illustrative: every input is a stated assumption, not a measurement. */

export const RISKY_SHARE = 0.02; // 2% of actions are risky (assumption)
export const TIER2_SHARE = 0.1; // 10% of actions are irreversible or over the spend limit, and include every risky one (assumption)

export type Policy = 'all' | 'tier2';

export interface Out {
  prompts: number;
  reviewed: number;
  risky: number;
  caught: number;
  missed: number;
}

/** actions: agent actions per hour. capacity: prompts a person can really review per hour. A prompt over capacity is approved without a look. */
export function model(actions: number, capacity: number, policy: Policy): Out {
  const prompts = policy === 'all' ? actions : actions * TIER2_SHARE;
  const reviewed = prompts === 0 ? 1 : Math.min(1, capacity / prompts);
  const risky = actions * RISKY_SHARE;
  const caught = risky * reviewed;
  return { prompts, reviewed, risky, caught, missed: risky - caught };
}
