/**
 * Freshness logic for one stored response.
 * RFC 9111: a response is fresh while its age is below its freshness lifetime.
 * s-maxage overrides max-age in shared caches and is ignored by private caches (RFC 9111 5.2.2.10).
 * RFC 5861: stale-while-revalidate allows serving stale during the window while revalidating in the background.
 * RFC 5861: stale-if-error allows serving stale when the origin answers 500, 502, 503 or 504.
 */

export interface Directives {
  maxAge: number;
  sMaxAge: number | null;
  swr: number;
  sie: number;
}

export type Outcome = 'fresh' | 'stale-while-revalidate' | 'stale-if-error' | 'revalidate' | 'error';

export function lifetime(d: Directives, shared: boolean): number {
  return shared && d.sMaxAge !== null ? d.sMaxAge : d.maxAge;
}

/** What a cache does with a request when the stored response has this age. */
export function decide(d: Directives, shared: boolean, age: number, originDown: boolean): { outcome: Outcome; originCalled: boolean; userWaitsForOrigin: boolean } {
  const life = lifetime(d, shared);
  if (age < life) return { outcome: 'fresh', originCalled: false, userWaitsForOrigin: false };
  if (age < life + d.swr) return { outcome: 'stale-while-revalidate', originCalled: true, userWaitsForOrigin: false };
  if (originDown) {
    if (age < life + d.sie) return { outcome: 'stale-if-error', originCalled: true, userWaitsForOrigin: true };
    return { outcome: 'error', originCalled: true, userWaitsForOrigin: true };
  }
  return { outcome: 'revalidate', originCalled: true, userWaitsForOrigin: true };
}

export function human(sec: number): string {
  if (sec >= 86400 && sec % 86400 === 0) return `${sec / 86400} d`;
  if (sec >= 3600 && sec % 3600 === 0) return `${sec / 3600} h`;
  if (sec >= 60 && sec % 60 === 0) return `${sec / 60} min`;
  return `${sec} s`;
}
