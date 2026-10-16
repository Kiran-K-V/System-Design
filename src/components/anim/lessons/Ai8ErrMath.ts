/** Logic for the A8.2 sample-size explorer. Pure functions. */

/** Wilson score interval for k successes in n trials, as fractions. z = 1.96 gives a 95% interval. */
export function wilson(k: number, n: number, z = 1.96): [number, number] {
  if (n <= 0) return [0, 1];
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/** Chance of seeing a failure type at least m times in n random traces, when it shows up in a share p of traces. */
export function seenAtLeast(p: number, n: number, m: number): number {
  if (m <= 0) return 1;
  let below = 0;
  let term = Math.pow(1 - p, n); // P(X = 0)
  for (let x = 0; x < m; x++) {
    below += term;
    term = (term * (n - x) * p) / ((x + 1) * (1 - p)); // P(X = x + 1)
  }
  return Math.max(0, 1 - below);
}

/** Smallest n that makes the chance of at least one sighting reach conf. */
export function tracesToSee(p: number, conf = 0.95): number {
  return Math.ceil(Math.log(1 - conf) / Math.log(1 - p));
}
