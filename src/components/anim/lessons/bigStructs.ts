/** Bloom filter, HyperLogLog, and Count-Min Sketch math for the big-data-structures lesson. No imports, so a node test can load it. */

/** FNV-1a, 32 bit. */
export function fnv1a(s: string, seed = 0): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** k bit positions in [0, m) by double hashing: h1 + i * h2. */
export function bloomPositions(item: string, k: number, m: number): number[] {
  const h1 = fnv1a(item, 0);
  const h2 = fnv1a(item, 0x9e3779b9) | 1;
  return Array.from({ length: k }, (_, i) => ((h1 + Math.imul(i, h2)) >>> 0) % m);
}

export class Bloom {
  bits: boolean[];
  items: string[] = [];
  m: number;
  k: number;
  constructor(m: number, k: number) {
    this.m = m;
    this.k = k;
    this.bits = Array(m).fill(false);
  }
  add(item: string) {
    for (const p of bloomPositions(item, this.k, this.m)) this.bits[p] = true;
    this.items.push(item);
  }
  has(item: string) {
    return bloomPositions(item, this.k, this.m).every((p) => this.bits[p]);
  }
  get setBits() {
    return this.bits.filter(Boolean).length;
  }
}

/** Expected false-positive rate, approximation (1 - e^(-kn/m))^k. */
export const bloomFp = (n: number, m: number, k: number) => Math.pow(1 - Math.exp((-k * n) / m), k);

/** Exact expression (1 - (1 - 1/m)^(kn))^k. */
export const bloomFpExact = (n: number, m: number, k: number) => Math.pow(1 - Math.pow(1 - 1 / m, k * n), k);

/** k that minimizes the false-positive rate: (m/n) ln 2. */
export const bloomOptimalK = (n: number, m: number) => (m / n) * Math.LN2;

/** Bits per item for a target rate: -ln(eps) / (ln 2)^2. */
export const bloomBitsPerItem = (eps: number) => -Math.log(eps) / (Math.LN2 * Math.LN2);

/** Fraction of a fixed random probe set that a filter wrongly accepts. Probes are never added. */
export function observedFp(b: Bloom, probes = 200, prefix = 'probe-'): number {
  let fp = 0;
  for (let i = 0; i < probes; i++) if (b.has(prefix + i)) fp++;
  return fp / probes;
}

/* ---------- HyperLogLog ---------- */

/** Standard error 1.04 / sqrt(m). */
export const hllStdErr = (m: number) => 1.04 / Math.sqrt(m);

/** Register update from a hash given as a bit string. First p bits pick the register; rank is 1 + leading zeros of the rest. */
export function hllUpdate(registers: number[], hashBits: string, p: number): { index: number; rank: number } {
  const index = parseInt(hashBits.slice(0, p), 2);
  const rest = hashBits.slice(p);
  const firstOne = rest.indexOf('1');
  const rank = (firstOne === -1 ? rest.length : firstOne) + 1;
  registers[index] = Math.max(registers[index], rank);
  return { index, rank };
}

/* ---------- Count-Min Sketch ---------- */

/** Width ceil(e / eps) and depth ceil(ln(1 / delta)). */
export const cmsSize = (eps: number, delta: number) => ({ w: Math.ceil(Math.E / eps), d: Math.ceil(Math.log(1 / delta)) });

/** A sketch with hand-chosen hash rows, to follow by hand. rows[r][item] is the column of that item in row r. */
export class Cms {
  table: number[][];
  w: number;
  rows: Record<string, number>[];
  constructor(w: number, rows: Record<string, number>[]) {
    this.w = w;
    this.rows = rows;
    this.table = rows.map(() => Array(w).fill(0));
  }
  add(item: string, count = 1) {
    this.rows.forEach((row, r) => (this.table[r][row[item]] += count));
  }
  query(item: string) {
    return Math.min(...this.rows.map((row, r) => this.table[r][row[item]]));
  }
}
