/**
 * Logic for the Module 6 widgets. Pure functions, no React, so a node test can check the numbers.
 * One tick is one second.
 */

export type Policy = 'unbounded' | 'block' | 'drop';

export interface LabParams {
  /** Messages per second from producers outside the burst. */
  base: number;
  /** Messages per second from producers during the burst. */
  burst: number;
  burstStart: number;
  burstLen: number;
  workers: number;
  /** Messages one worker finishes per second. */
  perWorker: number;
  /** Queue size limit in messages. Ignored for `unbounded`. */
  cap: number;
  policy: Policy;
  seconds: number;
}

export interface Tick {
  t: number;
  /** Messages the producers offered this second, including any held back earlier. */
  offered: number;
  /** Messages workers finished this second. */
  done: number;
  /** Messages waiting in the queue at the end of the second. */
  depth: number;
  /** Messages the producers are holding because the queue was full (policy `block`). */
  held: number;
  /** Messages thrown away so far (policy `drop`). */
  dropped: number;
}

export const capacity = (p: Pick<LabParams, 'workers' | 'perWorker'>) => p.workers * p.perWorker;

export const rateAt = (p: LabParams, t: number) => (t >= p.burstStart && t < p.burstStart + p.burstLen ? p.burst : p.base);

export function simulate(p: LabParams): Tick[] {
  const out: Tick[] = [];
  let depth = 0;
  let held = 0;
  let dropped = 0;
  const cap = capacity(p);
  for (let t = 0; t < p.seconds; t++) {
    const offered = rateAt(p, t) + held;
    held = 0;
    const room = p.policy === 'unbounded' ? Infinity : Math.max(0, p.cap - depth);
    const accepted = Math.min(offered, room);
    const rest = offered - accepted;
    if (p.policy === 'block') held = rest;
    else if (p.policy === 'drop') dropped += rest;
    depth += accepted;
    const done = Math.min(depth, cap);
    depth -= done;
    out.push({ t, offered, done, depth, held, dropped });
  }
  return out;
}

export interface Summary {
  peakDepth: number;
  /** Longest wait for a message that arrives at the peak: depth divided by drain rate. Seconds. */
  peakWait: number;
  /** Time in seconds when the queue and the producers' hold are empty after the burst. Null if never. */
  drainedAt: number | null;
  dropped: number;
  /** Whether workers can keep up with the base rate. If not, the queue never drains. */
  keepsUp: boolean;
}

export function summarize(ticks: Tick[], p: LabParams): Summary {
  const cap = capacity(p);
  const peakDepth = ticks.reduce((m, k) => Math.max(m, k.depth), 0);
  const end = p.burstStart + p.burstLen;
  const drained = ticks.find((k) => k.t >= end && k.depth === 0 && k.held === 0);
  return {
    peakDepth,
    peakWait: cap > 0 ? peakDepth / cap : Infinity,
    drainedAt: drained ? drained.t + 1 : null,
    dropped: ticks.length ? ticks[ticks.length - 1].dropped : 0,
    keepsUp: p.base < cap,
  };
}

/**
 * Range assignment, like Kafka's range assignor: consumers get contiguous partitions.
 * The first (partitions mod consumers) consumers get one extra.
 */
export function assign(partitions: number, consumers: number): number[][] {
  const out: number[][] = Array.from({ length: consumers }, () => []);
  if (consumers === 0) return out;
  const base = Math.floor(partitions / consumers);
  const extra = partitions % consumers;
  let next = 0;
  for (let c = 0; c < consumers; c++) {
    const n = base + (c < extra ? 1 : 0);
    for (let k = 0; k < n; k++) out[c].push(next++);
  }
  return out;
}

export interface GroupStats {
  working: number;
  idle: number;
  mostPartitions: number;
}

export function groupStats(partitions: number, consumers: number): GroupStats {
  const a = assign(partitions, consumers);
  return {
    working: a.filter((x) => x.length > 0).length,
    idle: a.filter((x) => x.length === 0).length,
    mostPartitions: a.reduce((m, x) => Math.max(m, x.length), 0),
  };
}

/** A stable hash of a key to a partition. Same key, same partition. (Not Kafka's own hash function.) */
export function keyPartition(key: string, partitions: number): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return (h >>> 0) % partitions;
}

export type AckPolicy = 'ack-first' | 'ack-after' | 'ack-after-dedupe';
/** How many of the consumer's two steps finished before it crashed: 0, 1, or 2 (2 means no crash). */
export type Progress = 0 | 1 | 2;
export type Verdict = 'once' | 'lost' | 'duplicate';

export interface Outcome {
  verdict: Verdict;
  /** Times the effect (the credit) was applied. */
  effects: number;
  redelivered: boolean;
  steps: ('receive' | 'ack' | 'process')[];
}

/**
 * One message, one consumer. The consumer does two steps after receiving: ack and process.
 * The broker redelivers when it never saw an ack. A restarted consumer then runs both steps to the end.
 * With dedupe, the processed id is saved in the same transaction as the effect, so a repeat has no effect.
 */
export function deliveryOutcome(policy: AckPolicy, progress: Progress): Outcome {
  const order: ('ack' | 'process')[] = policy === 'ack-first' ? ['ack', 'process'] : ['process', 'ack'];
  const done = order.slice(0, progress);
  const acked = done.includes('ack');
  let effects = done.includes('process') ? 1 : 0;
  const redelivered = !acked;
  if (redelivered) {
    const seen = policy === 'ack-after-dedupe' && effects === 1;
    if (!seen) effects += 1;
  }
  const verdict: Verdict = effects === 0 ? 'lost' : effects === 1 ? 'once' : 'duplicate';
  return { verdict, effects, redelivered, steps: ['receive', ...order] };
}

export interface DlqResult {
  /** Receives the message got before it moved to the dead-letter queue. 0 if it never moved. */
  receives: number;
  deadLettered: boolean;
}

/** A message that always fails, with a limit of `maxReceiveCount` receives. */
export function poisonRoute(maxReceiveCount: number, attemptsAvailable: number): DlqResult {
  const receives = Math.min(maxReceiveCount, attemptsAvailable);
  return { receives, deadLettered: attemptsAvailable >= maxReceiveCount };
}
