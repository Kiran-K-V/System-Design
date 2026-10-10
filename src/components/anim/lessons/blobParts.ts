/** Amazon S3 multipart upload limits (S3 User Guide, "Multipart upload limits"). */
export const MIB = 1024 ** 2;
export const GIB = 1024 ** 3;
export const TIB = 1024 ** 4;
export const MAX_PARTS = 10_000;
export const MIN_PART = 5 * MIB;
export const MAX_PART = 5 * GIB;
/** One PUT request can carry at most 5 GB (S3 User Guide, "Uploading objects"). */
export const SINGLE_PUT_MAX = 5 * GIB;
/** 10,000 parts of 5 GiB each. The docs list 48.8 TiB. */
export const MAX_OBJECT = MAX_PARTS * MAX_PART;

export const partsFor = (size: number, part: number) => Math.ceil(size / part);

/** Smallest part size that fits the file in 10,000 parts and respects the 5 MiB floor. Rounded up to a whole MiB. */
export const minPartFor = (size: number) => Math.max(MIN_PART, Math.ceil(size / MAX_PARTS / MIB) * MIB);

export interface Check {
  parts: number;
  ok: boolean;
  reason: string;
}

export function check(size: number, part: number): Check {
  const parts = partsFor(size, part);
  if (size > MAX_OBJECT) return { parts, ok: false, reason: 'Larger than the maximum object size' };
  if (part < MIN_PART) return { parts, ok: false, reason: 'Part is below the 5 MiB minimum' };
  if (part > MAX_PART) return { parts, ok: false, reason: 'Part is above the 5 GiB maximum' };
  if (parts > MAX_PARTS) return { parts, ok: false, reason: 'More than 10,000 parts' };
  return { parts, ok: true, reason: 'Valid' };
}

export function fmt(bytes: number): string {
  if (bytes >= TIB) return `${+(bytes / TIB).toFixed(2)} TiB`;
  if (bytes >= GIB) return `${+(bytes / GIB).toFixed(2)} GiB`;
  return `${+(bytes / MIB).toFixed(1)} MiB`;
}
