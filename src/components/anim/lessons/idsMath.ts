/** Snowflake IDs, logical clocks, hybrid logical clocks, and UUIDv7 for the ids-and-time lesson. No imports, so a node test can load it. */

/** twepoch in Twitter's 2010 snowflake source: 2010-11-04T01:42:54.657Z, in Unix milliseconds. */
export const SNOWFLAKE_EPOCH = 1288834974657;

export const BITS = { timestamp: 41, machine: 10, sequence: 12 } as const;

export function snowflakeId(elapsedMs: number, machine: number, seq: number): bigint {
  if (machine < 0 || machine >= 1 << BITS.machine) throw new Error('machine id out of range');
  if (seq < 0 || seq >= 1 << BITS.sequence) throw new Error('sequence out of range');
  return (BigInt(elapsedMs) << 22n) | (BigInt(machine) << 12n) | BigInt(seq);
}

export function decodeSnowflake(id: bigint) {
  const elapsed = Number(id >> 22n);
  return { elapsed, machine: Number((id >> 12n) & 1023n), seq: Number(id & 4095n), unixMs: elapsed + SNOWFLAKE_EPOCH };
}

/** Bits padded to a fixed width. */
export const bin = (n: number | bigint, width: number) => BigInt(n).toString(2).padStart(width, '0');

/** Years the 41-bit timestamp lasts. */
export const timestampYears = () => 2 ** BITS.timestamp / (1000 * 60 * 60 * 24 * 365.25);

/** Lamport receive: max(local, received) + 1. */
export const lamportReceive = (local: number, received: number) => Math.max(local, received) + 1;

/** Vector clock receive at process i: element-wise max, then add 1 to own entry. */
export function vcReceive(local: number[], received: number[], i: number): number[] {
  const out = local.map((x, k) => Math.max(x, received[k]));
  out[i] += 1;
  return out;
}

export type Order = 'before' | 'after' | 'equal' | 'concurrent';

export function vcCompare(a: number[], b: number[]): Order {
  const le = a.every((x, i) => x <= b[i]);
  const ge = a.every((x, i) => x >= b[i]);
  if (le && ge) return 'equal';
  if (le) return 'before';
  if (ge) return 'after';
  return 'concurrent';
}

/** Hybrid logical clock (Kulkarni et al.). State (l, c). pt is the node's physical time now. */
export function hlcLocal(l: number, c: number, pt: number): [number, number] {
  const l2 = Math.max(l, pt);
  return [l2, l2 === l ? c + 1 : 0];
}

export function hlcReceive(l: number, c: number, lm: number, cm: number, pt: number): [number, number] {
  const l2 = Math.max(l, lm, pt);
  if (l2 === l && l2 === lm) return [l2, Math.max(c, cm) + 1];
  if (l2 === l) return [l2, c + 1];
  if (l2 === lm) return [l2, cm + 1];
  return [l2, 0];
}

/** First 48 bits of a UUIDv7 (the Unix millisecond timestamp), as the first two groups of the string. */
export function uuidV7Prefix(unixMs: number): string {
  const hex = unixMs.toString(16).padStart(12, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8)}`;
}
