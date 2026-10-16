/** Logic for the pattern chooser in lesson A6.2. Pure functions, no React. Rules follow the "when to use" text of Anthropic's Building effective agents. */

export type Pattern = 'single' | 'chain' | 'routing' | 'parallel' | 'orchestrator' | 'evaluator' | 'agent';

export type Steps = 'fixed' | 'listable' | 'unknown';

export interface Traits {
  /** One well-prompted call already meets the quality bar. */
  oneCallEnough: boolean;
  /** Can you list the steps before the run starts? */
  steps: Steps;
  /** Inputs fall into distinct categories that need different handling. */
  categories: boolean;
  /** Subtasks do not depend on each other. */
  independent: boolean;
  /** Feedback improves the draft and a model can give that feedback. */
  feedback: boolean;
}

export const NAMES: Record<Pattern, string> = {
  single: 'One call',
  chain: 'Prompt chaining',
  routing: 'Routing',
  parallel: 'Parallelization',
  orchestrator: 'Orchestrator-workers',
  evaluator: 'Evaluator-optimizer',
  agent: 'Autonomous agent',
};

export interface Pick {
  pattern: Pattern;
  why: string;
}

/** The first rule that matches wins. Order runs from the simplest shape to the most autonomous. */
export function choose(t: Traits): Pick {
  if (t.oneCallEnough) return { pattern: 'single', why: 'Start with the simplest thing that meets the bar. One call, with retrieval or examples if needed, has no loop to fail.' };
  if (t.steps === 'unknown') return { pattern: 'agent', why: 'You cannot predict the number of steps or hard-code a path, so the model must choose its own steps. Add budgets and test in a sandbox.' };
  if (t.steps === 'listable') return { pattern: 'orchestrator', why: 'The subtasks vary per input, but a planner can list them at run time. A central model splits the work and workers run the pieces.' };
  if (t.categories) return { pattern: 'routing', why: 'Distinct input types are handled better by specialist prompts. A router sends each input to one of them.' };
  if (t.independent) return { pattern: 'parallel', why: 'Independent subtasks can run at the same time, or the same task can run several times for a vote.' };
  if (t.feedback) return { pattern: 'evaluator', why: 'A second call can judge the draft and the first call can improve it, so a loop of generate and evaluate pays off.' };
  return { pattern: 'chain', why: 'The task splits cleanly into fixed steps. Each call handles an easier piece, and code can check the output between steps.' };
}

export interface Profile {
  calls: number;
  latency: number;
  note: string;
}

/**
 * Model calls and serial latency for one request. Assumptions: every call takes L seconds, parallel calls run fully in parallel,
 * code time is zero. n is steps, branches, workers, or turns. r is evaluator rounds.
 */
export function profile(p: Pattern, n: number, L: number, r: number): Profile {
  switch (p) {
    case 'single':
      return { calls: 1, latency: L, note: 'one call' };
    case 'chain':
      return { calls: n, latency: n * L, note: 'n calls in a row' };
    case 'routing':
      return { calls: 2, latency: 2 * L, note: 'router, then one specialist' };
    case 'parallel':
      return { calls: n, latency: L, note: 'n calls at once' };
    case 'orchestrator':
      return { calls: n + 2, latency: 3 * L, note: 'plan, n workers at once, merge' };
    case 'evaluator':
      return { calls: 2 * r, latency: 2 * r * L, note: 'r rounds of generate and evaluate' };
    case 'agent':
      return { calls: n, latency: n * L, note: 'n turns, up to the cap' };
  }
}
