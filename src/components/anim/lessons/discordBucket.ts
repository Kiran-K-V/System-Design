/** Our model, not Discord's data. Partition size for one channel bucket. */
export const LIMIT_MB = 100;
export const BUCKET_DAYS = 10;

/** MB held by one partition (one channel, one bucket). Decimal MB. Ignores Cassandra on-disk overhead. */
export const partitionMB = (msgsPerDay: number, bytesPerMsg: number, days = BUCKET_DAYS) => (msgsPerDay * days * bytesPerMsg) / 1e6;

/** Longest bucket, in whole days, that stays at or under the limit. Zero means even one day is too big. */
export const maxDays = (msgsPerDay: number, bytesPerMsg: number) => Math.floor((LIMIT_MB * 1e6) / (msgsPerDay * bytesPerMsg));
