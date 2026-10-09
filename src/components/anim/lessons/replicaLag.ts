export type Policy = 'any' | 'leader-window' | 'token';

export interface FollowerView {
  lag: number;
  /** True when the follower has not yet applied the write at read time. */
  behind: boolean;
}

export interface Outcome {
  followers: FollowerView[];
  /** Chance that one read returns the old value. */
  pStale: number;
  /** Chance that one read is served by the leader. */
  pLeader: number;
}

/**
 * One user writes at time 0. After `delay` ms the same user reads.
 * Follower i applies the write at time lags[i]. A read picks one follower at random.
 */
export function readOutcome(policy: Policy, lags: number[], delay: number, window: number): Outcome {
  const followers = lags.map((lag) => ({ lag, behind: lag > delay }));
  const behind = followers.filter((f) => f.behind).length / followers.length;
  if (policy === 'any') return { followers, pStale: behind, pLeader: 0 };
  if (policy === 'leader-window') {
    return delay < window ? { followers, pStale: 0, pLeader: 1 } : { followers, pStale: behind, pLeader: 0 };
  }
  return { followers, pStale: 0, pLeader: behind };
}
