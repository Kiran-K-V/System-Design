/** Pure model for the fault lab (lesson 7.1). Four servers behind a load balancer. One server, S3, gets a fault. */

export type Fault = 'none' | 'crash' | 'slow' | 'partition' | 'gray';
export type Phase = 'before' | 'after';

export const SERVERS = 4;
/** Example numbers. Each server can handle 1,000 requests per second. Total demand is 2,800. */
export const CAPACITY_QPS = 1000;
export const DEMAND_QPS = 2800;
export const CLIENT_TIMEOUT_MS = 1000;
export const NORMAL_LATENCY_MS = 20;
export const SLOW_LATENCY_MS = 3000;
/** In the gray failure, this share of the requests that reach S3 fail. */
export const GRAY_FAIL_SHARE = 0.3;

export interface Verdict {
  /** What the load balancer health check says about S3. */
  detector: 'passes' | 'fails';
  /** Is S3 still in the pool? */
  inPool: boolean;
  /** Share of all requests that fail, in percent. */
  errorPct: number;
  /** Load on each server that is still in the pool, as a share of its capacity, in percent. */
  loadPct: number;
  /** p99 latency seen by clients in ms. */
  p99Ms: number;
  detectorText: string;
  usersText: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Round robin sends each pool server an equal share. A request to S3 fails or hangs depending on the fault.
 * phase "before": the load balancer has not yet reacted. phase "after": it has removed every server whose probe fails.
 */
export function evaluate(fault: Fault, phase: Phase): Verdict {
  const probeFails = fault === 'crash' || fault === 'partition';
  const removed = probeFails && phase === 'after';
  const poolSize = removed ? SERVERS - 1 : SERVERS;
  const loadPct = round1(((DEMAND_QPS / poolSize) / CAPACITY_QPS) * 100);
  const shareToS3 = removed ? 0 : 1 / poolSize;

  let failShareOnS3 = 0;
  let p99Ms = NORMAL_LATENCY_MS;
  if (fault === 'crash' || fault === 'partition') failShareOnS3 = 1;
  if (fault === 'slow') failShareOnS3 = 1; // every request to S3 takes longer than the client timeout
  if (fault === 'gray') failShareOnS3 = GRAY_FAIL_SHARE;
  const errorPct = round1(shareToS3 * failShareOnS3 * 100);

  // A request that hangs holds the client for the whole timeout. A refused connection fails at once.
  if ((fault === 'slow' || fault === 'partition') && errorPct > 1) p99Ms = CLIENT_TIMEOUT_MS;

  const detectorText = {
    none: 'Probe passes. All 4 servers in the pool.',
    crash: removed ? 'Probe failed twice. S3 is out of the pool.' : 'Probe is failing, but the threshold is not reached yet.',
    slow: 'Probe passes. /health answers in a few ms, so S3 stays in the pool.',
    partition: removed ? 'Probe cannot reach S3. It is out of the pool, but it is still running.' : 'Probe times out. The threshold is not reached yet.',
    gray: 'Probe passes. The process is up and /health answers.',
  }[fault];

  const usersText = {
    none: 'Every request succeeds in about 20 ms.',
    crash: removed ? 'No errors. The survivors absorb the load.' : '1 request in 4 fails at once (connection refused).',
    slow: '1 request in 4 waits the full 1,000 ms timeout and fails. The other 3 are fast.',
    partition: removed ? 'No errors for users. S3 is alive on its side, and may still act on its own.' : '1 request in 4 times out until the probe threshold is reached.',
    gray: '3 in 10 requests that land on S3 fail. About 1 in 13 users sees an error. S3 stays in the pool.',
  }[fault];

  return { detector: probeFails ? 'fails' : 'passes', inPool: !removed, errorPct, loadPct, p99Ms, detectorText, usersText };
}
