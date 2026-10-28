/** Illustrative autoscaling simulation. Demand is in "replicas worth of traffic". Not a measurement. */
export const DT = 5; // seconds per tick
export const TICKS = 360; // 30 minutes
export const WARM_START_S = 20; // a warm-pool replica still needs to start its server process
export const METRIC_LAG_S = 30; // delay between traffic and the autoscaler seeing it
export const SCALE_DOWN_WINDOW_S = 300;

export function demandAt(t: number, base: number, spike: number): number {
  const s = t * DT;
  if (s < 300) return base;
  if (s < 360) return base + ((spike - base) * (s - 300)) / 60;
  if (s < 1020) return spike;
  if (s < 1080) return spike - ((spike - base) * (s - 1020)) / 60;
  return base;
}

export interface SimIn {
  base: number;
  spike: number;
  coldStartS: number;
  warmPool: number;
  targetUtil: number; // 0..1, share of one replica's capacity the scaler aims to use
  gpuHour: number;
  gpusPerReplica: number;
}
export interface SimOut {
  demand: number[];
  ready: number[];
  droppedShare: number;
  dropSeconds: number;
  costPerHour: number; // average over the 30 minutes
  peakReady: number;
}

export function simulate(p: SimIn): SimOut {
  const demand: number[] = [];
  const readyArr: number[] = [];
  let ready = Math.ceil(p.base / p.targetUtil);
  let pool = p.warmPool;
  const starting: { at: number; warm: boolean }[] = [];
  const refills: number[] = [];
  const desiredHist: number[] = [];
  let dropped = 0;
  let total = 0;
  let dropSteps = 0;
  let billed = 0;
  for (let t = 0; t < TICKS; t++) {
    for (let i = starting.length - 1; i >= 0; i--) if (starting[i].at <= t) { ready++; starting.splice(i, 1); }
    for (let i = refills.length - 1; i >= 0; i--) if (refills[i] <= t) { pool++; refills.splice(i, 1); }
    const d = demandAt(t, p.base, p.spike);
    const seen = demandAt(Math.max(0, t - Math.round(METRIC_LAG_S / DT)), p.base, p.spike);
    const want = Math.ceil(seen / p.targetUtil);
    desiredHist.push(want);
    const win = Math.round(SCALE_DOWN_WINDOW_S / DT);
    const desired = Math.max(...desiredHist.slice(-win));
    const have = ready + starting.length;
    if (want > have) {
      for (let k = 0; k < want - have; k++) {
        if (pool > 0) { pool--; starting.push({ at: t + Math.ceil(WARM_START_S / DT), warm: true }); refills.push(t + Math.ceil(p.coldStartS / DT)); }
        else starting.push({ at: t + Math.ceil(p.coldStartS / DT), warm: false });
      }
    } else if (desired < ready) ready = Math.max(desired, 1);
    demand.push(d);
    readyArr.push(ready);
    total += d;
    if (d > ready) { dropped += d - ready; dropSteps++; }
    billed += ready + starting.length + pool + refills.length;
  }
  return {
    demand,
    ready: readyArr,
    droppedShare: total ? dropped / total : 0,
    dropSeconds: dropSteps * DT,
    costPerHour: (billed / TICKS) * p.gpusPerReplica * p.gpuHour,
    peakReady: Math.max(...readyArr),
  };
}
