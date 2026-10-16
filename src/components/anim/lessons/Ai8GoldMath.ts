/** Logic for the A8.3 overlap checker. Pure functions. */

export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function ngrams(ws: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i + n <= ws.length; i++) out.push(ws.slice(i, i + n).join(' '));
  return out;
}

export interface Overlap {
  words: string[];
  /** True for each word that sits inside at least one n-gram that also appears in the corpus. */
  covered: boolean[];
  /** How many of the item's n-grams appear in the corpus. */
  hits: number;
  total: number;
  /** An item is flagged when any n-gram matches. */
  flagged: boolean;
}

export function overlap(item: string, corpus: string, n: number): Overlap {
  const ws = words(item);
  const bank = new Set(ngrams(words(corpus), n));
  const covered = ws.map(() => false);
  let hits = 0;
  const grams = ngrams(ws, n);
  grams.forEach((g, i) => {
    if (bank.has(g)) {
      hits++;
      for (let k = i; k < i + n; k++) covered[k] = true;
    }
  });
  return { words: ws, covered, hits, total: grams.length, flagged: hits > 0 };
}
