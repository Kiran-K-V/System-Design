/**
 * Update-size arithmetic for lesson E1.9 (online and continual learning).
 * Model: the payload is the raw embedding values of the touched IDs only (ids x dims x bytes per value).
 * It ignores keys, optimizer state, headers, and compression. The Monolith paper's own example uses the same
 * shape: 100,000 IDs at 1,024 dimensions is 4 KB per ID, about 400 MB per minute (Section 3.2.2).
 */

export const BYTES = { float32: 4, float16: 2 } as const;
export type Dtype = keyof typeof BYTES;

/** Bytes shipped in one sync (decimal units: 1 KB = 1,000 bytes would give 409.6 MB here, the paper rounds to 400). */
export function syncBytes(ids: number, dims: number, dtype: Dtype): number {
  return ids * dims * BYTES[dtype];
}

export const toMB = (bytes: number) => bytes / 1e6;
export const toGB = (bytes: number) => bytes / 1e9;

export interface Load {
  perSyncMB: number;
  perDayGB: number;
  /** Sustained megabits per second, one serving copy. */
  mbpsOne: number;
  /** Same for all copies together (the trainer sends to every copy). */
  mbpsAll: number;
}

export function load(ids: number, dims: number, dtype: Dtype, everyMin: number, copies: number): Load {
  const b = syncBytes(ids, dims, dtype);
  const syncsPerDay = (24 * 60) / everyMin;
  const mbpsOne = (b * 8) / (everyMin * 60) / 1e6;
  return { perSyncMB: toMB(b), perDayGB: toGB(b * syncsPerDay), mbpsOne, mbpsAll: mbpsOne * copies };
}
