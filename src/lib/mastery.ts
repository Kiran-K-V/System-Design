// Client-only store for review cards, confidence calibration, and self-explanations.
// Read localStorage only from effects or handlers, never during render, to keep SSR hydration stable.

export type Confidence = 'sure' | 'think' | 'guess';

/** [points if right, points if wrong]. Each level beats the one below it only when p(right) > 0.5. */
export const POINTS: Record<Confidence, [number, number]> = {
  sure: [3, -2],
  think: [2, -1],
  guess: [1, 0],
};

export interface Card {
  box: number; // 1..5, Leitner box
  due: number; // epoch ms
  seen: number;
  right: number;
}
type Cards = Record<string, Card>;
type Calibration = Record<Confidence, [number, number]>; // [right, total]
type Explain = Record<string, { text: string; at: number }>;

const DAY = 86_400_000;
const BOX_DAYS = [0, 1, 2, 4, 8, 16];
const EVENT = 'sd-mastery';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  dispatchEvent(new Event(EVENT));
}

export const loadCards = () => read<Cards>('sd-cards', {});
export const loadCalibration = () =>
  read<Calibration>('sd-calibration', { sure: [0, 0], think: [0, 0], guess: [0, 0] });
export const loadExplain = () => read<Explain>('sd-explain', {});
export const loadDone = () => read<string[]>('sd-progress', []);

export function recordAnswer(id: string, correct: boolean, confidence: Confidence, now = Date.now()) {
  const cards = loadCards();
  const prev = cards[id] ?? { box: 1, due: now, seen: 0, right: 0 };
  const box = correct ? Math.min(5, prev.box + 1) : 1;
  cards[id] = { box, due: now + BOX_DAYS[box] * DAY, seen: prev.seen + 1, right: prev.right + (correct ? 1 : 0) };
  const cal = loadCalibration();
  cal[confidence] = [cal[confidence][0] + (correct ? 1 : 0), cal[confidence][1] + 1];
  localStorage.setItem('sd-calibration', JSON.stringify(cal));
  write('sd-cards', cards);
}

export function saveExplain(id: string, text: string) {
  const all = loadExplain();
  all[id] = { text, at: Date.now() };
  write('sd-explain', all);
}

/** Share of "sure" answers that were right. Null until there are 5 samples. */
export function sureAccuracy(cal: Calibration): number | null {
  const [right, total] = cal.sure;
  return total >= 5 ? right / total : null;
}

/** Deterministic permutation of 0..n-1 from a string seed (mulberry32 + Fisher-Yates). */
export function seededOrder(n: number, seed: string): number[] {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let s = h >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Options that point at each other ("both of the above") must keep their authored order. */
export const canShuffle = (options: string[]) =>
  !options.some((o) => /\b(above|below|both|none of|all of|previous)\b/i.test(o));
