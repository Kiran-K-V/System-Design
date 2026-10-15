import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** A 12-bit Bloom filter with 3 hashes. Positions are fixed by hand so you can check every arrow. */
const M = 12;
const POS: Record<string, number[]> = {
  apple: [1, 5, 9],
  plum: [3, 6, 10],
  pear: [2, 5, 11],
  grape: [1, 6, 10],
};

interface Step {
  caption: string;
  set: number[];
  item?: string;
  mode?: 'add' | 'query';
  verdict?: { text: string; tone: 'ok' | 'bad' | 'warn' };
}

const steps: Step[] = [
  { caption: 'An empty Bloom filter: 12 bits, all 0. It uses 3 hash functions. Each one turns an item into a bit position. The filter stores no items, only bits.', set: [] },
  { caption: 'Insert "apple". The three hashes give positions 1, 5, and 9. Set those bits to 1.', set: [1, 5, 9], item: 'apple', mode: 'add' },
  { caption: 'Insert "plum": positions 3, 6, and 10. Six of the 12 bits are now 1.', set: [1, 3, 5, 6, 9, 10], item: 'plum', mode: 'add' },
  { caption: 'Query "pear": positions 2, 5, and 11. Bit 2 is 0. If pear had been inserted, bit 2 would be 1. So pear is definitely not in the set. A single 0 bit is proof.', set: [1, 3, 5, 6, 9, 10], item: 'pear', mode: 'query', verdict: { text: 'definitely not present', tone: 'ok' } },
  { caption: 'Query "apple": positions 1, 5, and 9 are all 1. The answer is "possibly present". Here it is right.', set: [1, 3, 5, 6, 9, 10], item: 'apple', mode: 'query', verdict: { text: 'possibly present (true)', tone: 'ok' } },
  { caption: 'Query "grape", which was never inserted. Positions 1, 6, and 10 are all 1: bit 1 came from apple, bits 6 and 10 from plum. The filter says "possibly present". That is a false positive. It cannot be told apart from a real one.', set: [1, 3, 5, 6, 9, 10], item: 'grape', mode: 'query', verdict: { text: 'possibly present (false positive)', tone: 'bad' } },
  { caption: 'Why it happens: 6 of 12 bits are set. For a new item whose 3 positions are random, the chance that all three land on a set bit is (6/12)³ = 12.5%. More items, more set bits, more false positives. A false negative is impossible: bits are never cleared.', set: [1, 3, 5, 6, 9, 10] },
];

const X0 = 78;
const DX = 52;

export default function BigBloomWalk() {
  return (
    <AnimFrame title="A Bloom filter: insert, then ask" steps={steps} interval={3000}>
      {(i, s) => {
        const pos = s.item ? POS[s.item] : [];
        return (
          <SketchSvg width={720} height={300} label="A row of 12 bits. Arrows from an item point to the three bits its hashes pick.">
            <HandText x={20} y={22} size={TEXT_SIZES.note} anchor="start" color="var(--muted)" mono>
              m = 12 bits, k = 3 hashes
            </HandText>
            {s.item && (
              <>
                <SketchBox cx={360} cy={68} w={150} h={40} r={8} seed={seedOf(`item${s.item}`)} stroke="var(--accent)" fill="var(--surface)" fillStyle="solid" />
                <HandText x={360} y={68} size={TEXT_SIZES.label}>
                  {`${s.mode === 'add' ? 'insert' : 'query'} "${s.item}"`}
                </HandText>
                {pos.map((p) => (
                  <SketchArrow
                    key={p}
                    points={[[360 + (p - 5.5) * 6, 92], [X0 + p * DX, 142]]}
                    stroke={s.mode === 'add' ? 'var(--accent)' : s.set.includes(p) ? 'var(--ok)' : 'var(--bad)'}
                    seed={seedOf(`arr${s.item}${p}`)}
                  />
                ))}
              </>
            )}
            {Array.from({ length: M }, (_, p) => {
              const on = s.set.includes(p);
              const probed = pos.includes(p);
              const miss = s.mode === 'query' && probed && !on;
              return (
                <g key={p}>
                  <SketchBox
                    cx={X0 + p * DX}
                    cy={170}
                    w={44}
                    h={44}
                    r={6}
                    seed={seedOf(`cell${p}`)}
                    stroke={miss ? 'var(--bad)' : probed ? 'var(--accent)' : on ? 'var(--ok)' : 'var(--muted)'}
                    fill={on ? 'var(--ok)' : undefined}
                    fillStyle="solid"
                  />
                  <HandText x={X0 + p * DX} y={170} size={TEXT_SIZES.label} mono>
                    {on ? '1' : '0'}
                  </HandText>
                  <HandText x={X0 + p * DX} y={208} size={TEXT_SIZES.note} color="var(--muted)" mono>
                    {String(p)}
                  </HandText>
                </g>
              );
            })}
            {s.verdict && (
              <HandText x={360} y={256} size={TEXT_SIZES.title} color={s.verdict.tone === 'bad' ? 'var(--bad)' : 'var(--ok)'}>
                {s.verdict.text}
              </HandText>
            )}
            {i === 6 && (
              <HandText x={360} y={256} size={TEXT_SIZES.heading} color="var(--warn)">
                {'6 of 12 bits set: (6/12)^3 = 12.5% chance of a false positive'}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
