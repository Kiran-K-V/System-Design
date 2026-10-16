/**
 * Image token math for lesson A3.5.
 * Source: https://platform.claude.com/docs/en/build-with-claude/vision (Resolution and token cost)
 * and https://platform.claude.com/docs/en/build-with-claude/vision-coordinates (reference implementation), fetched 2026-10-16.
 * Cost of an image = ceil(w / 28) x ceil(h / 28) visual tokens. Larger images are downscaled first.
 */

export interface Tier {
  id: 'standard' | 'high';
  label: string;
  maxEdge: number;
  maxTokens: number;
}

export const TIERS: Tier[] = [
  { id: 'standard', label: 'Standard tier (1568 px, 1568 tokens)', maxEdge: 1568, maxTokens: 1568 },
  { id: 'high', label: 'High-resolution tier (2576 px, 4784 tokens)', maxEdge: 2576, maxTokens: 4784 },
];

/** Input prices, USD per 1M tokens. Opus, Sonnet, Haiku 5.5: claude.com/pricing as of 2026-10-16. Haiku 4.5: the example on the vision page. */
export const IMAGE_MODELS = [
  { id: 'opus55', name: 'Opus 5.5', tier: 'high' as const, price: 4 },
  { id: 'sonnet55', name: 'Sonnet 5.5', tier: 'high' as const, price: 2 },
  { id: 'haiku55', name: 'Haiku 5.5 (prompt up to 100K)', tier: 'high' as const, price: 0.1 },
  { id: 'haiku45', name: 'Haiku 4.5', tier: 'standard' as const, price: 1 },
];

export const countImageTokens = (w: number, h: number) => Math.ceil(w / 28) * Math.ceil(h / 28);

/** Round half to even, as the page's TypeScript reference does. */
function roundTiesToEven(v: number): number {
  const f = Math.floor(v);
  if (v - f !== 0.5) return Math.round(v);
  return f % 2 === 0 ? f : f + 1;
}

/** The size Claude resizes an image to before padding. Port of the reference implementation on the vision-coordinates page. */
export function resizedSize(width: number, height: number, maxEdge: number, maxTokens: number): [number, number] {
  const fits = (w: number, h: number) =>
    Math.ceil(w / 28) * 28 <= maxEdge && Math.ceil(h / 28) * 28 <= maxEdge && countImageTokens(w, h) <= maxTokens;
  if (fits(width, height)) return [width, height];
  if (height > width) {
    const [rh, rw] = resizedSize(height, width, maxEdge, maxTokens);
    return [rw, rh];
  }
  const aspect = width / height;
  let lo = 1;
  let hi = width;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid, Math.max(roundTiesToEven(mid / aspect), 1))) lo = mid;
    else hi = mid;
  }
  return [lo, Math.max(roundTiesToEven(lo / aspect), 1)];
}

export interface ImageCost {
  sent: [number, number];
  resized: [number, number];
  wasResized: boolean;
  tokens: number;
  /** Tokens if the image were NOT downscaled (what the patch count would be at full size). */
  rawTokens: number;
  dollarsEach: number;
  dollarsPerThousand: number;
}

export function imageCost(w: number, h: number, tier: Tier, pricePerMTok: number): ImageCost {
  const resized = resizedSize(w, h, tier.maxEdge, tier.maxTokens);
  const tokens = countImageTokens(resized[0], resized[1]);
  const dollarsEach = (tokens * pricePerMTok) / 1e6;
  return {
    sent: [w, h],
    resized,
    wasResized: resized[0] !== w || resized[1] !== h,
    tokens,
    rawTokens: countImageTokens(w, h),
    dollarsEach,
    dollarsPerThousand: dollarsEach * 1000,
  };
}
