import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { OUT_PRICE, decodeSeconds, outputCost } from './Ai4ThinkMath';

const ANS = 300;
interface Bar {
  label: string;
  think: number;
}
interface Step {
  caption: string;
  bars: Bar[];
  showCost: boolean;
  focus: number;
}

const bars: Bar[] = [
  { label: 'No thinking', think: 0 },
  { label: '2K thinking', think: 2000 },
  { label: '8K thinking', think: 8000 },
];

const steps: Step[] = [
  {
    caption: `No thinking. The model writes a ${ANS}-token answer. At an assumed 20 ms per token that is ${decodeSeconds(ANS)} s of decoding. The first visible token appears as soon as the prompt is processed.`,
    bars: [bars[0]], showCost: false, focus: 0,
  },
  {
    caption: `Thinking on, 2,000 thinking tokens. The model first writes reasoning tokens, then the answer. 2,000 x 20 ms = ${decodeSeconds(2000)} s before the first answer token. The user sees nothing, or only a thinking summary, for that time.`,
    bars: [bars[0], bars[1]], showCost: false, focus: 1,
  },
  {
    caption: `8,000 thinking tokens: 8,000 x 20 ms = ${decodeSeconds(8000)} s, almost three minutes, before the answer starts. A chat UI that waits this long looks broken. This is the time-to-first-token (TTFT) cost of thinking, and streaming the answer does not hide it.`,
    bars, showCost: false, focus: 2,
  },
  {
    caption: `Thinking tokens bill as output tokens. At the Sonnet 5.5 output price of $10 per million: ${(8000 + ANS).toLocaleString('en-US')} tokens cost $${outputCost(8000 + ANS, OUT_PRICE.sonnet).toFixed(4)}, against $${outputCost(ANS, OUT_PRICE.sonnet).toFixed(4)} with no thinking. That is about ${(outputCost(8000 + ANS, OUT_PRICE.sonnet) / outputCost(ANS, OUT_PRICE.sonnet)).toFixed(0)} times more, from the thinking alone. If the API returns a summary of the thinking, you still pay for the full thinking.`,
    bars, showCost: true, focus: 2,
  },
];

const X0 = 130;
const SCALE = 560 / 170;
const tone = (t: string) => `var(--${t})`;

export default function Ai4ThinkWalk() {
  return (
    <AnimFrame title="Where the time goes" steps={steps} interval={5200}>
      {(i, s) => (
        <SketchSvg width={720} height={250} label={`Step ${i + 1}: thinking timeline`}>
          {s.bars.map((b, k) => {
            const y = 40 + k * 56;
            const tw = decodeSeconds(b.think) * SCALE;
            const aw = Math.max(decodeSeconds(ANS) * SCALE, 6);
            const active = k === s.focus;
            return (
              <g key={b.label}>
                <HandText x={14} y={y} anchor="start" size={TEXT_SIZES.label} color={active ? 'var(--fg)' : 'var(--muted)'}>{b.label}</HandText>
                {b.think > 0 && <SketchBox cx={X0 + tw / 2} cy={y} w={tw} h={34} r={6} seed={seedOf(`tw-t${k}`)} fill={tone('warn')} stroke={tone('warn')} strokeWidth={active ? 2.2 : 1.4} />}
                <SketchBox cx={X0 + tw + aw / 2} cy={y} w={aw} h={34} r={6} seed={seedOf(`tw-a${k}`)} fill={tone('accent')} stroke={tone('accent')} strokeWidth={active ? 2.2 : 1.4} />
                <HandText x={X0 + tw + aw + 10} y={y} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">{`${(decodeSeconds(b.think) + decodeSeconds(ANS)).toFixed(0)} s`}</HandText>
                {s.showCost && <HandText x={706} y={y} anchor="end" size={TEXT_SIZES.note} mono color={k === 2 ? 'var(--bad)' : 'var(--ok)'}>{`$${outputCost(b.think + ANS, OUT_PRICE.sonnet).toFixed(4)}`}</HandText>}
              </g>
            );
          })}
          <SketchArrow points={[[X0, 214], [X0 + 170 * SCALE, 214]]} head="end" seed={seedOf('tw-ax')} stroke="var(--muted)" />
          <HandText x={X0} y={234} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">0 s</HandText>
          <HandText x={X0 + 170 * SCALE} y={234} anchor="end" size={TEXT_SIZES.note} color="var(--muted)">decode time, 20 ms per token (assumed). Orange: thinking. Blue: answer.</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
