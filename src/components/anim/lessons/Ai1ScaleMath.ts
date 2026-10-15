/** Scaling-law arithmetic for lesson A1.7. Pure functions. */

/** Training compute for N parameters on D tokens. Kaplan et al. 2020, Sec 2.1: C ~ 6N per token (2N forward, ~4N backward). */
export const trainFlops = (n: number, d: number) => 6 * n * d;
/** Serving compute: about 2N FLOPs per generated token (one multiply and one add per weight). */
export const serveFlops = (n: number, tokens: number) => 2 * n * tokens;
export const lifetimeFlops = (n: number, d: number, servedTokens: number) => trainFlops(n, d) + serveFlops(n, servedTokens);

/** Chinchilla rule of thumb derived from Table 3 of Hoffmann et al. 2022: about 20 training tokens per parameter. */
export const CHINCHILLA_RATIO = 20;

/** Compute-optimal split under C = 6ND and D = ratio * N. So N = sqrt(C / (6 * ratio)). */
export function chinchillaSplit(c: number, ratio = CHINCHILLA_RATIO) {
  const n = Math.sqrt(c / (6 * ratio));
  return { n, d: ratio * n };
}

/** Kaplan et al. 2020 Table 5: N_opt = 1.3e9 * C_min^0.73, with C_min in PF-days (1 PF-day = 8.64e19 FLOPs). D follows from C = 6ND. */
const PF_DAY = 8.64e19;
export function kaplanSplit(c: number) {
  const n = 1.3e9 * Math.pow(c / PF_DAY, 0.73);
  return { n, d: c / (6 * n) };
}

/** Chinchilla parametric fit, Hoffmann et al. 2022 Eq. 10: L = E + A / N^0.34 + B / D^0.28. */
export const fitLoss = (n: number, d: number) => 1.69 + 406.4 / Math.pow(n, 0.34) + 410.7 / Math.pow(d, 0.28);

/** Served tokens at which model B (smaller, trained longer) has a lower lifetime cost than model A. Infinity if never. */
export function breakEven(a: { n: number; d: number }, b: { n: number; d: number }) {
  const extraTrain = trainFlops(b.n, b.d) - trainFlops(a.n, a.d);
  const savePerToken = 2 * (a.n - b.n);
  if (savePerToken <= 0) return Infinity;
  return Math.max(0, extraTrain / savePerToken);
}

export function fmtSci(v: number): string {
  if (!isFinite(v)) return '-';
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = v / Math.pow(10, e);
  return `${m.toFixed(2)}e${e}`;
}

export function fmtCount(v: number): string {
  if (v >= 1e12) return `${+(v / 1e12).toPrecision(3)}T`;
  if (v >= 1e9) return `${+(v / 1e9).toPrecision(3)}B`;
  if (v >= 1e6) return `${+(v / 1e6).toPrecision(3)}M`;
  return `${Math.round(v)}`;
}
