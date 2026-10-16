/** Toy permission-aware retrieval model for lesson A5.9. Data is illustrative. */

export interface Chunk {
  id: string;
  tenant: 'acme' | 'globex';
  /** Groups allowed to read it. */
  groups: string[];
  title: string;
  /** Similarity to the demo query, higher is closer. */
  score: number;
}

export interface User {
  id: string;
  tenant: 'acme' | 'globex';
  groups: string[];
}

export const USERS: User[] = [
  { id: 'Ana', tenant: 'acme', groups: ['eng', 'all'] },
  { id: 'Raj', tenant: 'acme', groups: ['hr', 'all'] },
  { id: 'Zed', tenant: 'globex', groups: ['eng', 'all'] },
];

// Sorted by score, highest first. Query: "salary bands for engineers".
export const CHUNKS: Chunk[] = [
  { id: 'c1', tenant: 'acme', groups: ['hr'], title: 'HR: salary bands', score: 0.93 },
  { id: 'c2', tenant: 'globex', groups: ['all'], title: 'Globex: pay policy', score: 0.91 },
  { id: 'c3', tenant: 'acme', groups: ['hr'], title: 'HR: raise cycle', score: 0.9 },
  { id: 'c4', tenant: 'acme', groups: ['hr'], title: 'HR: bonus pool', score: 0.88 },
  { id: 'c5', tenant: 'acme', groups: ['eng'], title: 'Eng: level ladder', score: 0.86 },
  { id: 'c6', tenant: 'acme', groups: ['all'], title: 'Handbook: pay FAQ', score: 0.84 },
  { id: 'c7', tenant: 'globex', groups: ['eng'], title: 'Globex: eng levels', score: 0.8 },
  { id: 'c8', tenant: 'acme', groups: ['all'], title: 'Handbook: benefits', score: 0.7 },
];

export type Scope = 'shared' | 'per-tenant';
export type Mode = 'none' | 'post' | 'pre';

export const canRead = (u: User, c: Chunk) => c.tenant === u.tenant && c.groups.some((g) => u.groups.includes(g));

export interface Result {
  /** What the index scan produced before any app-side filter. */
  scanned: Chunk[];
  /** What the user is shown. */
  shown: Chunk[];
  /** Shown chunks the user must not read. */
  leaked: Chunk[];
  /** How many scanned chunks were dropped by a post-filter. A UI that says "4 matches, 1 shown" leaks this. */
  hiddenCount: number;
}

export function search(u: User, scope: Scope, mode: Mode, k: number): Result {
  // The scope fixes which chunks the index holds. A per-tenant index holds only the user's tenant.
  const pool = CHUNKS.filter((c) => (scope === 'per-tenant' ? c.tenant === u.tenant : true));
  if (mode === 'pre') {
    const shown = pool.filter((c) => canRead(u, c)).slice(0, k);
    return { scanned: shown, shown, leaked: [], hiddenCount: 0 };
  }
  const scanned = pool.slice(0, k);
  const shown = mode === 'post' ? scanned.filter((c) => canRead(u, c)) : scanned;
  return {
    scanned,
    shown,
    leaked: shown.filter((c) => !canRead(u, c)),
    hiddenCount: scanned.length - shown.length,
  };
}
