/** Toy KV pool for the paged vs contiguous demo. Numbers are illustrative; the ratios are the point. */
export const POOL_TOKENS = 16384;
export const BLOCK = 16;
export const CELLS = POOL_TOKENS / BLOCK; // 1024
export const COLS = 32;

export interface Req {
  id: string;
  prompt: number;
  out: number;
  /** Contiguous allocators reserve prompt + max new tokens up front. */
  reserve: number;
}
export const REQS: Req[] = [
  { id: 'A', prompt: 500, out: 1200, reserve: 4096 },
  { id: 'B', prompt: 200, out: 600, reserve: 1024 },
  { id: 'C', prompt: 300, out: 900, reserve: 2048 },
  { id: 'D', prompt: 150, out: 500, reserve: 1024 },
  { id: 'E', prompt: 800, out: 1500, reserve: 4096 },
  { id: 'F', prompt: 400, out: 700, reserve: 2048 },
];
/** The newcomer: it asks for a 4,096-token reservation. */
export const NEWCOMER: Req = { id: 'G', prompt: 300, out: 0, reserve: 4096 };
/** After this many tokens of progress, B and D have finished and left. */
export const FINISHED = ['B', 'D'];

export const lenAt = (r: Req, progress: number) => r.prompt + Math.round(progress * r.out);
const blocks = (tokens: number) => Math.ceil(tokens / BLOCK);

export type CellKind = 'used' | 'reserved' | 'free' | 'newcomer';
export interface Cell {
  kind: CellKind;
  id?: string;
  /** True for the first cell of a sequence (to print its letter). */
  first?: boolean;
}

export interface Layout {
  cells: Cell[];
  usedTokens: number;
  heldTokens: number;
  freeTokens: number;
  largestFreeRun: number;
  admitted: boolean;
  wastePct: number;
}

const live = (holes: boolean) => REQS.filter((r) => !(holes && FINISHED.includes(r.id)));

function summarize(cells: Cell[], usedTokens: number, admitted: boolean): Layout {
  let run = 0;
  let largest = 0;
  let free = 0;
  for (const c of cells) {
    if (c.kind === 'free') {
      run++;
      free++;
      largest = Math.max(largest, run);
    } else run = 0;
  }
  const held = (CELLS - free) * BLOCK;
  return { cells, usedTokens, heldTokens: held, freeTokens: free * BLOCK, largestFreeRun: largest * BLOCK, admitted, wastePct: held ? ((held - usedTokens) / held) * 100 : 0 };
}

/** Contiguous: each request owns one run of cells sized to its reservation, in arrival order. Finished requests leave holes. */
export function contiguous(progress: number, holes: boolean): Layout {
  const cells: Cell[] = Array.from({ length: CELLS }, () => ({ kind: 'free' as CellKind }));
  let at = 0;
  let used = 0;
  for (const r of REQS) {
    const n = r.reserve / BLOCK;
    if (!(holes && FINISHED.includes(r.id))) {
      const len = lenAt(r, progress);
      used += len;
      for (let i = 0; i < n; i++) cells[at + i] = { kind: i < blocks(len) ? 'used' : 'reserved', id: r.id, first: i === 0 };
    }
    at += n;
  }
  const res = summarize(cells, used, false);
  res.admitted = res.largestFreeRun >= NEWCOMER.reserve;
  if (res.admitted) {
    let run = 0;
    for (let i = 0; i < CELLS; i++) {
      run = cells[i].kind === 'free' ? run + 1 : 0;
      if (run === NEWCOMER.reserve / BLOCK) {
        for (let j = i - run + 1; j <= i; j++) cells[j] = { kind: 'newcomer', id: 'G', first: j === i - run + 1 };
        break;
      }
    }
  }
  return res;
}

/** Paged: blocks are handed out on demand, in the order they were needed, wherever there is room. */
export function paged(progress: number, holes: boolean): Layout {
  const rs = live(holes);
  const want: { id: string; j: number; t: number }[] = [];
  let used = 0;
  for (const r of rs) {
    const len = lenAt(r, progress);
    used += len;
    for (let j = 0; j < blocks(len); j++) want.push({ id: r.id, j, t: Math.max(0, (j * BLOCK - r.prompt) / Math.max(1, r.out)) });
  }
  want.sort((a, b) => a.t - b.t || a.id.localeCompare(b.id) || a.j - b.j);
  const cells: Cell[] = Array.from({ length: CELLS }, () => ({ kind: 'free' as CellKind }));
  const seen = new Set<string>();
  want.forEach((w, i) => {
    const r = rs.find((x) => x.id === w.id)!;
    const len = lenAt(r, progress);
    const isLast = w.j === blocks(len) - 1;
    const partial = isLast && len % BLOCK !== 0;
    cells[i] = { kind: partial ? 'reserved' : 'used', id: w.id, first: !seen.has(w.id) };
    seen.add(w.id);
  });
  const res = summarize(cells, used, false);
  const need = blocks(NEWCOMER.prompt);
  res.admitted = res.freeTokens / BLOCK >= need;
  if (res.admitted) {
    let left = need;
    for (let i = 0; i < CELLS && left > 0; i++) {
      if (cells[i].kind === 'free') {
        cells[i] = { kind: 'newcomer', id: 'G', first: left === need };
        left--;
      }
    }
  }
  return res;
}
