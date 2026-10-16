/** Budget burn math. The window and burn-rate pairs come from the Google SRE workbook's alert table for error budgets.
 *  Using them on dollars is our extension, not something the workbook says. */
export const HOURS_IN_MONTH = 720;

export interface Rule {
  id: string;
  window: string;
  hours: number;
  burn: number;
  action: 'page' | 'ticket';
}

export const RULES: Rule[] = [
  { id: '1h', window: '1 hour', hours: 1, burn: 14.4, action: 'page' },
  { id: '6h', window: '6 hours', hours: 6, burn: 6, action: 'page' },
  { id: '3d', window: '3 days', hours: 72, burn: 1, action: 'ticket' },
];

/** How fast the budget is being used, compared with an even spend over the month. 1 means the budget lasts exactly the month. */
export const burnRate = (spend: number, budget: number, hours: number) => spend / budget / (hours / HOURS_IN_MONTH);

/** Hours until a full budget is gone if spend keeps the pace of this window. */
export const hoursToEmpty = (spend: number, budget: number, hours: number) => (spend > 0 ? budget / (spend / hours) : Infinity);

/** Share of the monthly budget that this window used. */
export const shareUsed = (spend: number, budget: number) => spend / budget;
