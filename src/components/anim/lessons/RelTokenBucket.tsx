import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { TONE, type Tone } from '../FlowDiagram';

/**
 * Token bucket walk-through. Capacity 5, refill 1 token per second, bucket starts full.
 * 8 requests arrive at t = 0. At t = 3 s three more arrive.
 * The numbers match tokenBucket(5, 1, [0 x8, 3 x3]) in relRateLimit.ts, which has a test.
 */

type Chip = 'none' | 'wait' | 'ok' | 'bad';

interface Step {
  caption: string;
  tokens: number;
  time: number;
  burst: Chip; // first five of row 1
  burstRest: Chip; // requests 6 to 8
  later: Chip; // row 2
  active: 'bucket' | 'burst' | 'later' | 'none';
}

const steps: Step[] = [
  {
    caption:
      'A token bucket holds up to 5 tokens (its capacity) and gets 1 new token every second (its refill rate). It starts full. Every request must take one token. No token, no service.',
    tokens: 5, time: 0, burst: 'none', burstRest: 'none', later: 'none', active: 'bucket',
  },
  {
    caption: 'At t = 0 s, 8 requests arrive at the same moment. The bucket has 5 tokens.',
    tokens: 5, time: 0, burst: 'wait', burstRest: 'wait', later: 'none', active: 'burst',
  },
  {
    caption: 'Requests 1 to 5 each take a token and pass. A burst of 5 is allowed. That is the point of the bucket: it lets a client save up unused rate and spend it at once. The bucket is now empty.',
    tokens: 0, time: 0, burst: 'ok', burstRest: 'wait', later: 'none', active: 'burst',
  },
  {
    caption: 'Requests 6 to 8 find no token. They are rejected with HTTP 429 (Too Many Requests). They are not queued here. A client that gets a 429 should wait and try again later (lesson 7.2).',
    tokens: 0, time: 0, burst: 'ok', burstRest: 'bad', later: 'none', active: 'burst',
  },
  {
    caption: 'The client waits 3 seconds. The bucket refills at 1 token per second, so it holds 3 tokens.',
    tokens: 3, time: 3, burst: 'ok', burstRest: 'bad', later: 'none', active: 'bucket',
  },
  {
    caption: 'Three new requests arrive at t = 3 s. Each takes a token and passes. The bucket is empty again. Over the 3 seconds, the long-run rate stayed at the refill rate of 1 per second, even though the burst was 5.',
    tokens: 0, time: 3, burst: 'ok', burstRest: 'bad', later: 'ok', active: 'later',
  },
  {
    caption: 'After a long quiet spell the bucket fills back up to 5 and stops there. Extra tokens do not pile up. So the capacity caps the burst, and the refill rate caps the average. These are the two settings you tune.',
    tokens: 5, time: 12, burst: 'ok', burstRest: 'bad', later: 'ok', active: 'bucket',
  },
];

const CHIP_TONE: Record<Chip, Tone> = { none: 'muted', wait: 'warn', ok: 'ok', bad: 'bad' };

function Chips({ y, from, count, state, label }: { y: number; from: number; count: number; state: Chip[]; label: string }) {
  const x0 = 350;
  return (
    <g>
      <HandText x={x0 - 20} y={y - 40} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
        {label}
      </HandText>
      {Array.from({ length: count }, (_, k) => {
        const x = x0 + k * 44;
        const st = state[k];
        return (
          <g key={k}>
            <SketchBox cx={x} cy={y} w={36} h={36} r={6} seed={seedOf(`${label}${k}`)} stroke={TONE[CHIP_TONE[st]]} fill={st === 'none' ? undefined : TONE[CHIP_TONE[st]]} fillStyle="solid" dashed={st === 'none'} />
            <HandText x={x} y={y} size={TEXT_SIZES.note} mono>{String(from + k)}</HandText>
            <HandText x={x} y={y + 30} size={TEXT_SIZES.note} mono color={st === 'bad' ? 'var(--bad)' : st === 'ok' ? 'var(--ok)' : 'var(--muted)'}>
              {st === 'ok' ? '200' : st === 'bad' ? '429' : st === 'wait' ? '?' : ''}
            </HandText>
          </g>
        );
      })}
    </g>
  );
}

export default function RelTokenBucket() {
  return (
    <AnimFrame title="Token bucket: capacity 5, refill 1 per second" steps={steps} interval={3800}>
      {(_, st) => {
        const burstState: Chip[] = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (k < 5 ? st.burst : st.burstRest));
        const laterState: Chip[] = [st.later, st.later, st.later];
        return (
          <SketchSvg width={720} height={270} label="A bucket with tokens and the requests that pass or are rejected">
            <HandText x={24} y={22} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">{`t = ${st.time} s`}</HandText>

            <SketchBox cx={150} cy={50} w={190} h={36} r={8} seed={seedOf('refill')} stroke="var(--muted)" dashed />
            <HandText x={150} y={50} size={TEXT_SIZES.label} color="var(--muted)">refill: 1 token per s</HandText>
            <SketchArrow points={[[150, 72], [150, 108]]} seed={seedOf('refillarrow')} stroke="var(--muted)" />

            <SketchBox cx={150} cy={175} w={190} h={110} r={12} seed={seedOf('bucket')} stroke={st.active === 'bucket' ? 'var(--accent)' : TONE.default} strokeWidth={st.active === 'bucket' ? 2.2 : 1.4} />
            {Array.from({ length: 5 }, (_, k) => {
              const has = k < st.tokens;
              return (
                <SketchBox key={k} cx={86 + k * 32} cy={170} w={28} h={28} r={6} seed={seedOf(`tok${k}`)} stroke={has ? 'var(--accent)' : 'var(--muted)'} fill={has ? 'var(--accent)' : undefined} fillStyle="solid" dashed={!has} />
              );
            })}
            <HandText x={150} y={208} size={TEXT_SIZES.label}>{`${st.tokens} of 5 tokens`}</HandText>

            <Chips y={100} from={1} count={8} state={burstState} label="burst at t = 0 s" />
            <Chips y={215} from={9} count={3} state={laterState} label="more at t = 3 s" />
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
