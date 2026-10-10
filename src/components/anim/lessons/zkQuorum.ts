/** Servers that must agree for a write: more than half. */
export const majority = (n: number) => Math.floor(n / 2) + 1;
/** Servers that can fail while writes still work. */
export const tolerated = (n: number) => n - majority(n);
/** Writes need a majority of the whole ensemble, not of the servers that are up. */
export const canWrite = (n: number, up: number) => up >= majority(n);
