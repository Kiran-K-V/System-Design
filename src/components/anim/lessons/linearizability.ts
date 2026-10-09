/**
 * Tiny history checker for one register that starts at 0.
 * Used by the consistency lab. Histories here have 4 operations, so brute force over orders is exact and fast.
 */
export interface Op {
  id: string;
  proc: string;
  kind: 'w' | 'r';
  start: number;
  end: number;
  /** Value written, or value the read returned. */
  value: number;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}

/** Every read returns the latest write before it in this order, or 0 if there is none. */
function registerOk(order: Op[]): boolean {
  let cur = 0;
  for (const op of order) {
    if (op.kind === 'w') cur = op.value;
    else if (op.value !== cur) return false;
  }
  return true;
}

/** Real-time: a must come before b when a finished before b started. */
function respectsRealTime(order: Op[]): boolean {
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      if (order[j].end < order[i].start) return false;
    }
  }
  return true;
}

/** Program order: operations of one process keep their start order. */
function respectsProgramOrder(order: Op[]): boolean {
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      if (order[i].proc === order[j].proc && order[j].start < order[i].start) return false;
    }
  }
  return true;
}

export function isLinearizable(ops: Op[]): boolean {
  return permutations(ops).some((o) => respectsRealTime(o) && respectsProgramOrder(o) && registerOk(o));
}

export function isSequential(ops: Op[]): boolean {
  return permutations(ops).some((o) => respectsProgramOrder(o) && registerOk(o));
}

/** Writes are numbered by version (value 1 is older than 2). A later read must not return an older version. */
export function isMonotonicReads(reads: Op[]): boolean {
  const sorted = [...reads].sort((a, b) => a.start - b.start);
  return sorted.every((r, i) => i === 0 || r.value >= sorted[i - 1].value);
}

export interface Scenario {
  r1Start: number;
  r2Start: number;
  r1: number;
  r2: number;
}

/** Fixed writer: client A writes 1 during [1,3], then 2 during [5,9]. Reads last READ_LEN. */
export const WRITES: Op[] = [
  { id: 'W1', proc: 'A', kind: 'w', start: 1, end: 3, value: 1 },
  { id: 'W2', proc: 'A', kind: 'w', start: 5, end: 9, value: 2 },
];

/** A read lasts slightly less than one unit, so a read at time 4 ends before a write that starts at 5. */
export const READ_LEN = 0.9;

export function readsOf(s: Scenario): Op[] {
  return [
    { id: 'R1', proc: 'B', kind: 'r', start: s.r1Start, end: s.r1Start + READ_LEN, value: s.r1 },
    { id: 'R2', proc: 'B', kind: 'r', start: s.r2Start, end: s.r2Start + READ_LEN, value: s.r2 },
  ];
}

export interface Verdict {
  linearizable: boolean;
  sequential: boolean;
  monotonic: boolean;
  /** Reads that cannot be linearized even alone. */
  badAlone: string[];
}

export function judge(s: Scenario): Verdict {
  const reads = readsOf(s);
  const all = [...WRITES, ...reads];
  const badAlone = reads.filter((r) => !isLinearizable([...WRITES, r])).map((r) => r.id);
  return {
    linearizable: isLinearizable(all),
    sequential: isSequential(all),
    monotonic: isMonotonicReads(reads),
    badAlone,
  };
}

/** Values a read could return and still keep the history linearizable, given the other read as chosen. */
export function allowedValues(s: Scenario, which: 'R1' | 'R2', model: 'lin' | 'seq'): number[] {
  return [0, 1, 2].filter((v) => {
    const t = { ...s, [which === 'R1' ? 'r1' : 'r2']: v };
    const ops = [...WRITES, ...readsOf(t)];
    return model === 'lin' ? isLinearizable(ops) : isSequential(ops);
  });
}
