/**
 * Logic for lesson A12.4 (video generation). Pure functions.
 * Prices (per second, USD, as of 2026-10-18):
 *   Google Veo 3.1 on the Gemini API, audio on by default: https://ai.google.dev/gemini-api/docs/pricing ("Last updated 2026-10-16 UTC").
 *   Runway: credits at $0.01 each, https://docs.dev.runwayml.com/guides/pricing/ (gen4.5 12 credits/s, gen4_turbo 5 credits/s).
 *   Luma Ray3.2, per video, https://lumalabs.ai/api/pricing (5 s 720p $0.30, 1080p $1.20; 10 s 720p $0.90, 1080p $3.60).
 * Veo durations are 4, 6 or 8 s, and 1080p and 4k need 8 s: https://ai.google.dev/gemini-api/docs/veo
 */

/** Frames in a clip. */
export const frames = (seconds: number, fps: number) => seconds * fps;

/** Attention work, in units of "one image's self-attention", when every frame attends only to itself. */
export const perFrameWork = (f: number) => f;

/** Same unit, when every token in every frame attends to every token in every frame. Pairs grow with the square of the token count. */
export const fullSpacetimeWork = (f: number) => f * f;

/** Tokens in a clip when one frame is n tokens. */
export const clipTokens = (f: number, tokensPerFrame: number) => f * tokensPerFrame;

export interface Offer {
  id: string;
  label: string;
  resolutions: string[];
  /** Allowed clip lengths in seconds, given the resolution. */
  durations: (res: string) => number[];
  /** Price in USD for one clip. */
  price: (res: string, seconds: number) => number;
  note: string;
}

const VEO: Record<string, Record<string, number>> = {
  Standard: { '720p': 0.4, '1080p': 0.4, '4k': 0.6 },
  Fast: { '720p': 0.1, '1080p': 0.12, '4k': 0.3 },
  Lite: { '720p': 0.05, '1080p': 0.08 },
};
const veoDur = (res: string) => (res === '720p' ? [4, 6, 8] : [8]);

export const OFFERS: Offer[] = [
  ...(['Standard', 'Fast', 'Lite'] as const).map((tier) => ({
    id: `veo-${tier}`,
    label: `Veo 3.1 ${tier}`,
    resolutions: Object.keys(VEO[tier]),
    durations: veoDur,
    price: (res: string, s: number) => VEO[tier][res] * s,
    note: 'Per second, audio on. 1080p and 4k need 8 s.',
  })),
  {
    id: 'runway-gen4.5',
    label: 'Runway gen4.5',
    resolutions: ['not listed'],
    durations: () => [5, 10],
    price: (_r, s) => 12 * 0.01 * s,
    note: '12 credits per second at $0.01 per credit. The page lists no resolution.',
  },
  {
    id: 'runway-gen4_turbo',
    label: 'Runway gen4_turbo',
    resolutions: ['not listed'],
    durations: () => [5, 10],
    price: (_r, s) => 5 * 0.01 * s,
    note: '5 credits per second at $0.01 per credit. The page lists no resolution.',
  },
  {
    id: 'luma-ray3.2',
    label: 'Luma Ray3.2',
    resolutions: ['720p', '1080p'],
    durations: () => [5, 10],
    price: (res, s) => ({ '720p': { 5: 0.3, 10: 0.9 }, '1080p': { 5: 1.2, 10: 3.6 } } as Record<string, Record<number, number>>)[res][s],
    note: 'Priced per video, not per second.',
  },
];

export const pricePerSecond = (usd: number, seconds: number) => usd / seconds;

/** Wall-clock polls for a job that takes `jobSeconds`, polling every `interval` seconds, until done is true. */
export const pollsNeeded = (jobSeconds: number, interval: number) => Math.ceil(jobSeconds / interval);

/** GPU dollars for a clip rendered frame by frame at `secPerFrame` GPU seconds each. */
export const gpuUsd = (f: number, secPerFrame: number, usdPerHour: number) => ((f * secPerFrame) / 3600) * usdPerHour;
