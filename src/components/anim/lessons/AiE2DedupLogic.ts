/** Simhash for the E2.1 dedup demo. 32-bit, word level. Pure functions, no React. */

export const words = (t: string) => t.toLowerCase().match(/[a-z0-9']+/g) ?? [];

/** FNV-1a, 32 bit. */
export function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Each word votes on each of 32 bits (+1 if its hash bit is 1, -1 if 0). The sign of the total is the fingerprint bit. */
export function simhash(text: string): number {
  const votes = new Array<number>(32).fill(0);
  for (const w of words(text)) {
    const h = fnv(w);
    for (let b = 0; b < 32; b++) votes[b] += (h >>> b) & 1 ? 1 : -1;
  }
  let out = 0;
  for (let b = 0; b < 32; b++) if (votes[b] > 0) out |= 1 << b;
  return out >>> 0;
}

export function hamming(a: number, b: number): number {
  let x = (a ^ b) >>> 0;
  let n = 0;
  while (x) {
    n += x & 1;
    x >>>= 1;
  }
  return n;
}

export const bits = (h: number) => h.toString(2).padStart(32, '0');

/** Share of distinct words the two texts have in common (Jaccard). */
export function jaccard(a: string, b: string): number {
  const A = new Set(words(a));
  const B = new Set(words(b));
  let inter = 0;
  A.forEach((w) => B.has(w) && inter++);
  return inter / (A.size + B.size - inter);
}

export interface Pair {
  id: string;
  label: string;
  a: string;
  b: string;
}
/** All texts are made up (illustrative). */
export const PAIRS: Pair[] = [
  {
    id: 'copy',
    label: 'Exact copy',
    a: 'Our store ships worldwide. Orders over fifty dollars get free delivery and easy returns within thirty days.',
    b: 'Our store ships worldwide. Orders over fifty dollars get free delivery and easy returns within thirty days.',
  },
  {
    id: 'near',
    label: 'Same page, new footer',
    a: 'Our store ships worldwide. Orders over fifty dollars get free delivery and easy returns within thirty days. Sign up for our newsletter.',
    b: 'Our store ships worldwide. Orders over fifty dollars get free delivery and easy returns within thirty days. Follow us on social media.',
  },
  {
    id: 'rewrite',
    label: 'Light rewrite',
    a: 'Our store ships worldwide. Orders over fifty dollars get free delivery and easy returns within thirty days.',
    b: 'We ship to every country. Orders above fifty dollars get free delivery, and returns are easy within thirty days.',
  },
  {
    id: 'topic',
    label: 'Same topic, different text',
    a: 'Our store ships worldwide. Orders over fifty dollars get free delivery and easy returns within thirty days.',
    b: 'Shipping policy for Brightleaf Tea: parcels leave our warehouse on Tuesdays and travel by rail before the last mile.',
  },
];
