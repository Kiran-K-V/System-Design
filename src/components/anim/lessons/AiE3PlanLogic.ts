/** Capacity planner for one model on one GPU type. All defaults are illustrative; measure your own goodput. */
export const HOURS_PER_MONTH = 730;
export const RESERVED_DISCOUNT = 0.4; // illustrative
export const SPOT_DISCOUNT = 0.6; // illustrative

export interface PlanIn {
  peakRps: number;
  outTokens: number;
  goodputPerReplica: number; // output tokens/s one replica serves while meeting both SLOs, from a load test
  gpusPerReplica: number;
  avgOverPeak: number; // 0..1
  headroom: number; // 0..1 extra capacity above peak
  spareReplicas: number; // failure spares
  modelGB: number;
  loadGBps: number; // effective read speed of the weights source
  startOverheadS: number; // schedule, image pull, server start, warm-up
  rampPerMin: number; // demand growth per minute as share of current load, 0..1
  gpuHour: number;
  reservedShare: number; // 0..1 of the fleet
  spotShare: number; // 0..1 of the fleet
  warmPool: number; // idle replicas kept ready in the autoscaled plan
}

export interface PlanOut {
  peakTokS: number;
  replicasNoHeadroom: number;
  replicas: number;
  gpus: number;
  loadS: number;
  coldStartS: number;
  headroomNeeded: number; // share of load that can grow while a new replica starts
  headroomOk: boolean;
  blendedHour: number;
  fixedMonthly: number;
  avgUtil: number;
  autoReplicas: number;
  autoMonthly: number;
  perMillionFixed: number;
}

export function plan(p: PlanIn): PlanOut {
  const peakTokS = p.peakRps * p.outTokens;
  const replicasNoHeadroom = Math.max(1, Math.ceil(peakTokS / p.goodputPerReplica));
  const replicas = Math.max(1, Math.ceil((peakTokS * (1 + p.headroom)) / p.goodputPerReplica)) + p.spareReplicas;
  const gpus = replicas * p.gpusPerReplica;
  const loadS = p.modelGB / p.loadGBps;
  const coldStartS = loadS + p.startOverheadS;
  const headroomNeeded = (p.rampPerMin * coldStartS) / 60;
  const od = Math.max(0, 1 - p.reservedShare - p.spotShare);
  const blendedHour = p.gpuHour * (p.reservedShare * (1 - RESERVED_DISCOUNT) + p.spotShare * (1 - SPOT_DISCOUNT) + od);
  const fixedMonthly = gpus * blendedHour * HOURS_PER_MONTH;
  const avgTokS = peakTokS * p.avgOverPeak;
  const avgUtil = avgTokS / (replicas * p.goodputPerReplica);
  const autoReplicas = Math.ceil((avgTokS * (1 + p.headroom)) / p.goodputPerReplica) + p.spareReplicas + p.warmPool;
  const autoMonthly = autoReplicas * p.gpusPerReplica * p.gpuHour * HOURS_PER_MONTH;
  const tokensPerMonth = avgTokS * 3600 * HOURS_PER_MONTH;
  return {
    peakTokS, replicasNoHeadroom, replicas, gpus, loadS, coldStartS, headroomNeeded,
    headroomOk: p.headroom >= headroomNeeded, blendedHour, fixedMonthly, avgUtil, autoReplicas, autoMonthly,
    perMillionFixed: tokensPerMonth ? fixedMonthly / (tokensPerMonth / 1e6) : 0,
  };
}

export const DEFAULTS: PlanIn = {
  peakRps: 60, outTokens: 500, goodputPerReplica: 2400, gpusPerReplica: 2, avgOverPeak: 0.4, headroom: 0.2,
  spareReplicas: 1, modelGB: 140, loadGBps: 2, startOverheadS: 60, rampPerMin: 0.3, gpuHour: 4, reservedShare: 0.5, spotShare: 0, warmPool: 1,
};
