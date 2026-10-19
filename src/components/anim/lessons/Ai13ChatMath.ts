/**
 * Arithmetic for lesson A13.2 (ChatGPT-style assistant). Pure functions, no randomness.
 *
 * Model: Llama 3.1 70B in BF16 on one replica of 8 H100 cards (tensor parallel 8).
 * Facts: 80 layers, 8 KV heads, head width 128 (Llama 3.1 70B config.json, public mirror), hidden size 8,192,
 * 70e9 parameters, 140 GB of weights, H100 SXM 80 GB with 989 TFLOPS BF16 dense and 3.35 TB/s (lesson A2.1, A2.2).
 * vLLM default gpu_memory_utilization is 0.92 (vLLM engine args page, read 2026-10-19).
 * ASSUMPTION (illustrative): real kernels reach 40% of the peak compute and 40% of the peak bandwidth.
 */

export const LAYERS = 80;
export const KV_HEADS = 8;
export const HEAD_DIM = 128;
export const HIDDEN = 8192;
export const PARAMS = 70e9;
export const WEIGHTS_GB = 140;
export const CARD_GB = 80;
export const MEM_UTIL = 0.92;
export const CARDS_PER_REPLICA = 8;
export const PEAK_FLOPS_CARD = 989e12;
export const PEAK_BW_CARD = 3.35e12;
export const EFFICIENCY = 0.4;
export const GPU_USD_PER_HOUR = 3.99;
export const HOURS_PER_MONTH = 730;

/** Bytes of K and V stored for one token: 2 x layers x KV heads x head width x 2 bytes (BF16). */
export const kvBytesPerToken = () => 2 * LAYERS * KV_HEADS * HEAD_DIM * 2;

/** KV size of one chat, in decimal GB. */
export const chatKvGB = (tokens: number) => (kvBytesPerToken() * tokens) / 1e9;

export interface Capacity {
  usableGB: number;
  kvRoomGB: number;
  chatsPerReplica: number;
  replicas: number;
  gpus: number;
  usdPerHour: number;
}

/** How many replicas hold `chats` chats of `tokens` tokens each, with every chat resident. No prefix sharing. */
export function capacity(chats: number, tokens: number, cards = CARDS_PER_REPLICA): Capacity {
  const usableGB = cards * CARD_GB * MEM_UTIL;
  const kvRoomGB = usableGB - WEIGHTS_GB;
  const chatsPerReplica = kvRoomGB > 0 ? Math.floor(kvRoomGB / chatKvGB(tokens)) : 0;
  const replicas = chatsPerReplica > 0 ? Math.ceil(chats / chatsPerReplica) : Infinity;
  const gpus = replicas * cards;
  return { usableGB, kvRoomGB, chatsPerReplica, replicas, gpus, usdPerHour: gpus * GPU_USD_PER_HOUR };
}

/** FLOPs to prefill `n` new tokens when the chat already has `ctx` tokens in total (ctx includes the n new ones). */
export const prefillFlops = (n: number, ctx: number) => 2 * PARAMS * n + 4 * n * ctx * HIDDEN * LAYERS;

/** Seconds to read all weights once on one replica: the memory floor of any pass. */
export const weightReadSeconds = (cards = CARDS_PER_REPLICA) => (WEIGHTS_GB * 1e9) / (cards * PEAK_BW_CARD);

/** Prefill seconds at peak (no efficiency loss): the larger of the compute time and the weight-read time. */
export function prefillFloorSeconds(n: number, ctx: number, cards = CARDS_PER_REPLICA) {
  return Math.max(prefillFlops(n, ctx) / (cards * PEAK_FLOPS_CARD), weightReadSeconds(cards));
}

/** Prefill seconds at the assumed efficiency. */
export const prefillSeconds = (n: number, ctx: number, cards = CARDS_PER_REPLICA) => prefillFloorSeconds(n, ctx, cards) / EFFICIENCY;

/** Decode step seconds at the floor when `streams` chats of `tokens` tokens each are in the batch. */
export function decodeStepFloor(streams: number, tokens: number, cards = CARDS_PER_REPLICA) {
  return (WEIGHTS_GB * 1e9 + streams * kvBytesPerToken() * tokens) / (cards * PEAK_BW_CARD);
}

export const decodeStepSeconds = (streams: number, tokens: number, cards = CARDS_PER_REPLICA) => decodeStepFloor(streams, tokens, cards) / EFFICIENCY;

/** Sonnet 5.5 prices in USD per million tokens (pricing page, as of 2026-10-19). */
export const PRICE = { input: 2, write5m: 2.5, read: 0.1, output: 10 };

export interface ChatCost {
  noCache: number;
  cached: number;
  inputNoCache: number;
  inputCached: number;
  output: number;
}

/**
 * Dollars for one chat of `turns` turns. Each turn adds `userTok` user tokens and `answerTok` answer tokens.
 * Turn n sends the whole history. With caching, the part seen last turn is read and the rest is written (5-minute write).
 * ILLUSTRATIVE: ignores the 512-token minimum and assumes every turn arrives inside the 5-minute lifetime.
 */
export function chatCost(turns: number, userTok: number, answerTok: number): ChatCost {
  let inNo = 0;
  let reads = 0;
  let writes = 0;
  for (let n = 1; n <= turns; n++) {
    const input = (n - 1) * (userTok + answerTok) + userTok;
    inNo += input;
    const prevInput = n === 1 ? 0 : (n - 2) * (userTok + answerTok) + userTok;
    reads += prevInput;
    writes += input - prevInput;
  }
  const out = turns * answerTok;
  const inputNoCache = (inNo * PRICE.input) / 1e6;
  const inputCached = (reads * PRICE.read + writes * PRICE.write5m) / 1e6;
  const output = (out * PRICE.output) / 1e6;
  return { noCache: inputNoCache + output, cached: inputCached + output, inputNoCache, inputCached, output };
}

/** Tokens per second for one replica that decodes `streams` chats of `tokens` tokens at the assumed efficiency. */
export const replicaTokensPerSecond = (streams: number, tokens: number) => streams / decodeStepSeconds(streams, tokens);

/** Step time (ms) and tokens per second at batch size b, plus whether the TPOT target holds. Every stream shares one step. */
export function batchPoint(b: number, tokens: number, tpotTargetMs: number) {
  const stepMs = decodeStepSeconds(b, tokens) * 1000;
  const throughput = b / (stepMs / 1000);
  const ok = stepMs <= tpotTargetMs;
  return { b, stepMs, throughput, ok, goodput: ok ? throughput : 0 };
}
