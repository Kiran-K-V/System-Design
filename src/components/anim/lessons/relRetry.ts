/**
 * Pure retry simulator for lesson 7.2.
 * N clients all find the server down at t = 0, so every first call fails. The server is back at once but can answer only
 * `capacityPerSec` calls per second. Calls beyond that in the same 20 ms slot are rejected and their clients retry.
 * The five policies differ only in how long a client waits before its next try.
 * Randomness comes from a seeded generator, so the result is the same on the server and in the browser.
 */

export type Policy = 'fixed' | 'expo' | 'full' | 'equal' | 'decorrelated';

export const POLICIES: { id: Policy; label: string }[] = [
  { id: 'fixed', label: 'Fixed delay' },
  { id: 'expo', label: 'Backoff, no jitter' },
  { id: 'full', label: 'Full jitter' },
  { id: 'equal', label: 'Equal jitter' },
  { id: 'decorrelated', label: 'Decorrelated jitter' },
];

export interface Params {
  clients: number;
  capacityPerSec: number;
  /** Total calls a client may make, including the first one that failed. */
  maxCalls: number;
  baseMs: number;
  capMs: number;
  seed: number;
}

export const SLOT_MS = 20;
export const BIN_SLOTS = 5;

export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same formulas as the AWS Architecture Blog simulator. n counts retries so far, starting at 0. */
export function waitMs(policy: Policy, n: number, prevSleep: number, p: Pick<Params, 'baseMs' | 'capMs'>, rand: () => number): number {
  const expo = Math.min(p.capMs, p.baseMs * 2 ** n);
  switch (policy) {
    case 'fixed':
      return p.baseMs;
    case 'expo':
      return expo;
    case 'full':
      return rand() * expo;
    case 'equal':
      return expo / 2 + rand() * (expo / 2);
    case 'decorrelated':
      return Math.min(p.capMs, p.baseMs + rand() * (prevSleep * 3 - p.baseMs));
  }
}



export interface Result {
  /** Calls that reach the server in each 20 ms slot. Slot 0 holds the first calls, which are the same for every policy. */
  calls: number[];
  /** Retry calls in bins of 100 ms (5 slots). Bin b covers 100b + 20 ms to 100b + 100 ms. Slot 0 is left out. */
  bins: number[];
  totalCalls: number;
  /** Most retry calls in one 100 ms bin, as calls per second. */
  peakPerSec: number;
  /** Time in ms of the slot where the last client succeeded, or null if someone never did. */
  doneMs: number | null;
  gaveUp: number;
}

export function simulate(policy: Policy, p: Params): Result {
  const rand = prng(p.seed);
  const capBin = Math.max(1, Math.round((p.capacityPerSec * BIN_SLOTS * SLOT_MS) / 1000));
  const used: number[] = [];
  // Each client: time of its next call (ms), calls made, last sleep.
  const next = new Array<number>(p.clients).fill(0);
  const made = new Array<number>(p.clients).fill(0);
  const sleep = new Array<number>(p.clients).fill(p.baseMs);
  const active = new Set<number>(Array.from({ length: p.clients }, (_, i) => i));
  const calls: number[] = [];
  let lastSuccessSlot = -1;
  let gaveUp = 0;

  // Slot 0 is the outage: every first call fails without touching capacity.
  const byTime = new Map<number, number[]>();
  const add = (slot: number, c: number) => {
    const l = byTime.get(slot);
    if (l) l.push(c);
    else byTime.set(slot, [c]);
  };
  const schedule = (c: number, nowSlot: number) => {
    const w = waitMs(policy, made[c] - 1, sleep[c], p, rand);
    sleep[c] = Math.max(w, 1);
    next[c] = nowSlot * SLOT_MS + w;
    add(Math.max(nowSlot + 1, Math.floor(next[c] / SLOT_MS)), c);
  };
  calls[0] = p.clients;
  for (let c = 0; c < p.clients; c++) {
    made[c] = 1;
    schedule(c, 0);
  }

  const lastSlotLimit = 200000;
  for (let slot = 1; active.size > 0 && slot < lastSlotLimit; slot++) {
    const due = byTime.get(slot);
    if (!due) continue;
    byTime.delete(slot);
    calls[slot] = due.length;
    due.forEach((c) => {
      made[c]++;
      const bin = Math.floor((slot - 1) / BIN_SLOTS);
      used[bin] = used[bin] ?? 0;
      if (used[bin] < capBin) {
        used[bin]++;
        active.delete(c);
        lastSuccessSlot = slot;
      } else if (made[c] >= p.maxCalls) {
        active.delete(c);
        gaveUp++;
      } else {
        schedule(c, slot);
      }
    });
  }
  const filled = Array.from({ length: calls.length }, (_, i) => calls[i] ?? 0);
  const total = filled.reduce((a, b) => a + b, 0);
  const bins: number[] = [];
  for (let sl = 1; sl < filled.length; sl++) {
    const b = Math.floor((sl - 1) / BIN_SLOTS);
    bins[b] = (bins[b] ?? 0) + filled[sl];
  }
  return {
    calls: filled,
    bins,
    totalCalls: total,
    peakPerSec: Math.max(...bins, 0) * (1000 / (BIN_SLOTS * SLOT_MS)),
    doneMs: gaveUp > 0 || lastSuccessSlot < 0 ? null : lastSuccessSlot * SLOT_MS,
    gaveUp,
  };
}
