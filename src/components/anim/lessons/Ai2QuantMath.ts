/** Quantization arithmetic for lesson A2.6. Pure functions. */

export interface Precision {
  id: string;
  label: string;
  bytes: number;
  /** Distinct values one stored number can take. */
  levels: number;
}

export const PRECISIONS: Precision[] = [
  { id: 'bf16', label: 'BF16 / FP16', bytes: 2, levels: 65536 },
  { id: 'fp8', label: 'FP8', bytes: 1, levels: 256 },
  { id: 'int8', label: 'INT8', bytes: 1, levels: 256 },
  { id: 'int4', label: 'INT4', bytes: 0.5, levels: 16 },
];

export interface ModelSize {
  id: string;
  label: string;
  /** Total parameters in billions. For a mixture of experts, memory follows the total. */
  paramsB: number;
}

export const MODELS: ModelSize[] = [
  { id: 'l8', label: 'Llama 3 8B', paramsB: 8 },
  { id: 'l70', label: 'Llama 3 70B', paramsB: 70 },
  { id: 'mix', label: 'Mixtral 8x7B (47B total)', paramsB: 47 },
  { id: 'l405', label: 'Llama 3.1 405B', paramsB: 405 },
];

export const GPUS = [
  { id: 'h100', label: 'H100 SXM, 80 GB', gb: 80 },
  { id: 'h200', label: 'H200, 141 GB', gb: 141 },
];

/** Weight bytes in GB (1 GB = 1e9 bytes): parameters in billions times bytes per parameter. Ignores scale factors and metadata. */
export const weightGB = (paramsB: number, bytes: number) => paramsB * bytes;

/** Fewest cards whose memory holds the weights. Weights only, no KV cache. */
export const cardsNeeded = (gb: number, cardGB: number) => Math.max(1, Math.ceil(gb / cardGB));

/** Memory left on `cards` cards after the weights. Negative means it does not fit. */
export const freeGB = (gb: number, cardGB: number, cards: number) => cards * cardGB - gb;

/** In a memory-bound decode step, time follows bytes read. Upper bound on the speedup; ignores dequantization cost. */
export const bytesRatio = (fromBytes: number, toBytes: number) => fromBytes / toBytes;

/** Symmetric round-to-nearest quantization of a list of weights to `bits` bits. Scale comes from the largest magnitude. */
export function quantize(ws: number[], bits: number): { q: number[]; scale: number } {
  const qmax = Math.pow(2, bits - 1) - 1;
  const qmin = -Math.pow(2, bits - 1);
  const maxAbs = Math.max(...ws.map((w) => Math.abs(w)));
  const scale = maxAbs / qmax;
  return { q: ws.map((w) => Math.min(qmax, Math.max(qmin, Math.round(w / scale))) * scale), scale };
}

export function errors(ws: number[], q: number[]) {
  const e = ws.map((w, i) => Math.abs(w - q[i]));
  return { max: Math.max(...e), mean: e.reduce((a, b) => a + b, 0) / e.length };
}
