/** Spread partitions over the consumers of one group. Each partition goes to exactly one consumer. */
export function assign(partitions: number, consumers: number): number[][] {
  const out: number[][] = Array.from({ length: consumers }, () => []);
  for (let p = 0; p < partitions; p++) out[p % consumers].push(p);
  return out;
}

export interface GroupStats {
  /** Consumers that read at least one partition. */
  busy: number;
  idle: number;
  /** Most partitions held by one consumer. */
  maxLoad: number;
  /** Speed-up over one consumer when load is even per partition: partitions / maxLoad. */
  speedup: number;
}

export function stats(partitions: number, consumers: number): GroupStats {
  const a = assign(partitions, consumers);
  const busy = a.filter((x) => x.length > 0).length;
  const maxLoad = Math.max(0, ...a.map((x) => x.length));
  return { busy, idle: consumers - busy, maxLoad, speedup: maxLoad ? partitions / maxLoad : 0 };
}
