/** Memory arithmetic for lesson A11.2 (SFT and LoRA). Pure functions. GB means 10^9 bytes. */

export type Method = 'full' | 'lora' | 'qlora';

/** Mixed-precision Adam, bytes per parameter (ZeRO paper, arXiv 1910.02054): 2 weights + 2 gradients + 12 optimizer states. */
export const BYTES = { weights: 2, grads: 2, master: 4, adamM: 4, adamV: 4 } as const;
export const BYTES_PER_TRAINED_PARAM = BYTES.weights + BYTES.grads + BYTES.master + BYTES.adamM + BYTES.adamV; // 16

/** NF4 stores 4 bits per weight. Double quantization adds 0.127 bits per weight for the constants (QLoRA paper). */
export const NF4_BITS = 4 + 0.127;
export const NF4_BYTES = NF4_BITS / 8;

export const GB = 1e9;
export const GPU_GB = 80;

/** Llama 3 shapes from the Llama 3 paper (Table 3), as used in lessons A1.3 and A2.1. kvDim = kvHeads x headDim = 8 x 128. */
export interface Config {
  layers: number;
  dModel: number;
  ffn: number;
  kvDim: number;
}
export const MODELS: { id: string; label: string; paramsB: number; cfg: Config }[] = [
  { id: '8b', label: 'Llama 3 8B', paramsB: 8, cfg: { layers: 32, dModel: 4096, ffn: 14336, kvDim: 1024 } },
  { id: '70b', label: 'Llama 3 70B', paramsB: 70, cfg: { layers: 80, dModel: 8192, ffn: 28672, kvDim: 1024 } },
  { id: '405b', label: 'Llama 3 405B', paramsB: 405, cfg: { layers: 126, dModel: 16384, ffn: 53248, kvDim: 1024 } },
];

/** Trainable LoRA parameters when every linear layer gets an adapter of rank r. Each adapter on a d_in x d_out matrix has r x (d_in + d_out) values. */
export function loraParams(c: Config, rank: number): number {
  const d = c.dModel;
  const mats: [number, number][] = [
    [d, d], // q
    [d, c.kvDim], // k
    [d, c.kvDim], // v
    [d, d], // o
    [d, c.ffn], // gate
    [d, c.ffn], // up
    [c.ffn, d], // down
  ];
  return c.layers * mats.reduce((s, [a, b]) => s + rank * (a + b), 0);
}

export interface Budget {
  /** Segments in GB, in drawing order. */
  segs: { id: string; label: string; gb: number }[];
  totalGB: number;
  trainable: number;
  gpus80: number;
  fits48: boolean;
}

export function budget(paramsNominal: number, c: Config, method: Method, rank: number, activationGB: number): Budget {
  const n = paramsNominal;
  const segs: Budget['segs'] = [];
  let trainable = n;
  if (method === 'full') {
    segs.push({ id: 'w', label: 'weights (BF16)', gb: (n * BYTES.weights) / GB });
    segs.push({ id: 'g', label: 'gradients', gb: (n * BYTES.grads) / GB });
    segs.push({ id: 'm', label: 'FP32 master copy', gb: (n * BYTES.master) / GB });
    segs.push({ id: 'a', label: 'Adam moments', gb: (n * (BYTES.adamM + BYTES.adamV)) / GB });
  } else {
    trainable = loraParams(c, rank);
    const base = method === 'lora' ? BYTES.weights : NF4_BYTES;
    segs.push({ id: 'w', label: method === 'lora' ? 'frozen base (BF16)' : 'frozen base (NF4)', gb: (n * base) / GB });
    segs.push({ id: 't', label: 'adapter states', gb: (trainable * BYTES_PER_TRAINED_PARAM) / GB });
  }
  segs.push({ id: 'act', label: 'activations (assumed)', gb: activationGB });
  const totalGB = segs.reduce((s, x) => s + x.gb, 0);
  return { segs, totalGB, trainable, gpus80: Math.ceil(totalGB / GPU_GB), fits48: totalGB <= 48 };
}
