/** Logic for the A7.2 loop simulator. Pure functions. Token sizes are illustrative. */

export type Scenario = 'healthy' | 'stuck' | 'oscillate';

/** Illustrative: context starts at 10,000 tokens and grows 3,000 per turn. Input $2 per MTok, 500 output tokens at $10 per MTok (Sonnet 5.5). */
export function turnCost(turn: number): number {
  const input = 10000 + 3000 * (turn - 1);
  return (input * 2 + 500 * 10) / 1e6;
}

/** The call the agent makes on a turn. Healthy runs vary. Stuck repeats from turn 3. Oscillating alternates A and B. */
export function callOf(s: Scenario, turn: number): string {
  if (s === 'healthy') return `c${turn}`;
  if (s === 'stuck') return turn <= 2 ? `c${turn}` : 'c2';
  return turn % 2 === 1 ? 'A' : 'B';
}

export const HEALTHY_DONE_TURN = 6;

export type Stop = 'done' | 'stuck' | 'budget' | 'max_turns';

export interface Opts {
  scenario: Scenario;
  maxTurns: number;
  budget: number;
  detector: boolean;
  /** Stop when the same call has been made this many times. */
  k: number;
}

export interface Out {
  stop: Stop;
  turns: number;
  cost: number;
  overshoot: number;
  costs: number[];
}

export function simulate(o: Opts): Out {
  const seen: Record<string, number> = {};
  const costs: number[] = [];
  let cum = 0;
  for (let t = 1; t <= 200; t++) {
    cum += turnCost(t);
    costs.push(cum);
    const c = callOf(o.scenario, t);
    seen[c] = (seen[c] ?? 0) + 1;
    let stop: Stop | null = null;
    if (o.scenario === 'healthy' && t === HEALTHY_DONE_TURN) stop = 'done';
    else if (o.detector && seen[c] >= o.k) stop = 'stuck';
    else if (cum >= o.budget) stop = 'budget';
    else if (t >= o.maxTurns) stop = 'max_turns';
    if (stop) return { stop, turns: t, cost: cum, overshoot: stop === 'budget' ? cum - o.budget : 0, costs };
  }
  return { stop: 'max_turns', turns: 200, cost: cum, overshoot: 0, costs };
}
