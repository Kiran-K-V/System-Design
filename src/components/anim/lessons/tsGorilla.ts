/** Gorilla compression sizes (Pelkonen et al., VLDB 2015) and a cardinality calculator. No imports, so a node test can load it. */

/** Bits to store one timestamp delta-of-delta D. Control bits plus payload, per the paper. */
export function dodBits(d: number): number {
  if (d === 0) return 1;
  if (d >= -63 && d <= 64) return 2 + 7;
  if (d >= -255 && d <= 256) return 3 + 9;
  if (d >= -2047 && d <= 2048) return 4 + 12;
  return 4 + 32;
}

const toBits = (x: number): bigint => {
  const b = new DataView(new ArrayBuffer(8));
  b.setFloat64(0, x);
  return b.getBigUint64(0);
};

const clz64 = (v: bigint) => 64 - v.toString(2).length;
const ctz64 = (v: bigint) => {
  let n = 0;
  while (((v >> BigInt(n)) & 1n) === 0n) n++;
  return n;
};

export interface XorInfo {
  xorHex: string;
  leading: number;
  trailing: number;
  meaningful: number;
  bits: number;
}

/** Bits for value `cur` after `prev`. Leading zeros are capped at 31 (5-bit field). Reuse of the previous window is not modeled. */
export function xorBits(prev: number, cur: number): XorInfo {
  const x = toBits(prev) ^ toBits(cur);
  const hex = '0x' + x.toString(16).padStart(16, '0');
  if (x === 0n) return { xorHex: hex, leading: 64, trailing: 0, meaningful: 0, bits: 1 };
  const leading = Math.min(clz64(x), 31);
  const trailing = ctz64(x);
  const meaningful = 64 - clz64(x) - trailing;
  return { xorHex: hex, leading, trailing, meaningful, bits: 2 + 5 + 6 + meaningful };
}

export interface Sample {
  t: number;
  v: number;
}

/** The block of Figure 2: header at 02:00:00, samples at 02:01:02, 02:02:02, 02:03:02. Times are seconds after the header. */
export const FIG2: Sample[] = [
  { t: 62, v: 12 },
  { t: 122, v: 12 },
  { t: 182, v: 24 },
];

export interface BlockPart {
  label: string;
  bits: number;
  note: string;
  kind: 'header' | 'time' | 'value';
}

/** Encode samples after a 64-bit header. Sample 1: 14-bit first delta and a raw 64-bit value. Later samples use delta-of-delta and XOR. */
export function encodeBlock(samples: Sample[]): BlockPart[] {
  const parts: BlockPart[] = [{ label: 'header', bits: 64, note: 'block start time, once per block', kind: 'header' }];
  let prevDelta = 0;
  let prevT = 0;
  samples.forEach((s, i) => {
    const delta = s.t - prevT;
    if (i === 0) {
      parts.push({ label: 't1', bits: 14, note: `first delta: ${delta} s after the header`, kind: 'time' });
      parts.push({ label: 'v1', bits: 64, note: `${s.v.toFixed(1)} stored as a raw double`, kind: 'value' });
    } else {
      const d = delta - prevDelta;
      parts.push({ label: `t${i + 1}`, bits: dodBits(d), note: `delta ${delta} s, delta of delta ${d}`, kind: 'time' });
      const x = xorBits(samples[i - 1].v, s.v);
      parts.push({
        label: `v${i + 1}`,
        bits: x.bits,
        note: x.meaningful === 0 ? 'same value: XOR is 0, one bit' : `XOR has ${x.leading} leading zeros and ${x.meaningful} meaningful bit`,
        kind: 'value',
      });
    }
    prevDelta = delta;
    prevT = s.t;
  });
  return parts;
}

export const totalBits = (parts: BlockPart[]) => parts.reduce((n, p) => n + p.bits, 0);

/* ---------- cardinality ---------- */

export interface CardInput {
  hosts: number;
  endpoints: number;
  statusCodes: number;
  users: number;
  scrapeSeconds: number;
  bytesPerSample: number;
  retentionDays: number;
}

/** Each unique label combination is one series. We assume every series gets a sample on every scrape. */
export function cardinality(i: CardInput) {
  const series = i.hosts * i.endpoints * i.statusCodes * i.users;
  const samplesPerDay = (series * 86400) / i.scrapeSeconds;
  const bytesPerDay = samplesPerDay * i.bytesPerSample;
  return { series, samplesPerDay, bytesPerDay, totalBytes: bytesPerDay * i.retentionDays };
}
