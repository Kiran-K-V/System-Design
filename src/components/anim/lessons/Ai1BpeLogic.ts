/** Tiny byte-pair encoding trainer. Words are split into symbols; the most frequent adjacent pair is merged. */
export interface BpeStep {
  words: string[][];
  /** Pair counts before the merge, sorted high to low (ties keep first-seen order). */
  counts: { pair: [string, string]; n: number }[];
  merged?: { pair: [string, string]; token: string; id: number };
}

export function pairCounts(words: string[][]): { pair: [string, string]; n: number }[] {
  const map = new Map<string, { pair: [string, string]; n: number }>();
  for (const w of words) {
    for (let i = 0; i + 1 < w.length; i++) {
      const key = w[i] + '\u0000' + w[i + 1];
      const e = map.get(key);
      if (e) e.n++;
      else map.set(key, { pair: [w[i], w[i + 1]], n: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.n - a.n);
}

export function applyMerge(words: string[][], [a, b]: [string, string]): string[][] {
  return words.map((w) => {
    const out: string[] = [];
    for (let i = 0; i < w.length; i++) {
      if (i + 1 < w.length && w[i] === a && w[i + 1] === b) {
        out.push(a + b);
        i++;
      } else out.push(w[i]);
    }
    return out;
  });
}

/** Runs `merges` merges. New token ids start at 256, as in minbpe (ids 0..255 are raw bytes). */
export function trainBpe(text: string, merges: number): BpeStep[] {
  let words = text.split(/\s+/).filter(Boolean).map((w) => [...w]);
  const steps: BpeStep[] = [];
  for (let m = 0; m < merges; m++) {
    const counts = pairCounts(words);
    if (!counts.length) break;
    const pair = counts[0].pair;
    steps.push({ words, counts, merged: { pair, token: pair[0] + pair[1], id: 256 + m } });
    words = applyMerge(words, pair);
  }
  steps.push({ words, counts: pairCounts(words) });
  return steps;
}
