/**
 * Exploration simulator for lesson E1.10 (video recommendation). Pure, deterministic, illustrative.
 *
 * World: 100 videos, each with a hidden "good-watch" rate q. The system starts with a noisy estimate for the
 * 15 head videos (old history) and none for the other 85 (new or never shown). Each step it shows one video:
 * with probability 1 - eps the best estimated one, with probability eps a random one. It sees a good watch
 * (1) or not (0) and updates that video's mean. Short term is the average q shown in the first window.
 * Long term is the average q shown in the last window. Results average over SEEDS worlds.
 */

export const N_ITEMS = 100;
export const N_HEAD = 15;
export const N_GEMS = 6;
export const STEPS = 3000;
export const SHORT_WINDOW = 100;
export const LONG_WINDOW = 600;
export const SEEDS = 24;
export const EPS_GRID = [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Point { eps: number; short: number; long: number }

function runOne(eps: number, seed: number): { short: number; long: number } {
  const r = rng(seed * 7919 + 13);
  // Hidden rates: head videos 0.35 to 0.50, 6 new "gems" 0.52 to 0.72, the rest mostly low.
  const q: number[] = [];
  for (let i = 0; i < N_ITEMS; i++) q.push(i < N_HEAD ? 0.35 + 0.15 * r() : i < N_HEAD + N_GEMS ? 0.52 + 0.2 * r() : 0.5 * r() * r());
  const n = new Array(N_ITEMS).fill(0);
  const sum = new Array(N_ITEMS).fill(0);
  const est = new Array(N_ITEMS).fill(0);
  for (let i = 0; i < N_HEAD; i++) {
    n[i] = 50;
    sum[i] = Math.round(50 * (q[i] + (r() - 0.5) * 0.06));
    est[i] = sum[i] / n[i];
  }
  let sShort = 0;
  let sLong = 0;
  for (let t = 0; t < STEPS; t++) {
    let pick = 0;
    if (r() < eps) pick = Math.floor(r() * N_ITEMS);
    else for (let i = 1; i < N_ITEMS; i++) if (est[i] > est[pick]) pick = i;
    const good = r() < q[pick] ? 1 : 0;
    n[pick]++;
    sum[pick] += good;
    est[pick] = sum[pick] / n[pick];
    if (t < SHORT_WINDOW) sShort += q[pick];
    if (t >= STEPS - LONG_WINDOW) sLong += q[pick];
  }
  return { short: sShort / SHORT_WINDOW, long: sLong / LONG_WINDOW };
}

/** Average over SEEDS worlds at one exploration rate. */
export function runAt(eps: number): Point {
  let s = 0;
  let l = 0;
  for (let k = 1; k <= SEEDS; k++) {
    const o = runOne(eps, k);
    s += o.short;
    l += o.long;
  }
  return { eps, short: s / SEEDS, long: l / SEEDS };
}

/** The whole curve, indexed to eps = 0 equal to 100. */
export function curve(): Point[] {
  const raw = EPS_GRID.map(runAt);
  const b = raw[0];
  return raw.map((p) => ({ eps: p.eps, short: (100 * p.short) / b.short, long: (100 * p.long) / b.long }));
}
