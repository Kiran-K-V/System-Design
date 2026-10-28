import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { accumulate, toBf16 } from './AiE2CkptLogic';

/** Illustrative: a weight of 1.0 and a tiny update of 0.001 per step (made-up values; the mechanism is real). */
const W0 = 1.0;
const U = 0.001;
const N = 100;
const res = accumulate(W0, U, N);
const GAP = 2 ** -7; // BF16 spacing just above 1.0 (7 stored fraction bits)

const LO = 0.98;
const HI = 1.12;
const X0 = 50;
const X1 = 670;
const px = (v: number) => X0 + ((v - LO) / (HI - LO)) * (X1 - X0);
const ticks: number[] = [];
for (let v = toBf16(LO); v <= HI; v += v < 1 ? GAP / 2 : GAP) ticks.push(toBf16(v + 1e-9));
const f = (v: number, d = 4) => v.toFixed(d);

interface Step {
  caption: string;
  bf16: number | null; // marker on BF16 line
  master: number | null; // marker on FP32 line
  update: boolean;
  stat: string;
  tone: 'accent' | 'ok' | 'warn' | 'bad';
}

const steps: Step[] = [
  {
    caption: `A weight is 1.0. Training wants to nudge it up by ${U} each step. These two values are illustrative. A BF16 number keeps 7 bits after the leading 1, so the stored numbers near 1.0 sit ${GAP} apart (the ticks below).`,
    bf16: 1.0,
    master: null,
    update: false,
    stat: `BF16 grid gap near 1.0: ${GAP}`,
    tone: 'accent',
  },
  {
    caption: `Add ${U}. The exact answer is ${1 + U}. It is less than half a gap away from 1.0, so BF16 rounds it back to the nearest stored number, 1.0. The update vanished.`,
    bf16: 1.0,
    master: null,
    update: true,
    stat: `1.0 + ${U} stores as ${f(toBf16(1 + U), 4)}`,
    tone: 'bad',
  },
  {
    caption: `Repeat for ${N} steps. Every step rounds back. After ${N} steps the BF16-only weight is still ${f(res.bf16Only, 4)}. The model has stopped learning on this weight, with no error message.`,
    bf16: res.bf16Only,
    master: null,
    update: true,
    stat: `after ${N} steps: ${f(res.bf16Only, 4)} (should be near ${f(W0 + N * U, 2)})`,
    tone: 'bad',
  },
  {
    caption: `Keep a master copy in FP32. It has 23 bits after the leading 1, so its gap near 1.0 is about a hundred thousand times smaller than BF16's, and ${U} fits. The updates add up in the master copy: after ${N} steps it holds ${f(res.master, 4)}.`,
    bf16: res.bf16Only,
    master: res.master,
    update: true,
    stat: `FP32 master after ${N} steps: ${f(res.master, 4)}`,
    tone: 'ok',
  },
  {
    caption: `Each step, the master is rounded to BF16 to make the copy that the forward and backward passes use: ${f(res.master, 4)} stores as ${f(res.masterBf16, 4)}. The fast math runs on 2-byte numbers, and the slow-changing truth lives in 4 bytes.`,
    bf16: res.masterBf16,
    master: res.master,
    update: true,
    stat: `compute copy: ${f(res.masterBf16, 4)}`,
    tone: 'accent',
  },
];

export default function AiE2PrecisionWalk() {
  return (
    <AnimFrame title="Why the master copy stays in FP32" steps={steps} interval={5600}>
      {(i, s) => (
        <SketchSvg width={720} height={290} label={`Step ${i + 1}: BF16 rounding of small weight updates`}>
          <HandText x={X0} y={22} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">BF16 grid (each tick is a number BF16 can store)</HandText>
          <SketchArrow points={[[X0, 80], [X1, 80]]} head="none" seed={seedOf('pw-top')} stroke="var(--muted)" />
          {ticks.map((t, k) => (
            <SketchArrow key={k} points={[[px(t), 70], [px(t), 90]]} head="none" seed={seedOf(`pw-t${k}`)} stroke="var(--muted)" />
          ))}
          {s.bf16 !== null && <SketchEllipse cx={px(s.bf16)} cy={80} w={16} h={16} seed={seedOf(`pw-b${i}`)} fill={`var(--${s.tone === 'ok' ? 'accent' : s.tone})`} stroke={`var(--${s.tone === 'ok' ? 'accent' : s.tone})`} />}
          {s.update && s.bf16 !== null && s.master === null && (
            <SketchArrow points={[[px(1.0), 125], [px(1.0 + U), 125]]} head="end" seed={seedOf('pw-u')} stroke="var(--warn)" strokeWidth={2.2} />
          )}
          {s.update && s.master === null && <HandText x={px(1.0) + 20} y={125} size={TEXT_SIZES.note} color="var(--warn)" anchor="start">{`update ${U}: smaller than half a gap`}</HandText>}
          <HandText x={X0} y={170} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">{s.master !== null ? 'FP32 master (grid too fine to draw)' : ''}</HandText>
          {s.master !== null && (
            <g>
              <SketchArrow points={[[X0, 200], [X1, 200]]} head="none" seed={seedOf('pw-bot')} stroke="var(--muted)" />
              <SketchEllipse cx={px(s.master)} cy={200} w={16} h={16} seed={seedOf(`pw-m${i}`)} fill="var(--ok)" stroke="var(--ok)" />
              {i === 4 && <SketchArrow points={[[px(s.master), 188], [px(res.masterBf16), 92]]} head="end" seed={seedOf('pw-r')} stroke="var(--accent)" />}
            </g>
          )}
          <HandText x={X0} y={235} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">{`scale: ${LO} to ${HI}`}</HandText>
          <HandText x={360} y={268} size={TEXT_SIZES.label} mono color={`var(--${s.tone})`}>{s.stat}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
