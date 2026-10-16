/** Reciprocal rank fusion. score(d) = sum over lists of 1 / (k + rank). A document missing from a list adds 0. */
export function rrf(ranks: (number | null)[], k: number): number {
  return ranks.reduce<number>((s, r) => (r == null ? s : s + 1 / (k + r)), 0);
}

export interface Fused {
  id: string;
  ranks: (number | null)[];
  score: number;
}

export function fuse(docs: { id: string; ranks: (number | null)[] }[], k: number): Fused[] {
  return docs
    .map((d) => ({ ...d, score: rrf(d.ranks, k) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
