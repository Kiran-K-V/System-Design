/**
 * Logic for lesson A12.1 (vision encoders and VLMs). Pure functions.
 * Anthropic: ceil(w/28) x ceil(h/28) visual tokens after a downscale cap
 *   (https://platform.claude.com/docs/en/build-with-claude/vision, fetched 2026-10-18). The cap logic is reused from Ai3FileMath.
 * OpenAI tile rule for gpt-4o / gpt-4.1: base 85, tile 170, 512 px tiles, shortest side at most 768
 *   (https://developers.openai.com/api/docs/guides/images-vision, fetched 2026-10-18).
 */
import { TIERS, countImageTokens, imageCost } from './Ai3FileMath.ts';

/** Patch grid [columns, rows] for a patch size p. Edges round up, as in the Anthropic rule. */
export function patchGrid(w: number, h: number, p: number): [number, number] {
  return [Math.ceil(w / p), Math.ceil(h / p)];
}

/** Numbers in one flattened patch: p x p pixels, 3 colour channels. */
export const flatLength = (p: number, channels = 3) => p * p * channels;

/** Tokens of a tile-priced image: scale into 2048 square, shortest side to 768, count 512 px tiles. */
export function openaiTileTokens(w: number, h: number, base = 85, tile = 170): number {
  let cw = w;
  let ch = h;
  const fit = Math.min(1, 2048 / Math.max(cw, ch));
  cw = Math.floor(cw * fit);
  ch = Math.floor(ch * fit);
  const short = Math.min(cw, ch);
  if (short > 768) {
    const k = 768 / short;
    cw = Math.floor(cw * k);
    ch = Math.floor(ch * k);
  }
  return base + Math.ceil(cw / 512) * Math.ceil(ch / 512) * tile;
}

export const ASPECTS = [
  { id: 'square', label: '1:1', ratio: 1 },
  { id: 'wide', label: '16:9', ratio: 16 / 9 },
  { id: 'photo', label: '4:3', ratio: 4 / 3 },
] as const;

/** Image with the given long edge and aspect ratio (width / height, at least 1). */
export function sizeFor(longEdge: number, ratio: number): [number, number] {
  return [longEdge, Math.max(1, Math.round(longEdge / ratio))];
}

export interface Row {
  id: string;
  label: string;
  tokens: number;
  /** Tokens if nothing capped the size. Equal to tokens when no cap applied. */
  uncapped: number;
  resized: [number, number];
  /** USD per 1,000 images at the given price per million tokens. */
  perThousand: number;
}

const perThousand = (tokens: number, pricePerMTok: number) => (tokens * pricePerMTok) / 1000;

/** Three ways to count the same image. One price for every row so the token counts are the thing compared. */
export function compare(w: number, h: number, pricePerMTok: number): Row[] {
  const hi = imageCost(w, h, TIERS[1], pricePerMTok);
  const std = imageCost(w, h, TIERS[0], pricePerMTok);
  const oa = openaiTileTokens(w, h);
  return [
    { id: 'hi', label: 'Anthropic, high-resolution tier', tokens: hi.tokens, uncapped: hi.rawTokens, resized: hi.resized, perThousand: perThousand(hi.tokens, pricePerMTok) },
    { id: 'std', label: 'Anthropic, standard tier', tokens: std.tokens, uncapped: std.rawTokens, resized: std.resized, perThousand: perThousand(std.tokens, pricePerMTok) },
    { id: 'oa', label: 'OpenAI tile rule (gpt-4.1)', tokens: oa, uncapped: oa, resized: [w, h], perThousand: perThousand(oa, pricePerMTok) },
  ];
}

export { countImageTokens };
