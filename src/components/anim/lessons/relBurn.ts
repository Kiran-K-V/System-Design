/** Pure error budget math for lesson 7.5. SLO 99.9% over 30 days. Alert rules from the Google SRE workbook, "Alerting on SLOs". */

export const SLO = 0.999;
export const WINDOW_DAYS = 30;
export const WINDOW_HOURS = WINDOW_DAYS * 24;
export const BUDGET = 1 - SLO; // 0.001

export interface Rule {
  name: string;
  kind: 'page' | 'ticket';
  /** Fires when the burn rate is at least this over both windows. */
  burn: number;
  longLabel: string;
  longHours: number;
  shortLabel: string;
}

export const RULES: Rule[] = [
  { name: 'Fast burn', kind: 'page', burn: 14.4, longLabel: '1 h', longHours: 1, shortLabel: '5 min' },
  { name: 'Slow burn', kind: 'page', burn: 6, longLabel: '6 h', longHours: 6, shortLabel: '30 min' },
  { name: 'Very slow burn', kind: 'ticket', burn: 1, longLabel: '3 days', longHours: 72, shortLabel: '6 h' },
];

/** How many times faster than "just meets the SLO" the budget is being spent. */
export const burnRate = (errorRate: number) => errorRate / BUDGET;

export const hoursToExhaust = (burn: number) => (burn > 0 ? WINDOW_HOURS / burn : Infinity);

/** Percent of the whole 30-day budget spent after `hours` at this burn rate. */
export const budgetSpentPct = (burn: number, hours: number) => ((burn * hours) / WINDOW_HOURS) * 100;

/**
 * Minutes after a constant error rate starts until the rule fires, or null if it never does.
 * The long window average reaches the threshold after longHours * rule.burn / burn. The short window gets there sooner.
 */
export function minutesToFire(burn: number, rule: Rule): number | null {
  if (burn < rule.burn) return null;
  return (rule.longHours * 60 * rule.burn) / burn;
}

/** Percent of the 30-day budget gone at the moment the rule fires. It does not depend on the burn rate. */
export const spentAtFire = (rule: Rule) => budgetSpentPct(rule.burn, rule.longHours);
