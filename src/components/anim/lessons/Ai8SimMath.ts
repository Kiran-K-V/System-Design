/** Logic for the A8.6 persona-mix widget and cost helpers. Pure functions. Pass rates are illustrative. */

export type Persona = 'cooperative' | 'vague' | 'hostile';
export const PERSONAS: Persona[] = ['cooperative', 'vague', 'hostile'];

/** Illustrative agent pass rate per persona. Not measured. */
export const RATE: Record<Persona, number> = { cooperative: 0.9, vague: 0.7, hostile: 0.45 };

export type Mix = Record<Persona, number>;

/** Normalize non-negative weights to shares that sum to 1. */
export function normalize(m: Mix): Mix {
  const t = m.cooperative + m.vague + m.hostile;
  if (t === 0) return { cooperative: 1 / 3, vague: 1 / 3, hostile: 1 / 3 };
  return { cooperative: m.cooperative / t, vague: m.vague / t, hostile: m.hostile / t };
}

export const overall = (m: Mix) => {
  const s = normalize(m);
  return PERSONAS.reduce((sum, p) => sum + s[p] * RATE[p], 0);
};

/** Cost of a simulated test run. Prices are dollars per million tokens. */
export function simCost(opts: { dialogs: number; turns: number; agentIn: number; agentOut: number; userIn: number; userOut: number; agentPrice: [number, number]; userPrice: [number, number] }): { agent: number; user: number; total: number; calls: number } {
  const turns = opts.dialogs * opts.turns;
  const agent = (turns * (opts.agentIn * opts.agentPrice[0] + opts.agentOut * opts.agentPrice[1])) / 1e6;
  const user = (turns * (opts.userIn * opts.userPrice[0] + opts.userOut * opts.userPrice[1])) / 1e6;
  return { agent, user, total: agent + user, calls: turns * 2 };
}
