import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { FIG2, encodeBlock, totalBits } from './tsGorilla';

/** Compress the block of Figure 2 in the Gorilla paper, one field at a time. Sizes come from tsGorilla.ts. */
const PARTS = encodeBlock(FIG2);
const TOTAL = totalBits(PARTS);
const RAW = FIG2.length * 128;
const SAMPLES = ['02:01:02  value 12.0', '02:02:02  value 12.0', '02:03:02  value 24.0'];

const ROWS_AT_STEP = [0, 1, 3, 4, 5, 6, 7, 7];
const KIND_COLOR = { header: 'var(--muted)', time: 'var(--accent)', value: 'var(--ok)' } as const;

const steps = [
  { caption: `Three samples as plain data: a 64-bit timestamp and a 64-bit double each, so ${RAW} bits (${RAW / 8} bytes). Gorilla stores them in a block that begins at 02:00:00. We compress field by field.` },
  { caption: 'The block header holds the start time once: 64 bits. Every timestamp in the block is stored relative to it.' },
  { caption: 'Sample 1 time: 02:01:02 is 62 s after the header. The paper stores this first delta in 14 bits. Sample 1 value: stored raw, 64 bits.' },
  { caption: 'Sample 2 time: the delta is 60 s. Last delta was 62 s. The delta of delta is 60 − 62 = −2. A value in [−63, 64] costs the control bits "10" plus 7 bits: 9 bits.' },
  { caption: 'Sample 2 value is 12.0 again. XOR with the previous value is all zeros. One "0" bit says "same as before": 1 bit.' },
  { caption: 'Sample 3 time: the delta is 60 s again. The delta of delta is 0, so one "0" bit. A steady 60 s scrape costs 1 bit per timestamp.' },
  { caption: 'Sample 3 value 24.0 XOR 12.0 = 0x0010000000000000. It has 11 leading zeros and one meaningful bit. Store control "11", 5 bits for 11, 6 bits for length 1, then the bit itself: 2 + 5 + 6 + 1 = 14 bits.' },
  { caption: `Total: 64 + 14 + 64 + 9 + 1 + 1 + 14 = ${TOTAL} bits, under 21 bytes, from ${RAW} bits. The header and the first value are the big costs. In a long block they are spread over thousands of points. The paper reports 1.37 bytes per point on average, against 16.` },
];

const BX = 190;
const PX = 3.1;

export default function TsGorilla() {
  return (
    <AnimFrame title="Points compress into a Gorilla block" steps={steps} interval={3200}>
      {(i) => {
        const rows = PARTS.slice(0, ROWS_AT_STEP[i]);
        const sum = rows.reduce((n, p) => n + p.bits, 0);
        return (
          <SketchSvg width={720} height={415} label="Each field of three samples and the number of bits it takes in a compressed block">
            <HandText x={20} y={20} size={TEXT_SIZES.heading} anchor="start">
              Raw samples: 128 bits each
            </HandText>
            {SAMPLES.map((s, k) => (
              <HandText key={k} x={20 + k * 236} y={52} size={TEXT_SIZES.label} anchor="start" mono color="var(--muted)">
                {s}
              </HandText>
            ))}
            <HandText x={20} y={96} size={TEXT_SIZES.heading} anchor="start">
              Compressed block
            </HandText>
            {rows.map((p, k) => {
              const y = 134 + k * 36;
              const active = k === rows.length - 1 && i < 7;
              const w = Math.max(5, p.bits * PX);
              return (
                <g key={p.label}>
                  <HandText x={20} y={y} size={TEXT_SIZES.label} anchor="start" mono>
                    {p.label}
                  </HandText>
                  <SketchBox
                    cx={BX - 70 + w / 2 + 20}
                    cy={y}
                    w={w}
                    h={24}
                    r={6}
                    seed={seedOf(`seg${p.label}`)}
                    stroke={active ? 'var(--accent)' : KIND_COLOR[p.kind]}
                    fill={KIND_COLOR[p.kind]}
                    fillStyle="solid"
                  />
                  <HandText x={BX - 70 + w + 32} y={y} size={TEXT_SIZES.label} anchor="start" color={active ? 'var(--accent)' : 'var(--fg)'}>
                    {`${p.bits} ${p.bits === 1 ? 'bit' : 'bits'}: ${p.note}`}
                  </HandText>
                </g>
              );
            })}
            {i >= 1 && (
              <HandText x={20} y={134 + 7 * 36 + 4} size={TEXT_SIZES.heading} anchor="start" color={i === 7 ? 'var(--ok)' : 'var(--muted)'} mono>
                {i === 7 ? `total ${sum} bits (${(sum / 8).toFixed(1)} bytes) vs raw ${RAW} bits` : `so far ${sum} bits`}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
