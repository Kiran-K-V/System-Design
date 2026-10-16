/** Rows returned by filtered vector search, expected values under stated assumptions. Pure functions.
 *  Assumption: matching rows are spread evenly through the index (the filter is unrelated to the query). */

export const MAX_SCAN_TUPLES = 20000; // pgvector hnsw.max_scan_tuples default

/** Post-filter: the index returns ef candidates, the filter keeps the matching share. */
export const postRows = (ef: number, sel: number, limit: number) => Math.min(limit, ef * sel);

/** Iterative scan: keep scanning until `limit` rows pass or max_scan_tuples is reached. */
export const iterRows = (sel: number, limit: number, maxScan = MAX_SCAN_TUPLES) => Math.min(limit, maxScan * sel);
export const iterScanned = (sel: number, limit: number, maxScan = MAX_SCAN_TUPLES) => Math.min(maxScan, limit / sel);

/** Pre-filter then exact scan of the matching rows. */
export const exactRows = (n: number, sel: number, limit: number) => Math.min(limit, n * sel);
export const exactScanned = (n: number, sel: number) => n * sel;
