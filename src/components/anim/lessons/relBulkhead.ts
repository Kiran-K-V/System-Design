/**
 * Pure model for the bulkhead lab (lesson 7.3).
 * A service has a pool of worker threads. It calls two dependencies: A (steady) and B (the one that gets slow).
 * By Little's law (lesson 1.3), threads held = call rate x time each call holds a thread.
 * Assumption: when demand for threads is above the pool, a new call gets a thread with the same probability whichever
 * dependency it targets, so each pool accepts the fraction pool / demand of its calls.
 */

export type Mode = 'shared' | 'bulkhead' | 'breaker';

export const POOL = 100;
export const RATE_A = 50; // calls per second
export const LAT_A = 0.1; // seconds
export const RATE_B = 100;
export const BULK_B = 25; // threads reserved for B in the split modes

export interface Out {
  /** Share of A calls that get a thread, 0 to 1. */
  acceptA: number;
  /** Share of B calls that are served by a thread, 0 to 1. */
  acceptB: number;
  /** Threads in use by A and by B. */
  usedA: number;
  usedB: number;
  /** Fraction of B calls that fail fast because the breaker is open. */
  failFastB: number;
}

const frac = (pool: number, demand: number) => (demand <= pool ? 1 : pool / demand);

export function lab(latB: number, mode: Mode): Out {
  const demandA = RATE_A * LAT_A;
  const demandB = RATE_B * latB;
  if (mode === 'shared') {
    const p = frac(POOL, demandA + demandB);
    return { acceptA: p, acceptB: p, usedA: demandA * p, usedB: demandB * p, failFastB: 0 };
  }
  const poolA = POOL - BULK_B;
  const pA = frac(poolA, demandA);
  if (mode === 'bulkhead') {
    const pB = frac(BULK_B, demandB);
    return { acceptA: pA, acceptB: pB, usedA: demandA * pA, usedB: demandB * pB, failFastB: 0 };
  }
  // breaker: B calls fail fast and hold no thread (trial calls are ignored).
  return { acceptA: pA, acceptB: 0, usedA: demandA * pA, usedB: 0, failFastB: 1 };
}
