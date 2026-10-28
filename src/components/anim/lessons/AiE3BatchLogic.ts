/**
 * Logic for lesson E3.1 (continuous batching). Pure functions, no React.
 * Two models live here:
 *  1. `schedule()`: the iteration-level scheduler of Orca (Algorithm 1) on four toy requests, for the step-through animation.
 *  2. `simulate()`: an ILLUSTRATIVE load simulator that compares request-level (static) batching with iteration-level (continuous) batching.
 */

/* ---------- 1. Scheduler walk-through (Orca Algorithm 1, simplified to one worker) ---------- */

export interface Req {
  id: string;
  /** Prompt tokens. */
  prompt: number;
  /** Output tokens the request will really produce (unknown to the scheduler). */
  out: number;
  /** The client's max_tokens: the most tokens (prompt + output) the request may reach. The scheduler reserves this much KV memory. */
  maxTokens: number;
  /** Iteration before which the request has not arrived yet (it is visible from iteration `arrive`). */
  arrive: number;
}

export const MAX_BS = 3;
export const KV_SLOTS = 12;
export const REQS: Req[] = [
  { id: 'A', prompt: 2, out: 4, maxTokens: 6, arrive: 1 },
  { id: 'B', prompt: 2, out: 2, maxTokens: 4, arrive: 1 },
  { id: 'C', prompt: 3, out: 3, maxTokens: 6, arrive: 1 },
  { id: 'D', prompt: 2, out: 2, maxTokens: 4, arrive: 3 },
];

export interface Snap {
  iter: number;
  /** Requests running in this iteration. */
  running: { id: string; made: number; first: boolean }[];
  /** Requests visible but not admitted. */
  waiting: string[];
  /** Requests that finished in this iteration. */
  finished: string[];
  /** Requests finished in earlier iterations. */
  done: string[];
  reserved: number;
  /** The first waiting request, when it was refused, and why. */
  blocked?: { id: string; need: number; free: number };
}

/** Run the Orca loop for as many iterations as needed. Select() admits in arrival order, stops at max_bs, and stops when the next request's max_tokens does not fit in the free KV slots. */
export function schedule(reqs: Req[] = REQS, maxBs = MAX_BS, kvSlots = KV_SLOTS): Snap[] {
  const made: Record<string, number> = {};
  const state: Record<string, 'new' | 'running' | 'done'> = {};
  reqs.forEach((r) => {
    made[r.id] = 0;
    state[r.id] = 'new';
  });
  let reserved = 0;
  const snaps: Snap[] = [];
  const done: string[] = [];
  for (let iter = 1; iter <= 50; iter++) {
    const visible = reqs.filter((r) => r.arrive <= iter && state[r.id] !== 'done');
    const batch: Req[] = [];
    let blocked: Snap['blocked'];
    for (const r of visible) {
      if (batch.length === maxBs) break;
      if (state[r.id] === 'new') {
        if (reserved + r.maxTokens > kvSlots) {
          blocked = { id: r.id, need: r.maxTokens, free: kvSlots - reserved };
          break;
        }
        reserved += r.maxTokens;
        state[r.id] = 'running';
        batch.push(r);
        made[r.id] += 0; // admitted this iteration
      } else batch.push(r);
    }
    if (batch.length === 0) break;
    const running = batch.map((r) => ({ id: r.id, made: made[r.id] + 1, first: made[r.id] === 0 }));
    const finished: string[] = [];
    batch.forEach((r) => {
      made[r.id] += 1;
      if (made[r.id] === r.out) {
        finished.push(r.id);
        state[r.id] = 'done';
        reserved -= r.maxTokens;
      }
    });
    const waiting = visible.filter((r) => !batch.includes(r)).map((r) => r.id);
    snaps.push({ iter, running, waiting, finished, done: [...done], reserved: reserved + finished.reduce((s, id) => s + reqs.find((r) => r.id === id)!.maxTokens, 0), blocked });
    done.push(...finished);
  }
  return snaps;
}

/* ---------- 2. Load simulator (illustrative) ---------- */

/** Small deterministic random generator, so server and browser render the same numbers. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** ILLUSTRATIVE model: a decode step costs a fixed floor (reading the weights) plus a small amount per sequence in the batch. */
export const STEP_BASE_MS = 25;
export const STEP_PER_SEQ_MS = 1;
export const MAX_BATCH = 16;
export const HORIZON_S = 600;
export const LOADS = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3];

export interface Job {
  arrive: number; // seconds
  out: number; // output tokens
}

/** Poisson arrivals. Output lengths: 70% short (20 to 80), 25% medium (100 to 300), 5% long (800 to 1,500). Illustrative. */
export function makeJobs(rate: number, seed = 7): Job[] {
  const rand = rng(seed);
  const jobs: Job[] = [];
  let t = 0;
  for (;;) {
    t += -Math.log(1 - rand()) / rate;
    if (t >= HORIZON_S) break;
    const u = rand();
    const v = rand();
    const out = u < 0.7 ? 20 + Math.floor(v * 61) : u < 0.95 ? 100 + Math.floor(v * 201) : 800 + Math.floor(v * 701);
    jobs.push({ arrive: t, out });
  }
  return jobs;
}

export interface SimResult {
  /** Requests finished by the end of the horizon, per second. */
  throughput: number;
  /** Median and 95th percentile of (time in system / output tokens), in milliseconds. Orca reports latency per generated token for the same reason. */
  p50: number;
  p95: number;
  finished: number;
  arrived: number;
}

const pct = (xs: number[], p: number) => {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

const stepSec = (n: number) => (STEP_BASE_MS + STEP_PER_SEQ_MS * n) / 1000;

/** Request-level batching: when the engine is idle, take up to MAX_BATCH waiting requests, run until the longest one ends, then return them all together. */
export function simulateStatic(jobs: Job[], maxBatch = MAX_BATCH): SimResult {
  let t = 0;
  let i = 0;
  const lat: number[] = [];
  while (t < HORIZON_S) {
    if (i >= jobs.length) break;
    if (jobs[i].arrive > t) t = jobs[i].arrive;
    const batch: Job[] = [];
    while (i < jobs.length && jobs[i].arrive <= t && batch.length < maxBatch) batch.push(jobs[i++]);
    const steps = Math.max(...batch.map((j) => j.out));
    t += steps * stepSec(batch.length);
    if (t <= HORIZON_S) batch.forEach((j) => lat.push(((t - j.arrive) / j.out) * 1000));
  }
  return { throughput: lat.length / HORIZON_S, p50: pct(lat, 0.5), p95: pct(lat, 0.95), finished: lat.length, arrived: jobs.length };
}

/** Iteration-level batching: before every step, admit waiting requests while there is a free slot. A request returns the moment it ends. */
export function simulateContinuous(jobs: Job[], maxBatch = MAX_BATCH): SimResult {
  let t = 0;
  let i = 0;
  let running: { arrive: number; left: number; out: number }[] = [];
  const lat: number[] = [];
  while (t < HORIZON_S) {
    while (i < jobs.length && jobs[i].arrive <= t && running.length < maxBatch) {
      running.push({ arrive: jobs[i].arrive, left: jobs[i].out, out: jobs[i].out });
      i++;
    }
    if (running.length === 0) {
      if (i >= jobs.length) break;
      t = jobs[i].arrive;
      continue;
    }
    t += stepSec(running.length);
    running.forEach((r) => (r.left -= 1));
    if (t <= HORIZON_S) running.filter((r) => r.left === 0).forEach((r) => lat.push(((t - r.arrive) / r.out) * 1000));
    running = running.filter((r) => r.left > 0);
  }
  return { throughput: lat.length / HORIZON_S, p50: pct(lat, 0.5), p95: pct(lat, 0.95), finished: lat.length, arrived: jobs.length };
}

export interface SweepPoint {
  load: number;
  stat: SimResult;
  cont: SimResult;
}

export const SWEEP: SweepPoint[] = LOADS.map((load) => {
  const jobs = makeJobs(load);
  return { load, stat: simulateStatic(jobs), cont: simulateContinuous(jobs) };
});
