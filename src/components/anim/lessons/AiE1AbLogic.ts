/**
 * Pure maths for lesson E1.8 (A/B testing models). Pure functions, seeded randomness.
 * Sample-size rule: Kohavi, Henne and Sommerfield, "Practical Guide to Controlled Experiments on the Web" (KDD 2007),
 * section 3.2: n = (4 r sigma / delta)^2 for 95% confidence and 90% power, r variants, n users in total.
 * The paper says the factor 4 may overestimate by 25% for large n.
 */

/** Small seeded generator (mulberry32). Same seed gives the same run. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normCdf(x: number): number {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return 0.5 * (1 + s * y);
}

/** Total users (all variants) from the paper's rule for a conversion-style metric. Returns Infinity for lift 0. */
export function usersTotal(baseRate: number, relLift: number, variants = 2): number {
  if (relLift <= 0) return Infinity;
  const sigma = Math.sqrt(baseRate * (1 - baseRate));
  const delta = baseRate * relLift;
  return Math.pow((4 * variants * sigma) / delta, 2);
}

export interface Look {
  n: number;
  diff: number;
  lo: number;
  hi: number;
  p: number;
}

/** Two-proportion z test with a 95% interval for the difference (treatment minus control). */
export function zTest(nA: number, xA: number, nB: number, xB: number): Look {
  const pa = xA / nA;
  const pb = xB / nB;
  const diff = pb - pa;
  const pool = (xA + xB) / (nA + nB);
  const se0 = Math.sqrt(pool * (1 - pool) * (1 / nA + 1 / nB));
  const z = se0 === 0 ? 0 : diff / se0;
  const p = 2 * (1 - normCdf(Math.abs(z)));
  const se = Math.sqrt((pa * (1 - pa)) / nA + (pb * (1 - pb)) / nB);
  return { n: nA, diff, lo: diff - 1.96 * se, hi: diff + 1.96 * se, p };
}

/** Run `looks` batches of `batch` users per arm and return the test result after each batch. */
export function runTest(seed: number, baseRate: number, relLift: number, batch: number, looks: number): Look[] {
  const r = rng(seed);
  let nA = 0, xA = 0, nB = 0, xB = 0;
  const out: Look[] = [];
  const pB = baseRate * (1 + relLift);
  for (let k = 0; k < looks; k++) {
    for (let i = 0; i < batch; i++) {
      if (r() < baseRate) xA++;
      if (r() < pB) xB++;
    }
    nA += batch;
    nB += batch;
    out.push(zTest(nA, xA, nB, xB));
  }
  return out;
}

export type Team = 'A' | 'B';
export interface Slot {
  item: string;
  team: Team;
}

/**
 * Team-draft interleaving. In each round `firstPicks[round]` picks first, then the other ranker picks.
 * A pick is that ranker's highest item not already in the merged list.
 */
export function teamDraft(a: string[], b: string[], firstPicks: Team[], length: number): Slot[] {
  const out: Slot[] = [];
  const used = new Set<string>();
  const lists = { A: a, B: b };
  const top = (t: Team) => lists[t].find((x) => !used.has(x));
  for (const first of firstPicks) {
    const order: Team[] = first === 'A' ? ['A', 'B'] : ['B', 'A'];
    for (const t of order) {
      const item = top(t);
      if (item !== undefined && out.length < length) {
        out.push({ item, team: t });
        used.add(item);
      }
    }
  }
  return out;
}

/** Credit clicks to the team that contributed the clicked slot. */
export function credit(slots: Slot[], clicked: number[]): { A: number; B: number } {
  const c = { A: 0, B: 0 };
  for (const i of clicked) c[slots[i].team]++;
  return c;
}
