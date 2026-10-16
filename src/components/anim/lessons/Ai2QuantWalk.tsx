import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { errors, quantize } from './Ai2QuantMath';

/** Illustrative weights (made up, not from a real model). */
const WS = [-0.82, -0.47, -0.21, -0.05, 0.13, 0.38, 0.61, 0.9];
const WS_OUT = [...WS, 3.0];

const q8 = quantize(WS, 8);
const q4 = quantize(WS, 4);
const q4o = quantize(WS_OUT, 4);
const e8 = errors(WS, q8.q);
const e4 = errors(WS, q4.q);
const e4o = errors(WS, q4o.q.slice(0, WS.length));

interface Step {
  caption: string;
  ws: number[];
  q: number[] | null;
  range: number;
  levels: number | null;
  stat: string;
  tone: 'accent' | 'ok' | 'warn' | 'bad';
}

const f = (v: number) => v.toFixed(3);

const steps: Step[] = [
  {
    caption: 'These 8 numbers stand in for weights of one layer. They are illustrative, not from a real model. In BF16 each takes 2 bytes and can hold one of about 65,000 values, so the stored number is almost the true one.',
    ws: WS,
    q: null,
    range: 1,
    levels: null,
    stat: 'BF16: 2 bytes each',
    tone: 'accent',
  },
  {
    caption: `INT8 keeps one byte per weight: 256 codes. The scale is the largest magnitude, 0.90, divided by 127, so the codes sit ${f(q8.scale)} apart. Each weight snaps to the nearest code. The largest error here is ${f(e8.max)}. The model barely notices, but your eval is what says so.`,
    ws: WS,
    q: q8.q,
    range: 1,
    levels: null,
    stat: `INT8: max error ${f(e8.max)}`,
    tone: 'ok',
  },
  {
    caption: `INT4 keeps half a byte: 16 codes, spaced ${f(q4.scale)} apart (0.90 / 7). The bottom row shows the 16 codes. Every weight moves to the nearest tick. The largest error is ${f(e4.max)}, ${Math.round(e4.max / e8.max)} times the INT8 error. You saved 4x the bytes against BF16 and paid in precision.`,
    ws: WS,
    q: q4.q,
    range: 1,
    levels: 16,
    stat: `INT4: max error ${f(e4.max)}`,
    tone: 'warn',
  },
  {
    caption: `Add one large weight, 3.0 (illustrative outlier). The scale is set by the largest magnitude, so the 16 codes now spread over -3 to 3 and sit ${f(q4o.scale)} apart. The same 8 small weights now see a maximum error of ${f(e4o.max)}, up from ${f(e4.max)}. One big value coarsens the grid for all the others.`,
    ws: WS_OUT,
    q: q4o.q,
    range: 3,
    levels: 16,
    stat: `INT4 + outlier: max error ${f(e4o.max)} on the small ones`,
    tone: 'bad',
  },
  {
    caption: 'This is why methods differ. AWQ reports that protecting about 1% of the weights, the ones that matter most, "can greatly reduce quantization error". GPTQ rounds weights to 3 or 4 bits after training, with no retraining, and quantized a 175B model in about 4 GPU hours. We do not quote accuracy numbers: they depend on the model and task. Run your eval.',
    ws: WS_OUT,
    q: q4o.q,
    range: 3,
    levels: 16,
    stat: 'Quality loss: measure on your eval',
    tone: 'accent',
  },
];

const X0 = 60;
const X1 = 660;
const tone = (t: Step['tone']) => `var(--${t})`;

export default function Ai2QuantWalk() {
  return (
    <AnimFrame title="Rounding weights to fewer levels" steps={steps} interval={5200}>
      {(i, s) => {
        const px = (v: number) => X0 + ((v + s.range * 1.1) / (s.range * 2.2)) * (X1 - X0);
        const scale = s.q ? (s.range === 1 ? (s.levels === 16 ? q4.scale : q8.scale) : q4o.scale) : 0;
        const ticks: number[] = [];
        if (s.levels === 16) for (let k = -8; k <= 7; k++) ticks.push(k * scale);
        const small = s.range === 3;
        return (
          <SketchSvg width={720} height={280} label={`Step ${i + 1}: rounding weights to fewer levels`}>
            <HandText x={X0} y={22} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">original weights</HandText>
            <SketchArrow points={[[X0, 80], [X1, 80]]} head="none" seed={seedOf('qw-top')} stroke="var(--muted)" />
            {s.ws.map((w, k) => (
              <SketchEllipse key={`o${k}`} cx={px(w)} cy={80} w={small ? 12 : 16} h={small ? 12 : 16} seed={seedOf(`qw-o${k}`)} fill="var(--accent)" stroke="var(--accent)" />
            ))}
            {s.q && (
              <g>
                <HandText x={X0} y={150} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">{s.levels === 16 ? 'stored weights (16 codes as ticks)' : 'stored weights (256 codes, too close to draw)'}</HandText>
                <SketchArrow points={[[X0, 200], [X1, 200]]} head="none" seed={seedOf('qw-bot')} stroke="var(--muted)" />
                {ticks.map((t, k) => (
                  <SketchArrow key={`t${k}`} points={[[px(t), 190], [px(t), 210]]} head="none" seed={seedOf(`qw-t${k}`)} stroke="var(--muted)" />
                ))}
                {s.ws.map((w, k) => (
                  <g key={`q${k}`}>
                    <SketchArrow points={[[px(w), 90], [px(s.q![k]), 190]]} head="none" seed={seedOf(`qw-l${k}`)} stroke={tone(s.tone)} strokeWidth={1.4} />
                    <SketchEllipse cx={px(s.q![k])} cy={200} w={small ? 12 : 16} h={small ? 12 : 16} seed={seedOf(`qw-q${k}`)} fill={tone(s.tone)} stroke={tone(s.tone)} />
                  </g>
                ))}
              </g>
            )}
            <HandText x={360} y={250} size={TEXT_SIZES.label} mono color={tone(s.tone)}>{s.stat}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
