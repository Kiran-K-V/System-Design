import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { MRL_POINTS, vectorBytes } from './Ai5EmbMath';

const BAR_X = 60;
const BAR_W = 600;

const steps = [
  { i: 0, caption: 'Start with the full 2,048-number vector from a ResNet-50 that was trained the Matryoshka way. As float32 it takes 8,192 bytes. A linear classifier on ImageNet-1K gets 76.80% top-1 (Table 1 of the paper). This is an image model: the paper measures images here, not text.' },
  { i: 1, caption: 'Keep only the first 64 numbers. The vector is 32 times smaller: 256 bytes. Top-1 falls to 75.82%, under one point lower. Training made the early numbers carry the coarse signal, so a prefix still works.' },
  { i: 2, caption: 'Keep 32 numbers: 128 bytes, 75.03%. Each halving costs less than a point so far.' },
  { i: 3, caption: 'Keep 16 numbers: 64 bytes, 73.53%. The loss is now 3.27 points against the full vector.' },
  { i: 4, caption: 'Keep 8 numbers: 32 bytes, 66.63%. The curve bends down fast. The lesson for you: there is a knee, and it sits in a different place for each model and task. Find it with your own queries. OpenAI offers the same trick for text through the dimensions parameter.' },
];

export default function Ai5EmbMrl() {
  return (
    <AnimFrame title="Matryoshka truncation: dimensions against accuracy" steps={steps} interval={6000}>
      {(_, s) => {
        const p = MRL_POINTS[s.i];
        const frac = Math.max(0.012, p.dims / 2048);
        return (
          <SketchSvg width={720} height={300} label="A vector cut to its first numbers, with bytes and top-1 accuracy">
            <HandText x={BAR_X} y={30} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
              {`Vector prefix: first ${p.dims} of 2,048 numbers`}
            </HandText>
            <SketchBox cx={BAR_X + BAR_W / 2} cy={72} w={BAR_W} h={44} r={8} seed={seedOf('mrl-full')} stroke="var(--muted)" dashed />
            <SketchBox cx={BAR_X + (BAR_W * frac) / 2} cy={72} w={BAR_W * frac} h={44} r={6} seed={seedOf(`mrl-keep-${p.dims}`)} stroke="var(--accent)" strokeWidth={2.2} fill="var(--accent)" />
            <HandText x={BAR_X} y={118} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">
              {`${vectorBytes(p.dims).toLocaleString('en-US')} bytes as float32 (${(2048 / p.dims).toFixed(0)}x smaller than 8,192)`}
            </HandText>
            <HandText x={BAR_X} y={160} anchor="start" size={TEXT_SIZES.heading} color="var(--fg)">
              ImageNet-1K top-1 accuracy (ResNet-50)
            </HandText>
            <SketchBox cx={BAR_X + BAR_W / 2} cy={200} w={BAR_W} h={44} r={8} seed={seedOf('mrl-acc-full')} stroke="var(--muted)" dashed />
            <SketchBox cx={BAR_X + (BAR_W * (p.top1 / 100)) / 2} cy={200} w={BAR_W * (p.top1 / 100)} h={44} r={6} seed={seedOf(`mrl-acc-${p.dims}`)} stroke="var(--ok)" strokeWidth={2.2} fill="var(--ok)" />
            <HandText x={BAR_X} y={246} anchor="start" size={TEXT_SIZES.note} mono color="var(--muted)">0%</HandText>
            <HandText x={BAR_X + BAR_W} y={246} anchor="end" size={TEXT_SIZES.note} mono color="var(--muted)">100%</HandText>
            <HandText x={360} y={272} size={TEXT_SIZES.display} mono color="var(--ok)">{`${p.top1.toFixed(2)}%`}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
