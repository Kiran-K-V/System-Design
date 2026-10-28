/** Logic for lesson A15.3 (model migration). Pure functions. All case counts in the demo are illustrative. */

export interface Slice {
  name: string;
  /** Number of golden-set cases in this slice. */
  n: number;
  /** Cases that passed on the old model. */
  oldPass: number;
  /** Cases that passed on the new model. */
  newPass: number;
}

/** A made-up support-bot golden set of 200 cases. The old and new totals are equal on purpose. */
export const SLICES: Slice[] = [
  { name: 'Refund questions', n: 80, oldPass: 72, newPass: 77 },
  { name: 'Shipping questions', n: 50, oldPass: 45, newPass: 47 },
  { name: 'Needs a tool call', n: 40, oldPass: 36, newPass: 32 },
  { name: 'Not in English', n: 20, oldPass: 17, newPass: 14 },
  { name: 'Long threads', n: 10, oldPass: 9, newPass: 9 },
];

export const pct = (pass: number, n: number): number => (n === 0 ? 0 : (100 * pass) / n);

export function total(slices: Slice[]): Slice {
  return {
    name: 'All cases',
    n: slices.reduce((a, s) => a + s.n, 0),
    oldPass: slices.reduce((a, s) => a + s.oldPass, 0),
    newPass: slices.reduce((a, s) => a + s.newPass, 0),
  };
}

/** Change in pass rate, in points. */
export const delta = (s: Slice): number => pct(s.newPass, s.n) - pct(s.oldPass, s.n);

/** A slice is flagged when it lost at least this many points. */
export const FLAG_POINTS = 10;
export const flagged = (s: Slice): boolean => delta(s) <= -FLAG_POINTS;
