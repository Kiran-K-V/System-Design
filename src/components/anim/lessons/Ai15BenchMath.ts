/** Logic for the A15.5 tries widget. Pure functions. Numbers in the demo are illustrative. */

export type Rule = 'one' | 'vote' | 'any' | 'all';

export const RULE_LABELS: Record<Rule, string> = {
  one: 'One try',
  vote: 'Majority of k',
  any: 'Any of k',
  all: 'All k right',
};

/** pass@k: chance that at least one of k independent tries is right. */
export function passAny(p: number, k: number): number {
  return 1 - Math.pow(1 - p, k);
}

/** pass^k: chance that all k independent tries are right. */
export function passAll(p: number, k: number): number {
  return Math.pow(p, k);
}

/** Majority vote over k tries when there are only two possible answers. A tie counts half. */
export function majority(p: number, k: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let pmf = Math.pow(1 - p, k); // P(0 right)
  let total = 0;
  for (let j = 0; j <= k; j++) {
    if (2 * j > k) total += pmf;
    else if (2 * j === k) total += pmf / 2;
    pmf = (pmf * (k - j) * p) / ((j + 1) * (1 - p));
  }
  return total;
}

export function score(rule: Rule, p: number, k: number): number {
  if (rule === 'one') return p;
  if (rule === 'vote') return majority(p, k);
  if (rule === 'any') return passAny(p, k);
  return passAll(p, k);
}
