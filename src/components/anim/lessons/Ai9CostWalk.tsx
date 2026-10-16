import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { waterfall } from './Ai9CostMath';

const STAGES = waterfall();
const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

const steps = [
  { caption: 'The starting point: 5 million requests a month, each with 3,000 tokens in and 500 tokens out, on the largest model in this stack, Claude Opus 5.5 ($4 in, $20 out per million tokens). No levers. The bill is $110,000 a month.' },
  { caption: 'Lever 1: use a smaller model. Sonnet 5.5 costs $2 in and $10 out, half of Opus. Same traffic, $55,000. This only counts if Sonnet still passes your quality check. Lesson A8 shows how to run it.' },
  { caption: 'Lever 2: cache the repeated start of the prompt. If 2,400 of the 3,000 input tokens are the same every time, the provider reads them at $0.10 per million instead of $2. The bill drops by $22,800 to $32,200.' },
  { caption: 'Lever 3: ask for shorter answers. Output tokens cost 5 times as much as input tokens. Going from 500 to 300 output tokens saves $10,000 a month, with no change to the prompt.' },
  { caption: 'Lever 4: batch the work nobody waits for. Say 30% of requests are offline jobs, such as nightly summaries. The Batch API charges half price for them, and the cache discount still applies. That share is made up for this example.' },
  { caption: 'Lever 5: send easy requests to the cheapest model. Say half of the requests pass the same quality check on Haiku 5.5. The bill falls to about $9,900. That is 91% below the start, but only if the eval says Haiku really passes. The 50% share is made up for this example.' },
];

const LX = 20;
const BX = 290;
const BW = 400;
const ROW0 = 40;
const ROW = 52;
const MAX = STAGES[0].total;

export default function Ai9CostWalk() {
  return (
    <AnimFrame title="One bill, five levers" steps={steps} interval={4600}>
      {(i) => {
        const h = ROW0 + STAGES.length * ROW + 10;
        return (
          <SketchSvg width={720} height={h} label="Monthly cost after each cost lever is applied in turn">
            <HandText x={LX} y={20} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">monthly cost</HandText>
            {STAGES.map((s, k) => {
              if (k > i) return null;
              const y = ROW0 + k * ROW + 10;
              const w = Math.max(8, (s.total / MAX) * BW);
              const prev = k > 0 ? STAGES[k - 1].total : null;
              const active = k === i;
              const tone = active ? 'var(--accent)' : 'var(--muted)';
              return (
                <g key={s.label}>
                  <HandText x={LX} y={y - 8} size={TEXT_SIZES.label} anchor="start" color={active ? 'var(--accent)' : 'var(--fg)'}>{s.label}</HandText>
                  <HandText x={LX} y={y + 12} size={TEXT_SIZES.note} anchor="start" mono color="var(--muted)">{usd(s.total)}</HandText>
                  {prev !== null && (
                    <SketchBox cx={BX + (prev / MAX) * BW / 2} cy={y} w={(prev / MAX) * BW} h={26} r={6} seed={seedOf(`cwg${k}`)} stroke="var(--border)" dashed />
                  )}
                  <SketchBox cx={BX + w / 2} cy={y} w={w} h={26} r={6} seed={seedOf(`cwb${k}`)} stroke={tone} fill={tone} strokeWidth={active ? 2.2 : 1.4} />
                  {prev !== null && w < BW - 110 && (
                    <HandText x={BX + w + 10} y={y} size={TEXT_SIZES.label} anchor="start" mono color="var(--ok)">{`-${usd(prev - s.total)}`}</HandText>
                  )}
                </g>
              );
            })}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
