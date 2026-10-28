/**
 * Checkpoint interval model for lesson E2.5 (first order, Young/Daly form).
 * Assumptions: failures are independent with constant rate 1/M (M = mean time between failures);
 * one checkpoint stalls training for C; a failure loses on average half an interval, then costs R to restart.
 * Valid when the interval is much smaller than M. All times in minutes.
 */

/** Fraction of wall-clock time not spent on useful training. */
export function waste(T: number, C: number, M: number, R: number): number {
  return C / T + (T / 2 + R) / M;
}

/** Young/Daly first-order optimum interval: sqrt(2 * C * M). */
export function optimalInterval(C: number, M: number): number {
  return Math.sqrt(2 * C * M);
}

/** Expected lost work per failure, not counting restart: half an interval. */
export function lostPerFailure(T: number): number {
  return T / 2;
}

export function curve(C: number, M: number, R: number, tMin: number, tMax: number, n: number): { t: number; w: number }[] {
  const out: { t: number; w: number }[] = [];
  const a = Math.log(tMin);
  const b = Math.log(tMax);
  for (let i = 0; i < n; i++) {
    const t = Math.exp(a + ((b - a) * i) / (n - 1));
    out.push({ t, w: waste(t, C, M, R) });
  }
  return out;
}

/** Round a 32-bit float to BF16 (keep top 16 bits, round to nearest even). */
export function toBf16(x: number): number {
  const f = new Float32Array(1);
  const u = new Uint32Array(f.buffer);
  f[0] = x;
  const bits = u[0];
  const rounded = (bits + 0x7fff + ((bits >> 16) & 1)) & 0xffff0000;
  u[0] = rounded >>> 0;
  return f[0];
}

/** Round to FP32 precision. */
export function toF32(x: number): number {
  return Math.fround(x);
}

/** Apply `steps` small updates to a weight, either storing in BF16 only or keeping an FP32 master. */
export function accumulate(w0: number, update: number, steps: number): { bf16Only: number; master: number; masterBf16: number } {
  let a = toBf16(w0);
  let m = toF32(w0);
  for (let i = 0; i < steps; i++) {
    a = toBf16(a + update);
    m = toF32(m + update);
  }
  return { bf16Only: a, master: m, masterBf16: toBf16(m) };
}
