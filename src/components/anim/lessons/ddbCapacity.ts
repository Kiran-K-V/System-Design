/** DynamoDB capacity units. Rules from the DynamoDB developer guide, "Read and write operations". */

export type ReadMode = 'eventual' | 'strong' | 'transactional';
export type WriteMode = 'standard' | 'transactional';

/** Read units for one read of an item. The size is rounded up to the next 4 KB. */
export function readUnits(itemKb: number, mode: ReadMode): number {
  const blocks = Math.max(1, Math.ceil(itemKb / 4));
  return mode === 'eventual' ? blocks / 2 : mode === 'strong' ? blocks : blocks * 2;
}

/** Write units for one write of an item. The size is rounded up to the next 1 KB. Transactional writes cost double. */
export function writeUnits(itemKb: number, mode: WriteMode): number {
  const blocks = Math.max(1, Math.ceil(itemKb / 1));
  return mode === 'standard' ? blocks : blocks * 2;
}

export const PARTITION_RCU = 3000;
export const PARTITION_WCU = 1000;

export interface CapacityPlan {
  rcu: number;
  wcu: number;
  /** Fewest partitions that could carry the load, if the keys spread evenly. */
  minPartitions: number;
  /** Most writes per second one partition key can take, because its partition caps out at 1,000 write units. */
  hotKeyWritesPerSec: number;
}

export function plan(itemKb: number, readsPerSec: number, readMode: ReadMode, writesPerSec: number, writeMode: WriteMode): CapacityPlan {
  const rcu = readUnits(itemKb, readMode) * readsPerSec;
  const wcu = writeUnits(itemKb, writeMode) * writesPerSec;
  return {
    rcu,
    wcu,
    minPartitions: Math.max(1, Math.ceil(rcu / PARTITION_RCU), Math.ceil(wcu / PARTITION_WCU)),
    hotKeyWritesPerSec: Math.floor(PARTITION_WCU / writeUnits(itemKb, writeMode)),
  };
}
