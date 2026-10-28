/**
 * Logic for lesson E3.2 (PagedAttention). Pure functions, no React.
 *  1. `walk()`: a real block manager (block table, reference counts, copy-on-write) run on a toy scenario.
 *  2. `explore()`: an ILLUSTRATIVE comparison of max-length reservation and paged blocks over one KV pool.
 */

/* ---------- 1. Block manager walk-through ---------- */

export const BLOCK_SIZE = 4;
export const PHYS_BLOCKS = 8;
/** Order in which the free list hands out physical blocks. Chosen so the blocks look scattered. */
export const FREE_ORDER = [1, 4, 2, 0, 6, 5, 3, 7];

export interface Snap {
  caption: string;
  /** Block table per sequence: physical block id for each logical block. */
  tables: Record<string, number[]>;
  /** Tokens stored per sequence. */
  lens: Record<string, number>;
  /** Reference count per physical block. */
  refs: number[];
  /** Filled slots per physical block. */
  fill: number[];
  /** Highlighted table entry and physical block. */
  focus?: { seq: string; logical: number; phys: number };
  copiedFrom?: number;
}

class Manager {
  free = [...FREE_ORDER];
  refs = Array(PHYS_BLOCKS).fill(0) as number[];
  fill = Array(PHYS_BLOCKS).fill(0) as number[];
  tables: Record<string, number[]> = {};
  lens: Record<string, number> = {};
  copies = 0;

  alloc(): number {
    const p = this.free.shift();
    if (p === undefined) throw new Error('out of blocks');
    this.refs[p] = 1;
    this.fill[p] = 0;
    return p;
  }
  /** Add tokens to a sequence. Returns the touched logical block, and the old physical block if a copy-on-write happened. */
  append(seq: string, n = 1): { logical: number; phys: number; copiedFrom?: number } {
    let res = { logical: 0, phys: 0 } as { logical: number; phys: number; copiedFrom?: number };
    for (let k = 0; k < n; k++) {
      const t = (this.tables[seq] ??= []);
      const len = (this.lens[seq] ??= 0);
      const logical = Math.floor(len / BLOCK_SIZE);
      if (logical === t.length) t.push(this.alloc());
      let phys = t[logical];
      let copiedFrom: number | undefined;
      if (this.refs[phys] > 1) {
        const np = this.alloc();
        this.fill[np] = this.fill[phys];
        this.refs[phys]--;
        t[logical] = np;
        copiedFrom = phys;
        phys = np;
        this.copies++;
      }
      this.fill[phys]++;
      this.lens[seq] = len + 1;
      res = { logical, phys, copiedFrom };
    }
    return res;
  }
  fork(from: string, to: string) {
    this.tables[to] = [...this.tables[from]];
    this.lens[to] = this.lens[from];
    this.tables[to].forEach((p) => this.refs[p]++);
  }
  release(seq: string) {
    this.tables[seq].forEach((p) => {
      this.refs[p]--;
      if (this.refs[p] === 0) {
        this.fill[p] = 0;
        this.free.unshift(p);
      }
    });
    delete this.tables[seq];
    delete this.lens[seq];
  }
  snap(caption: string, focus?: Snap['focus'], copiedFrom?: number): Snap {
    return {
      caption,
      tables: JSON.parse(JSON.stringify(this.tables)),
      lens: { ...this.lens },
      refs: [...this.refs],
      fill: [...this.fill],
      focus,
      copiedFrom,
    };
  }
}

/** Scenario: a request wants two samples from one 7-token prompt (parallel sampling), then an unrelated request arrives. */
export function walk(): Snap[] {
  const m = new Manager();
  const out: Snap[] = [];
  out.push(m.snap('The GPU holds a pool of 8 physical blocks. Each block stores the keys and values of 4 tokens. Nothing is reserved yet. Every free block is the same size, so any free block can serve any request.'));

  let r = m.append('A1', 7);
  out.push(m.snap('A prompt of 7 tokens arrives for sample A1. It needs 2 logical blocks. The free list hands out physical blocks 1 and 4, which are not neighbours, and that is fine. The last block holds 3 tokens and 1 slot is empty. That slot is the only waste.', { seq: 'A1', logical: 1, phys: r.phys }));

  m.fork('A1', 'A2');
  out.push(m.snap('The client asked for two samples of the same prompt. Sample A2 gets its own block table that points to the same physical blocks. No key or value is copied. Both blocks now have reference count 2.', { seq: 'A2', logical: 1, phys: 4 }));

  r = m.append('A1');
  out.push(m.snap('A1 writes its first new token. Its last block, 4, has reference count 2, so writing in place would change what A2 sees. Copy on write: take a new block (2), copy the 3 stored tokens, lower the count of block 4 to 1, and write the new token into the copy.', { seq: 'A1', logical: 1, phys: r.phys }, r.copiedFrom));

  r = m.append('A2');
  out.push(m.snap('A2 writes its first new token. Block 4 now has reference count 1, so A2 owns it alone and writes in place. No second copy is needed. The prompt block 1 stays shared, because nobody writes to it.', { seq: 'A2', logical: 1, phys: r.phys }));

  const a = m.append('A1');
  const b = m.append('A2');
  out.push(m.snap('Both samples write one more token. Each last block is full, so each sequence takes a fresh block on demand (0 and 6). Blocks are taken one at a time, as the sequence grows. Nothing was booked ahead.', { seq: 'A2', logical: 2, phys: b.phys }));
  void a;

  r = m.append('B', 3);
  out.push(m.snap('An unrelated request B arrives with a 3-token prompt. It takes the next free block, 5. The pool is not split into per-request regions, so B fits wherever space is free.', { seq: 'B', logical: 0, phys: r.phys }));

  m.release('A2');
  out.push(m.snap('A2 finishes. Its own blocks (4 and 6) go back to the free list. Block 1 stays, because A1 still points to it: its count drops from 2 to 1. Freed blocks can serve the next request at once.'));
  return out;
}

/* ---------- 2. Reservation versus paging over one pool ---------- */

export const POOL_TOKENS = 32768;
export const MAX_REQS = 96;
export const RESERVE_CHOICES = [1024, 2048, 4096];
export const BLOCK_CHOICES = [1, 4, 16, 64, 256];

/** Small deterministic generator so the page renders the same on server and client. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tokens held by each waiting-to-run request at the moment of the snapshot (prompt plus output so far). Many are short, a few are long. */
export const LENGTHS: number[] = (() => {
  const r = rng(2023);
  return Array.from({ length: MAX_REQS }, () => 30 + Math.floor(Math.pow(r(), 2.2) * 1800));
})();

export interface Pool {
  admitted: number;
  usedTokens: number;
  heldTokens: number;
  wastedTokens: number;
  freeTokens: number;
  /** Share of held space that holds no token. */
  wastePct: number;
}

function summarize(admitted: number, used: number, held: number): Pool {
  return {
    admitted,
    usedTokens: used,
    heldTokens: held,
    wastedTokens: held - used,
    freeTokens: POOL_TOKENS - held,
    wastePct: held === 0 ? 0 : (100 * (held - used)) / held,
  };
}

/** Each request books `reserve` tokens for its whole life. A request longer than the reservation is cut at `reserve`. */
export function contiguous(reserve: number, lens: number[] = LENGTHS): Pool {
  const n = Math.min(lens.length, Math.floor(POOL_TOKENS / reserve));
  const used = lens.slice(0, n).reduce((s, l) => s + Math.min(l, reserve), 0);
  return summarize(n, used, n * reserve);
}

/** Each request holds whole blocks, one more only when the last one is full. Admit while the blocks fit. */
export function paged(block: number, lens: number[] = LENGTHS): Pool {
  let held = 0;
  let used = 0;
  let n = 0;
  for (const l of lens) {
    const b = Math.ceil(l / block) * block;
    if (held + b > POOL_TOKENS) break;
    held += b;
    used += l;
    n++;
  }
  return summarize(n, used, held);
}
