/** Pure logic for CompositeIndexLab: which index columns can narrow the scan range, and how many entries get read. */

export type Col = 'city' | 'age';
export interface Row {
  city: string;
  age: number;
}
export interface Pred {
  col: Col;
  op: '=' | '>';
  value: string | number;
}

export const CITIES = ['Berlin', 'Lagos', 'Lima', 'Oslo', 'Pune'];

/** 200 deterministic rows. A fixed linear congruential generator keeps server and browser output identical. */
export function makeRows(): Row[] {
  let s = 7;
  const next = () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    return s >>> 8;
  };
  return Array.from({ length: 200 }, () => ({ city: CITIES[next() % CITIES.length], age: 18 + (next() % 50) }));
}

const cmp = (a: string | number, b: string | number) => (a < b ? -1 : a > b ? 1 : 0);

export function holds(row: Row, p: Pred) {
  return p.op === '=' ? row[p.col] === p.value : cmp(row[p.col], p.value) > 0;
}

export interface Plan {
  /** Leading index columns whose predicates shrink the scanned range. */
  narrowing: Col[];
  /** Index entries read. */
  scanned: number;
  /** Rows that satisfy every predicate. */
  returned: number;
  /** Positions in the sorted index of the scanned slice. */
  from: number;
  to: number;
  /** Positions of matching entries in the sorted index. */
  hits: number[];
}

export function plan(index: Col[], rows: Row[], preds: Pred[]): Plan {
  const sorted = [...rows].sort((a, b) => {
    for (const c of index) {
      const d = cmp(a[c], b[c]);
      if (d) return d;
    }
    return 0;
  });
  const narrowing: Col[] = [];
  for (const c of index) {
    const p = preds.find((q) => q.col === c);
    if (!p) break;
    narrowing.push(c);
    if (p.op !== '=') break;
  }
  const rangePreds = preds.filter((p) => narrowing.includes(p.col));
  let from = -1;
  let to = -1;
  sorted.forEach((r, i) => {
    if (rangePreds.every((p) => holds(r, p))) {
      if (from < 0) from = i;
      to = i;
    }
  });
  const scanned = from < 0 ? 0 : to - from + 1;
  const hits: number[] = [];
  sorted.forEach((r, i) => {
    if (preds.every((p) => holds(r, p))) hits.push(i);
  });
  return { narrowing, scanned, returned: hits.length, from, to, hits };
}
