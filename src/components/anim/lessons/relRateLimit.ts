/** Pure rate limit algorithms for lesson 7.4. Arrival times are in seconds and sorted. Each function returns one boolean per request: allowed or not. */

/** Token bucket. Starts full. Tokens refill at `refillPerSec` up to `capacity`. A request takes one token. */
export function tokenBucket(capacity: number, refillPerSec: number, arrivals: number[]): boolean[] {
  let tokens = capacity;
  let last = 0;
  return arrivals.map((t) => {
    tokens = Math.min(capacity, tokens + (t - last) * refillPerSec);
    last = t;
    if (tokens >= 1) {
      tokens -= 1;
      return true;
    }
    return false;
  });
}

/** Fixed window. One counter per window. It resets at every multiple of `windowSec`. */
export function fixedWindow(limit: number, windowSec: number, arrivals: number[]): boolean[] {
  const counts = new Map<number, number>();
  return arrivals.map((t) => {
    const w = Math.floor(t / windowSec);
    const c = counts.get(w) ?? 0;
    if (c < limit) {
      counts.set(w, c + 1);
      return true;
    }
    return false;
  });
}

/** Sliding window log. Keeps the time of every allowed request. Allows when fewer than `limit` fall in the last `windowSec`. */
export function slidingLog(limit: number, windowSec: number, arrivals: number[]): boolean[] {
  const log: number[] = [];
  return arrivals.map((t) => {
    const inWindow = log.filter((x) => x > t - windowSec).length;
    if (inWindow < limit) {
      log.push(t);
      return true;
    }
    return false;
  });
}

/** Estimated count in the sliding window: previous window count, weighted by how much of it is still inside, plus the current count. */
export const estimate = (prev: number, cur: number, elapsedSec: number, windowSec: number) => prev * ((windowSec - elapsedSec) / windowSec) + cur;

/** Sliding window counter. Two numbers per client. Allows when the estimate, counting this request, is at most `limit`. */
export function slidingCounter(limit: number, windowSec: number, arrivals: number[]): boolean[] {
  const counts = new Map<number, number>();
  return arrivals.map((t) => {
    const w = Math.floor(t / windowSec);
    const cur = counts.get(w) ?? 0;
    const prev = counts.get(w - 1) ?? 0;
    if (estimate(prev, cur, t - w * windowSec, windowSec) + 1 <= limit) {
      counts.set(w, cur + 1);
      return true;
    }
    return false;
  });
}

/** Two bursts of `limit` requests, `gapSec` apart, centred on the boundary at `windowSec`. */
export function boundaryBurst(limit: number, windowSec: number, gapSec: number): number[] {
  const a = windowSec - gapSec / 2;
  const b = windowSec + gapSec / 2;
  return [...Array<number>(limit).fill(a), ...Array<number>(limit).fill(b)];
}
