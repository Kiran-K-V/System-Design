/** Routing model for the gateway simulator. Prices: claude.com/pricing, as of 2026-10-16. Capability and latency are illustrative. */
export interface Target {
  id: 'haiku' | 'sonnet' | 'opus';
  name: string;
  /** USD per 1M input tokens. Haiku 5.5 is the 100K-prompt-or-less tier. */
  input: number;
  /** USD per 1M output tokens. */
  output: number;
  /** Illustrative capability level, 1 to 3. Not a benchmark. */
  cap: number;
  /** Illustrative end-to-end latency in ms for a short answer. Not measured. */
  latencyMs: number;
}

export const TARGETS: Target[] = [
  { id: 'haiku', name: 'Haiku 5.5', input: 0.1, output: 0.5, cap: 1, latencyMs: 600 },
  { id: 'sonnet', name: 'Sonnet 5.5', input: 2, output: 10, cap: 2, latencyMs: 1200 },
  { id: 'opus', name: 'Opus 5.5', input: 4, output: 20, cap: 3, latencyMs: 2000 },
];

export type Policy = 'cost' | 'latency' | 'capability';
export type Difficulty = 'simple' | 'hard';
/** Minimum capability each task needs (illustrative). */
export const NEED: Record<Difficulty, number> = { simple: 1, hard: 2 };

export const costOf = (t: Target, inTok: number, outTok: number) => (inTok * t.input + outTok * t.output) / 1e6;

export interface Route {
  /** Capable targets in policy order. The gateway tries them top to bottom. */
  order: Target[];
  chosen: Target | null;
  /** True when the first target in order was unhealthy, so the gateway fell back. */
  fellBack: boolean;
  cost: number;
  latencyMs: number;
}

export function pickRoute(policy: Policy, diff: Difficulty, healthy: Record<Target['id'], boolean>, inTok: number, outTok: number): Route {
  const capable = TARGETS.filter((t) => t.cap >= NEED[diff]);
  const key = (t: Target) => (policy === 'cost' ? costOf(t, inTok, outTok) : policy === 'latency' ? t.latencyMs : -t.cap);
  const order = [...capable].sort((a, b) => key(a) - key(b));
  const chosen = order.find((t) => healthy[t.id]) ?? null;
  return {
    order,
    chosen,
    fellBack: !!chosen && chosen.id !== order[0].id,
    cost: chosen ? costOf(chosen, inTok, outTok) : 0,
    latencyMs: chosen ? chosen.latencyMs : 0,
  };
}

/** Blended cost per request when a share goes to the cheap target and the rest to the strong one. */
export const blended = (cheapShare: number, cheap: number, strong: number) => cheapShare * cheap + (1 - cheapShare) * strong;
