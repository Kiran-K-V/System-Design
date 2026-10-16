/** Math and toy data for lesson A8.9. Pure functions. All data are illustrative. */

export interface Span {
  text: string;
  kind: 'name' | 'email' | 'phone' | 'address';
  /** True when a pattern rule (regex) finds it. Names and free-text places need a model. */
  byPattern: boolean;
  /** True when a pattern rule plus a model finds it. The toy model misses one span on purpose. */
  byModel: boolean;
}

export const TRACE_PARTS: (string | Span)[] = [
  "Hi, I'm ",
  { text: 'Priya Raman', kind: 'name', byPattern: false, byModel: true },
  '. My order 88231 never arrived. Email me at ',
  { text: 'priya.r@example.com', kind: 'email', byPattern: true, byModel: true },
  ' or call ',
  { text: '+91 98765 43210', kind: 'phone', byPattern: true, byModel: true },
  '. I live at ',
  { text: '14 Lake Road, Pune', kind: 'address', byPattern: false, byModel: true },
  ', next to ',
  { text: 'Mr. Das', kind: 'name', byPattern: false, byModel: false },
  '.',
];

export type Detector = 'none' | 'pattern' | 'model';

export function caught(s: Span, d: Detector): boolean {
  return d === 'pattern' ? s.byPattern : d === 'model' ? s.byModel : false;
}

export function spans(): Span[] {
  return TRACE_PARTS.filter((p): p is Span => typeof p !== 'string');
}

/** Personal-data spans that stay in the stored data per day. */
export function leakedPerDay(tracesPerDay: number, spansPerTrace: number, recall: number): number {
  return Math.round(tracesPerDay * spansPerTrace * (1 - recall));
}

/** Share of this week's confirmed production failures that already had an eval case. */
export function coverage(covered: number, failures: number): number {
  return failures === 0 ? 1 : covered / failures;
}
