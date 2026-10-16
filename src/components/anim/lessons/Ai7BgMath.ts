/** Capacity and fair-share arithmetic for lesson A7.7. Pure functions. */

export interface Capacity {
  /** Runs in flight at the same time (Little's law: arrival rate x time in system). */
  busy: number;
  /** Workers to provision, rounded up. */
  workers: number;
  runsPerDay: number;
  /** Model spend per day if every run spends its whole budget cap. An upper bound. */
  modelPerDay: number;
  /** Sandbox spend per day for busy time only. */
  busyVmPerDay: number;
  /** Sandbox spend per day if all provisioned workers run all day. */
  fleetVmPerDay: number;
}

export function capacity(runsPerHour: number, minutesPerRun: number, peak: number, headroom: number, capUsd: number, vmUsdPerHour: number): Capacity {
  const busy = (runsPerHour * peak * minutesPerRun) / 60;
  const workers = Math.ceil(busy * headroom - 1e-9);
  const runsPerDay = runsPerHour * 24;
  return {
    busy,
    workers,
    runsPerDay,
    modelPerDay: runsPerDay * capUsd,
    busyVmPerDay: (runsPerDay * minutesPerRun * vmUsdPerHour) / 60,
    fleetVmPerDay: workers * 24 * vmUsdPerHour,
  };
}

export interface FairResult {
  /** Start-wait in minutes for each job of the small tenant. */
  waitsSmall: number[];
  meanSmall: number;
  maxSmall: number;
  meanBig: number;
  /** Minutes until the last job of any tenant starts. */
  lastStart: number;
}

/**
 * Two tenants submit at once: a big tenant with `big` jobs and a small tenant with `small` jobs.
 * Every job takes `jobMin` minutes and one worker slot. FIFO serves the big tenant's jobs first (it arrived first).
 * Fair share takes one job from each tenant in turn until the small tenant has none left.
 */
export function fairShare(big: number, small: number, workers: number, jobMin: number, fair: boolean): FairResult {
  const order: ('A' | 'B')[] = [];
  if (fair) {
    let a = big;
    let b = small;
    while (a > 0 || b > 0) {
      if (a > 0) {
        order.push('A');
        a--;
      }
      if (b > 0) {
        order.push('B');
        b--;
      }
    }
  } else {
    for (let i = 0; i < big; i++) order.push('A');
    for (let i = 0; i < small; i++) order.push('B');
  }
  const waitsSmall: number[] = [];
  let sumBig = 0;
  order.forEach((t, i) => {
    const start = Math.floor(i / workers) * jobMin;
    if (t === 'B') waitsSmall.push(start);
    else sumBig += start;
  });
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return {
    waitsSmall,
    meanSmall: mean(waitsSmall),
    maxSmall: waitsSmall.length ? Math.max(...waitsSmall) : 0,
    meanBig: big ? sumBig / big : 0,
    lastStart: Math.floor((order.length - 1) / workers) * jobMin,
  };
}
