/**
 * Candidate counts by hop for lesson E1.10 (People You May Know drill). Pure, illustrative.
 *
 * Every member has `friends` connections. A hop-2 path is friend, then friend of that friend. Many of those
 * paths lead to the member, to existing friends, or to someone reached twice, so only `1 - overlap` of the
 * paths are new people. Hop 3 repeats the step. The mutual-friends filter keeps people reached through at
 * least `minMutual` friends; we assume each extra required mutual friend keeps only `KEEP` of the rest.
 */

export const KEEP = 0.3;

export interface Hop { hop: number; paths: number; candidates: number }

export function hops(friends: number, overlap: number, minMutual: number): Hop[] {
  const out: Hop[] = [];
  let frontier = friends;
  out.push({ hop: 1, paths: friends, candidates: friends });
  for (let h = 2; h <= 3; h++) {
    const paths = frontier * Math.max(friends - 1, 0);
    const fresh = paths * (1 - overlap);
    const kept = fresh * Math.pow(KEEP, Math.max(minMutual - 1, 0));
    out.push({ hop: h, paths, candidates: kept });
    frontier = fresh;
  }
  return out;
}
