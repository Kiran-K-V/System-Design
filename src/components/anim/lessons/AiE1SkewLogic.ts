/**
 * Logic for lesson E1.4 (training-serving skew). Pure functions, illustrative numbers.
 * The three gaps follow the split in Google's Rules of Machine Learning (rule on measuring skew):
 *   1. training data vs holdout data
 *   2. holdout data vs next-day data
 *   3. next-day data vs live serving
 */
export interface Aucs {
  train: number;
  holdout: number;
  nextDay: number;
  live: number;
}

export interface Scenario {
  id: string;
  label: string;
  cause: string;
  auc: Aucs;
}

/** Illustrative scores. They show the pattern each cause leaves, not measured values. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'healthy',
    label: 'Healthy',
    cause: 'No problem. Small drops from one set to the next are normal.',
    auc: { train: 0.86, holdout: 0.83, nextDay: 0.82, live: 0.82 },
  },
  {
    id: 'code',
    label: 'Different code',
    cause: 'Training counts every order. The serving counter skips cancelled orders. Same user, two values.',
    auc: { train: 0.86, holdout: 0.84, nextDay: 0.83, live: 0.71 },
  },
  {
    id: 'join',
    label: 'Changed join table',
    cause: 'The feature table is overwritten daily. Training read today\'s values for old rows. Serving reads the live value.',
    auc: { train: 0.88, holdout: 0.86, nextDay: 0.85, live: 0.76 },
  },
  {
    id: 'time',
    label: 'Time-sensitive feature',
    cause: 'A feature such as "trending now" is only useful for a few hours. A model trained on last month\'s values reads stale meaning.',
    auc: { train: 0.86, holdout: 0.84, nextDay: 0.74, live: 0.73 },
  },
  {
    id: 'overfit',
    label: 'Overfit model',
    cause: 'The model memorised the training rows. Nothing is wrong with the pipelines.',
    auc: { train: 0.97, holdout: 0.8, nextDay: 0.79, live: 0.79 },
  },
];

export type Verdict = 'ok' | 'watch' | 'bad';

export interface Gap {
  id: 1 | 2 | 3;
  label: string;
  size: number;
  verdict: Verdict;
  read: string;
}

/** Limits are illustrative. Gap 3 has the tightest one: the same example must score the same. */
export const LIMITS = { g1: 0.1, g2: 0.03, g3: 0.01 };

export function gaps(a: Aucs): Gap[] {
  const r = (x: number) => Math.round(x * 1000) / 1000;
  const g1 = r(a.train - a.holdout);
  const g2 = r(a.holdout - a.nextDay);
  const g3 = r(a.nextDay - a.live);
  const v = (size: number, lim: number, hard: boolean): Verdict => (size <= lim ? 'ok' : hard ? 'bad' : 'watch');
  return [
    { id: 1, label: 'Train to holdout', size: g1, verdict: v(g1, LIMITS.g1, false), read: 'Always exists. Large means the model memorised. Regularise or get more data.' },
    { id: 2, label: 'Holdout to next day', size: g2, verdict: v(g2, LIMITS.g2, false), read: 'Always exists. Large means a feature is time-sensitive and ages fast.' },
    { id: 3, label: 'Next day to live', size: g3, verdict: v(g3, LIMITS.g3, true), read: 'Should be about zero. Large means an engineering error in the pipeline or the data.' },
  ];
}

/** The gap that is furthest over its own limit, or null when all three are within limits. */
export function worst(a: Aucs): Gap | null {
  const gs = gaps(a).filter((g) => g.verdict !== 'ok');
  if (gs.length === 0) return null;
  const ratio = (g: Gap) => g.size / (g.id === 1 ? LIMITS.g1 : g.id === 2 ? LIMITS.g2 : LIMITS.g3);
  return gs.reduce((m, g) => (ratio(g) > ratio(m) ? g : m));
}
