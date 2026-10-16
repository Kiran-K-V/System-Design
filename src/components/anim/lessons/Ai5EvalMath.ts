/** Retrieval metrics for lesson A5.10. rel[i] is true when the chunk at rank i+1 is relevant. Binary relevance. */

export const recallAtK = (rel: boolean[], k: number, totalRelevant: number) =>
  totalRelevant === 0 ? 0 : rel.slice(0, k).filter(Boolean).length / totalRelevant;

export const precisionAtK = (rel: boolean[], k: number) => (k === 0 ? 0 : rel.slice(0, k).filter(Boolean).length / k);

/** Reciprocal rank of the first relevant chunk inside the top k, 0 if none. */
export const reciprocalRank = (rel: boolean[], k: number) => {
  const i = rel.slice(0, k).findIndex(Boolean);
  return i === -1 ? 0 : 1 / (i + 1);
};

const dcg = (n: number) => {
  let s = 0;
  for (let i = 1; i <= n; i++) s += 1 / Math.log2(i + 1);
  return s;
};

/** nDCG@k with binary gains: DCG of the list over DCG of the ideal list (all relevant first). */
export const ndcgAtK = (rel: boolean[], k: number, totalRelevant: number) => {
  let d = 0;
  rel.slice(0, k).forEach((r, i) => {
    if (r) d += 1 / Math.log2(i + 2);
  });
  const ideal = dcg(Math.min(k, totalRelevant));
  return ideal === 0 ? 0 : d / ideal;
};

/** Mean of precision@i taken at each relevant rank i (average precision). Rank-aware precision. */
export const meanPrecisionAtRelevant = (rel: boolean[], k: number) => {
  let hits = 0;
  let sum = 0;
  rel.slice(0, k).forEach((r, i) => {
    if (r) {
      hits++;
      sum += hits / (i + 1);
    }
  });
  return hits === 0 ? 0 : sum / hits;
};
