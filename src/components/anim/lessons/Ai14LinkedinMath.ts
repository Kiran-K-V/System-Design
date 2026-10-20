/**
 * Maths for lesson A14.4 (LinkedIn GenAI product). Pure functions, no DOM.
 *
 * Company claims (LinkedIn Engineering, 2024-04-25, "Musings on building a Generative AI product"):
 * about 90% of structured outputs were valid and about 10% were not; a defensive parser cut errors to
 * about 0.01%; up to 500 conversations a day could be annotated; annotator feedback takes about 1 day;
 * member feedback can take 3+ days; a 200-token reasoning step with +10 ms between tokens adds 2 s.
 *
 * Everything else here is ILLUSTRATIVE and labelled so in the lesson: the failure tally, the mix of
 * malformed-output classes, patch quality, the hint effect, the baseline time to first token, and the
 * baseline time between tokens. The page does not publish them.
 */

/* ---------- 1. The 80 / 95 problem ---------- */

export const MONTH_ONE_PCT = 80;
export const FULL_PCT = 95;
export const FIRST_MONTHS = 1;
export const LAST_MONTHS = 4;

/** Months per percentage point, first stretch (0 to 80 in one month). */
export const firstMonthsPerPoint = () => FIRST_MONTHS / MONTH_ONE_PCT;
/** Months per percentage point, last stretch (80 to 95 in four months). */
export const lastMonthsPerPoint = () => LAST_MONTHS / (FULL_PCT - MONTH_ONE_PCT);
/** How many times slower the last stretch was, per point. */
export const slowdown = () => lastMonthsPerPoint() / firstMonthsPerPoint();
/** Time for the last stretch relative to the first. */
export const timeRatio = () => LAST_MONTHS / FIRST_MONTHS;

/** Illustrative error-analysis tally: 1,000 test conversations, 200 fail. */
export const TAIL: { name: string; count: number }[] = [
  { name: 'Picked the wrong agent or skill', count: 48 },
  { name: 'Retrieval missed the key fact', count: 40 },
  { name: 'Output format broken', count: 30 },
  { name: 'Wall of text, no structure', count: 22 },
  { name: 'Invented a company fact', count: 18 },
  { name: 'Harsh or flat tone', count: 12 },
  { name: 'Forgot an earlier turn', count: 9 },
  { name: 'Wrong language or locale', count: 6 },
  { name: 'Bad link in an attachment', count: 5 },
  { name: 'Stale data', count: 4 },
  { name: 'Six one-offs, six different causes', count: 6 },
];
export const TAIL_TOTAL = 1000;

export interface TailRow {
  name: string;
  count: number;
  failuresLeft: number;
  passPct: number;
  gain: number;
}

/** Fix the categories from largest to smallest. Each fix removes its whole category (a generous assumption). */
export function tailRows(): TailRow[] {
  const startFail = TAIL.reduce((a, r) => a + r.count, 0);
  let left = startFail;
  let prev = ((TAIL_TOTAL - left) / TAIL_TOTAL) * 100;
  return TAIL.map((r) => {
    left -= r.count;
    const pass = ((TAIL_TOTAL - left) / TAIL_TOTAL) * 100;
    const row = { name: r.name, count: r.count, failuresLeft: left, passPct: pass, gain: pass - prev };
    prev = pass;
    return row;
  });
}

/** Sample size so that a measured pass rate p has a 95% half-width of h (both as fractions). Normal approximation. */
export const sampleSize = (p: number, h: number) => (1.96 * 1.96 * p * (1 - p)) / (h * h);
/** Half-width of the 95% range for a pass rate p measured on n cases, as a fraction. */
export const halfWidth = (p: number, n: number) => 1.96 * Math.sqrt((p * (1 - p)) / n);
export const ANNOTATED_PER_DAY = 500;
export const daysToAnnotate = (n: number, perDay = ANNOTATED_PER_DAY) => n / perDay;

/* ---------- 2. Evaluation tiers and feedback delay ---------- */

export interface Tier {
  id: 'eng' | 'ann' | 'mem';
  label: string;
  /** Feedback delay in days. Engineers: ILLUSTRATIVE (the page says only "fast"). Annotators: about 1. Members: 3 or more. */
  delayDays: number;
}
export const TIERS: Tier[] = [
  { id: 'eng', label: 'Engineers', delayDays: 0.05 },
  { id: 'ann', label: 'Annotators', delayDays: 1 },
  { id: 'mem', label: 'Members', delayDays: 3 },
];

/** How many full feedback cycles fit in a number of working days if you wait for each result. */
export const cyclesIn = (days: number, delayDays: number) => Math.floor(days / delayDays + 1e-9);
/** Other changes already shipped, at one change per day, by the time the result for change #0 arrives. */
export const changesBefore = (delayDays: number, perDay = 1) => Math.max(0, Math.ceil(delayDays * perDay - 1e-9) - 1);

/* ---------- 3. Defensive parsing ---------- */

export interface MalformedClass {
  id: string;
  label: string;
  /** Share of known malformed outputs, in percent. ILLUSTRATIVE mix. */
  weight: number;
}
export const CLASSES: MalformedClass[] = [
  { id: 'fence', label: 'Code fence or chatty text around the YAML', weight: 32 },
  { id: 'quote', label: 'Unquoted colon or symbol inside a string', weight: 27 },
  { id: 'indent', label: 'Wrong indentation or tabs', weight: 19 },
  { id: 'type', label: 'Number or flag written as text', weight: 13 },
  { id: 'trunc', label: 'Cut-off output, missing last lines', weight: 9 },
];

export const DEFAULTS = {
  /** Share of structured outputs that are bad. The page says about 10%. */
  malformed: 0.1,
  /** Share of malformed outputs in patterns nobody has seen yet. ILLUSTRATIVE. */
  unseen: 0.0005,
  /** Chance an enabled patch repairs an output of its class correctly. ILLUSTRATIVE. */
  quality: 0.9995,
  /** Prompt hints cut the raw malformed rate by this fraction. ILLUSTRATIVE. */
  hintCut: 0.3,
};

export interface ParserSetup {
  malformed: number;
  enabled: Record<string, boolean>;
  unseen: number;
  quality: number;
  hints: boolean;
}

/** Share of malformed outputs that stay broken after the parser. */
export function residualFraction(s: ParserSetup): number {
  const totalW = CLASSES.reduce((a, c) => a + c.weight, 0);
  const known = CLASSES.reduce((a, c) => a + (c.weight / totalW) * (s.enabled[c.id] ? 1 - s.quality : 1), 0);
  return s.unseen + (1 - s.unseen) * known;
}
/** Raw malformed rate after prompt hints (if on). */
export const rawRate = (s: ParserSetup) => s.malformed * (s.hints ? 1 - DEFAULTS.hintCut : 1);
/** Error rate that reaches the code after the parser, as a fraction of all calls. */
export const errorAfter = (s: ParserSetup) => rawRate(s) * residualFraction(s);
/** Coverage a parser needs to reach a target error rate from a malformed rate. */
export const requiredCoverage = (malformed: number, target: number) => 1 - target / malformed;

/** Re-prompt on failure, assuming each retry fails independently with chance m. Optimistic: real retries are correlated. */
export const retryError = (m: number, retries: number) => Math.pow(m, retries + 1);
/** Extra model calls per request when you retry up to r times. */
export function retryExtraCalls(m: number, retries: number): number {
  let sum = 0;
  for (let i = 1; i <= retries; i++) sum += Math.pow(m, i);
  return sum;
}

/** Failures per N calls. */
export const perCalls = (rate: number, n: number) => rate * n;

/* ---------- 4. Latency ---------- */

/** Extra time from a per-token slowdown, in ms. */
export const addedMs = (tokens: number, deltaMsPerToken: number) => tokens * deltaMsPerToken;

export interface LatencySetup {
  ttftMs: number;
  tbtMs: number;
  hiddenTokens: number;
  answerTokens: number;
}
/** Time until the first word the member can read. Hidden reasoning tokens come first. */
export const firstVisibleMs = (s: LatencySetup) => s.ttftMs + s.hiddenTokens * s.tbtMs;
/** Time until the last token. */
export const totalMs = (s: LatencySetup) => s.ttftMs + (s.hiddenTokens + s.answerTokens) * s.tbtMs;

/** Tokens per second one GPU serves, if `batch` streams each get a token every `tbtMs`. */
export const gpuTokensPerSecond = (batch: number, tbtMs: number) => batch / (tbtMs / 1000);

/* ---------- 5. Small model for routing: illustrative price ratio ---------- */

export interface Price {
  inPerM: number;
  outPerM: number;
}
export const callCost = (p: Price, inTok: number, outTok: number) => (inTok * p.inPerM + outTok * p.outPerM) / 1e6;
