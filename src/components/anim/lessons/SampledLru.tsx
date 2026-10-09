import { motion } from 'motion/react';
import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';

/** Redis-style approximated LRU: sample a few random keys, evict the one idle longest. */

const KEYS: { key: string; idle: number }[] = [
  { key: 'k1', idle: 3 },
  { key: 'k2', idle: 41 },
  { key: 'k3', idle: 7 },
  { key: 'k4', idle: 95 },
  { key: 'k5', idle: 18 },
  { key: 'k6', idle: 60 },
  { key: 'k7', idle: 2 },
  { key: 'k8', idle: 33 },
  { key: 'k9', idle: 12 },
  { key: 'k10', idle: 77 },
  { key: 'k11', idle: 5 },
  { key: 'k12', idle: 26 },
];

interface SStep {
  caption: string;
  sampled: string[];
  /** Keys already removed. */
  gone: string[];
  /** Show the idle time of every key (true) or only of the sampled ones (false). */
  showAll: boolean;
  /** The key picked as victim of the sample. */
  victim?: string;
  note: string;
}

const R1 = ['k2', 'k6', 'k8', 'k9', 'k11'];
const R2 = ['k1', 'k3', 'k4', 'k10', 'k12'];

const steps: SStep[] = [
  {
    caption:
      'Memory is full and a write needs room, so Redis must evict one key. Each key stores when it was last used. Exact LRU would keep every key in a sorted list: that costs extra memory per key. Redis does not. The number under each key is its idle time: seconds since the last access.',
    sampled: [],
    gone: [],
    showAll: true,
    note: 'exact LRU would pick k4 (idle 95 s)',
  },
  {
    caption:
      'Instead, Redis picks a small random sample of keys. The default is 5 (maxmemory-samples 5). Redis looks only at these 5 keys. The other 7 are not read at all.',
    sampled: R1,
    gone: [],
    showAll: false,
    note: 'sample of 5 random keys',
  },
  {
    caption: 'Among the sampled keys, k6 has the longest idle time: 60 seconds. It is the victim.',
    sampled: R1,
    gone: [],
    showAll: false,
    victim: 'k6',
    note: 'oldest in the sample: k6',
  },
  {
    caption:
      'k6 is evicted. Exact LRU would have chosen k4 (95 s), but k4 was not in the sample. k6 is still the third oldest key of 12. For a skewed workload this is close enough, which is why Redis docs say the approximation is virtually equivalent.',
    sampled: [],
    gone: ['k6'],
    showAll: true,
    note: 'k6 evicted; k4 was missed',
  },
  {
    caption:
      'The next write needs room, so Redis samples again. This time k4 is in the sample, and it wins with 95 s. Since Redis 3.0 the algorithm also keeps a pool of the best candidates between samples, so a good candidate is not forgotten. That is how it gets close to true LRU.',
    sampled: R2,
    gone: ['k6'],
    showAll: false,
    victim: 'k4',
    note: 'new sample: k4 wins',
  },
  {
    caption:
      'k4 is gone. The cost of the idea: no list, no per-access pointer update, only a timestamp per key. The knob: raise the sample size to 10 and the choice gets closer to true LRU, at some extra CPU per eviction.',
    sampled: [],
    gone: ['k6', 'k4'],
    showAll: true,
    note: 'sample size trades CPU for accuracy',
  },
];

const W = 720;
const COLS = 6;
const CW = 104;
const CH = 74;
const GAP = 14;
const X0 = (W - (COLS * CW + (COLS - 1) * GAP)) / 2 + CW / 2;
const cellX = (i: number) => X0 + (i % COLS) * (CW + GAP);
const cellY = (i: number) => 96 + Math.floor(i / COLS) * (CH + 18);

export default function SampledLru() {
  return (
    <AnimFrame title="Redis approximated LRU: sample, then evict the oldest" steps={steps} interval={3800}>
      {(_, s) => (
        <SketchSvg width={W} height={320} label="Twelve cached keys with idle times. Redis samples five at random and evicts the one idle longest.">
          <HandText x={18} y={20} size={15} anchor="start" color="var(--muted)">
            12 keys in the cache. Number = seconds since last access (idle).
          </HandText>
          {KEYS.map((k, i) => {
            const cx = cellX(i);
            const cy = cellY(i);
            const gone = s.gone.includes(k.key);
            const inSample = s.sampled.includes(k.key);
            const victim = s.victim === k.key;
            const dim = s.sampled.length > 0 && !inSample;
            const tone = victim ? 'var(--bad)' : inSample ? 'var(--accent)' : 'var(--fg)';
            if (gone) {
              return (
                <g key={k.key} opacity={0.9}>
                  <SketchBox cx={cx} cy={cy} w={CW} h={CH} r={10} dashed stroke="var(--muted)" seed={seedOf('gone' + k.key)} />
                  <HandText x={cx} y={cy} size={14} color="var(--muted)">
                    {'evicted'}
                  </HandText>
                </g>
              );
            }
            return (
              <motion.g key={k.key} animate={{ opacity: dim ? 0.4 : 1 }} transition={{ duration: 0.4 }}>
                {(inSample || victim) && <rect x={cx - CW / 2 + 3} y={cy - CH / 2 + 3} width={CW - 6} height={CH - 6} rx={9} fill={victim ? 'var(--bad)' : 'var(--accent)'} opacity={0.16} />}
                <SketchBox cx={cx} cy={cy} w={CW} h={CH} r={10} seed={seedOf('c' + k.key)} stroke={tone} strokeWidth={inSample || victim ? 2.4 : 1.4} />
                <HandText x={cx} y={cy - 14} size={18} weight={700} mono>
                  {k.key}
                </HandText>
                <HandText x={cx} y={cy + 15} size={15} color={s.showAll || inSample ? 'var(--fg)' : 'var(--muted)'}>
                  {s.showAll || inSample ? `idle ${k.idle} s` : 'not read'}
                </HandText>
              </motion.g>
            );
          })}
          <HandText x={W / 2} y={292} size={18} weight={700} color={s.victim ? 'var(--bad)' : 'var(--accent)'}>
            {s.note}
          </HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
