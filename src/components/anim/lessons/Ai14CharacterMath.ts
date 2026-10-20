/**
 * Arithmetic for lesson A14.1, Character.AI inference. Pure functions.
 *
 * COMPANY CLAIMS (Character.AI, 2024-06-20, https://blog.character.ai/optimizing-ai-inference-at-character-ai/
 * and https://blog.character.ai/optimizing-ai-inference-at-character-ai-2/):
 *   - "more than 20,000 inference queries per second" (blog summary: "around 20,000")
 *   - "less than one cent per hour of conversation"
 *   - serving cost down "by a factor of 33" since late 2022
 *   - commercial APIs "at least 13.5X more"
 *   - 100M daily users x 1 hour x $0.01 = $365 million a year, against "at least $4.75 billion" on APIs
 * OUR ASSUMPTIONS (labelled in the lesson): GPU price, turns per conversation hour, and the KV bytes per token.
 */

/** Lambda 8x H100 SXM 80 GB on-demand instance, USD per GPU-hour, https://lambda.ai/pricing, fetched 2026-10-20. */
export const H100_USD_PER_GPU_HOUR = 3.99;
export const QPS_CLAIM = 20_000;
export const CENTS_PER_HOUR_CLAIM = 1; // "less than one cent": an upper bound
export const COST_CUT_CLAIM = 33; // "at least"
export const API_MULTIPLE_CLAIM = 13.5; // "at least"
export const DAU_SCENARIO = { users: 100_000_000, hoursPerDay: 1, usdPerHour: 0.01, days: 365, apiUsd: 4.75e9 };
export const HOURS_PER_MONTH = 730;

/** Dollars to serve one million conversation hours at a price per hour in cents. */
export const usdPerMillionHours = (centsPerHour: number) => (centsPerHour / 100) * 1_000_000;

/** GPU-hours that money buys at a GPU price. */
export const gpuHoursFor = (usd: number, gpuUsdPerHour = H100_USD_PER_GPU_HOUR) => usd / gpuUsdPerHour;

/** GPU-seconds of one GPU you can afford inside one conversation hour. */
export const gpuSecondsPerConversationHour = (centsPerHour: number, gpuUsdPerHour = H100_USD_PER_GPU_HOUR) =>
  (gpuHoursFor(usdPerMillionHours(centsPerHour), gpuUsdPerHour) / 1_000_000) * 3600;

/**
 * If the fleet answers `qps` queries per second and one conversation hour holds `turnsPerHour` queries,
 * how many conversation hours does the fleet serve each hour, what may it cost, and how many GPUs is that?
 */
export function fleetFromQps(qps: number, turnsPerHour: number, centsPerHour = CENTS_PER_HOUR_CLAIM, gpuUsdPerHour = H100_USD_PER_GPU_HOUR) {
  const queriesPerHour = qps * 3600;
  const conversationHoursPerHour = queriesPerHour / turnsPerHour;
  const usdPerHour = conversationHoursPerHour * (centsPerHour / 100);
  const gpus = usdPerHour / gpuUsdPerHour;
  return { conversationHoursPerHour, usdPerHour, gpus, usdPerMonth: usdPerHour * HOURS_PER_MONTH };
}

/** The post's own scenario: yearly serving bill, per daily user, and the API multiple it implies. */
export function dauScenario(s = DAU_SCENARIO) {
  const yearly = s.users * s.hoursPerDay * s.usdPerHour * s.days;
  return { yearly, perUser: yearly / s.users, apiMultiple: s.apiUsd / yearly };
}

/** KV bytes per token for full multi-head-style attention with `kvHeads` heads: 2 (K and V) x layers x heads x width x bytes. */
export const kvBytesPerToken = (layers: number, kvHeads: number, headWidth: number, bytes: number) => 2 * layers * kvHeads * headWidth * bytes;

/** Relative KV size of a hybrid model: 1 global layer in `every` keeps all tokens, the rest keep at most `window`. */
export const hybridKvShare = (tokens: number, window = 1024, every = 6) => 1 / every + ((every - 1) / every) * (Math.min(tokens, window) / tokens);
