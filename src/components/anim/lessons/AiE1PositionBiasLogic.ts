/**
 * Position-bias model for lesson E1.10 (search ranking drill). Pure, illustrative.
 *
 * Ten results. Each has a true relevance (chance a user who looks at it clicks). A user looks at position k
 * with chance exam(k) = 1 / k^eta. The old ranker shows results in OLD_ORDER, which is partly wrong.
 * Observed click rate = exam(position) * relevance.
 */

export const N = 10;
/** True relevance by result id 0..9. Id 0 is the best result. */
export const REL = [0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15];
/** Result id shown at position 1..10 by the old ranker. */
export const OLD_ORDER = [3, 1, 5, 0, 2, 4, 8, 6, 7, 9];

export const exam = (k: number, eta: number) => 1 / Math.pow(k, eta);

export interface Row { id: number; pos: number; exam: number; rel: number; ctr: number; adj: number }

export function rows(eta: number): Row[] {
  return OLD_ORDER.map((id, i) => {
    const pos = i + 1;
    const e = exam(pos, eta);
    const ctr = e * REL[id];
    return { id, pos, exam: e, rel: REL[id], ctr, adj: ctr / e };
  });
}

/** Share of the 45 result pairs that a ranking orders the same way as the true relevance. */
export function pairAgreement(order: number[]): number {
  let ok = 0;
  let tot = 0;
  for (let a = 0; a < order.length; a++)
    for (let b = a + 1; b < order.length; b++) {
      tot++;
      if (REL[order[a]] > REL[order[b]]) ok++;
    }
  return ok / tot;
}

/** Re-rank by raw click rate (naive) or by click rate divided by the chance of being looked at (debiased). */
export function rerank(eta: number, debias: boolean): number[] {
  const r = rows(eta);
  return [...r].sort((x, y) => (debias ? y.adj - x.adj : y.ctr - x.ctr)).map((x) => x.id);
}
