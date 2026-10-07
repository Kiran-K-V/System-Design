/** Pure cache-eviction simulators. State after k accesses is a pure function of (policy, trace, capacity, k). */

export type Policy = 'lru' | 'lfu' | 'fifo';

export interface Entry {
  key: string;
  /** Hit count since the key entered the cache. Used by LFU. */
  freq: number;
}

export interface SimState {
  /** Display order. LRU: most recent first. FIFO: newest first. LFU: highest count first. */
  cache: Entry[];
  hits: number;
  misses: number;
  /** Result of the last access, or null before the first one. */
  last: { key: string; hit: boolean; evicted: string | null } | null;
}

export function simulate(policy: Policy, trace: string[], capacity: number, k: number): SimState {
  // Internal order: index 0 = most recently used (LRU, LFU tie-break) or newest (FIFO).
  let list: Entry[] = [];
  let hits = 0;
  let misses = 0;
  let last: SimState['last'] = null;
  const n = Math.min(k, trace.length);

  for (let i = 0; i < n; i++) {
    const key = trace[i];
    const at = list.findIndex((e) => e.key === key);
    let evicted: string | null = null;
    if (at >= 0) {
      hits++;
      const e = { ...list[at], freq: list[at].freq + 1 };
      if (policy === 'fifo') list[at] = e;
      else list = [e, ...list.slice(0, at), ...list.slice(at + 1)];
    } else {
      misses++;
      if (list.length >= capacity) {
        let victim = list.length - 1; // LRU and FIFO: the tail
        if (policy === 'lfu') {
          let best = Infinity;
          // Scan from the tail so ties go to the least recently used.
          for (let j = list.length - 1; j >= 0; j--) {
            if (list[j].freq < best) {
              best = list[j].freq;
              victim = j;
            }
          }
        }
        evicted = list[victim].key;
        list = list.filter((_, j) => j !== victim);
      }
      list = [{ key, freq: 1 }, ...list];
    }
    last = { key, hit: at >= 0, evicted };
  }

  const cache = policy === 'lfu' ? [...list].sort((a, b) => b.freq - a.freq) : list;
  return { cache, hits, misses, last };
}

export function hitRate(s: SimState): number {
  const total = s.hits + s.misses;
  return total === 0 ? 0 : s.hits / total;
}

/** Split a string such as "A B A C" or "ABAC" into keys. */
export function parseTrace(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const keys = /\s|,/.test(t) ? t.split(/[\s,]+/) : t.split('');
  return keys.filter(Boolean).slice(0, 80);
}
