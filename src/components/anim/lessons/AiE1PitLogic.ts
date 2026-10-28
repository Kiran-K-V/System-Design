/** Logic for the E1.3 point-in-time join visual. Pure functions. Data is illustrative. */

export interface Snapshot {
  user: string;
  /** Day the feature value became known. */
  day: number;
  /** Feature: disputes opened against this user so far. */
  disputes: number;
}

export interface Example {
  user: string;
  /** Day of the payment. */
  day: number;
  fraud: boolean;
}

export const SNAPSHOTS: Snapshot[] = [
  { user: 'A', day: 1, disputes: 0 },
  { user: 'A', day: 9, disputes: 1 },
  { user: 'B', day: 1, disputes: 0 },
  { user: 'C', day: 1, disputes: 0 },
  { user: 'C', day: 6, disputes: 0 },
];

export const EXAMPLES: Example[] = [
  { user: 'A', day: 8, fraud: true },
  { user: 'B', day: 5, fraud: false },
  { user: 'C', day: 7, fraud: false },
];

/** Leaky join: newest value for the user, whenever it was computed. */
export function joinLatest(e: Example, snaps = SNAPSHOTS): number {
  const mine = snaps.filter((s) => s.user === e.user);
  return mine.reduce((a, b) => (b.day > a.day ? b : a)).disputes;
}

/** Point-in-time join: newest value known on or before the payment day. */
export function joinPit(e: Example, snaps = SNAPSHOTS): number {
  const mine = snaps.filter((s) => s.user === e.user && s.day <= e.day);
  return mine.reduce((a, b) => (b.day > a.day ? b : a)).disputes;
}

/** How many examples the rule "disputes > 0 means fraud" gets right. */
export function ruleHits(values: number[], examples = EXAMPLES): number {
  return examples.filter((e, i) => values[i] > 0 === e.fraud).length;
}
