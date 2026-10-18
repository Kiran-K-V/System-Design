import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { fullSpacetimeWork, perFrameWork } from './Ai12VidMath';

interface Step {
  caption: string;
  f: number;
  label: string;
}

const steps: Step[] = [
  {
    caption:
      'An image model makes one frame. Count its attention work as 1 unit. A unit here means "one image\'s worth of every-token-looks-at-every-token work". The sizes below are relative, not seconds.',
    f: 1,
    label: '1 image',
  },
  {
    caption:
      'One second of video at 24 frames per second is 24 images. If each frame only looks at itself, the work is 24 units. If every token in every frame looks at every token in every frame, the work is 24 x 24 = 576 units.',
    f: 24,
    label: '1 s = 24 frames',
  },
  {
    caption:
      'The clip from the lesson: 5 s x 24 = 120 frames. Frame by frame it is 120 units. Looking across all frames at once it is 120 x 120 = 14,400 units. The ratio between the two is 120, the frame count.',
    f: 120,
    label: '5 s = 120 frames',
  },
  {
    caption:
      'Double the length to 10 s and the frames double to 240. Frame by frame work doubles to 240 units. All-frames-at-once work grows 4 times, to 57,600. Length is the lever that hurts most when frames look at each other.',
    f: 240,
    label: '10 s = 240 frames',
  },
];

const BAR_X = 330;
const BAR_W = 360;
const MAXLOG = Math.log10(60000);
const bar = (v: number) => Math.max(8, (Math.log10(v) / MAXLOG) * BAR_W);
const fmt = (n: number) => n.toLocaleString('en-US');

export default function Ai12VidFrames() {
  return (
    <AnimFrame title="A video is a stack of images, and work grows with the stack" steps={steps} interval={6500}>
      {(_, s) => {
        const shown = Math.min(s.f, 6);
        const each = perFrameWork(s.f);
        const all = fullSpacetimeWork(s.f);
        return (
          <SketchSvg width={720} height={300} label={`${s.label}. Frame by frame work ${each} units. All frames together ${all} units.`}>
            <HandText x={24} y={32} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
              Time axis
            </HandText>
            {Array.from({ length: shown }, (_, i) => {
              const k = shown - 1 - i;
              return (
                <SketchBox
                  key={k}
                  cx={90 + k * 26}
                  cy={150 - k * 14}
                  w={130}
                  h={90}
                  r={8}
                  seed={seedOf(`vf${k}`)}
                  stroke={k === 0 ? 'var(--accent)' : 'var(--muted)'}
                  fill={k === 0 ? 'var(--accent)' : undefined}
                />
              );
            })}
            <HandText x={150} y={236} size={TEXT_SIZES.label} color="var(--accent)">
              {s.label}
            </HandText>
            {s.f > 6 && (
              <HandText x={150} y={262} size={TEXT_SIZES.note} color="var(--muted)">
                {`(first ${shown} drawn)`}
              </HandText>
            )}
            <HandText x={BAR_X} y={32} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
              Attention work, relative units (log scale)
            </HandText>
            <HandText x={BAR_X} y={78} anchor="start" size={TEXT_SIZES.label}>
              Each frame looks at itself
            </HandText>
            <SketchBox cx={BAR_X + bar(each) / 2} cy={110} w={bar(each)} h={28} r={6} seed={seedOf('vf-e')} stroke="var(--ok)" fill="var(--ok)" />
            <HandText x={BAR_X} y={146} anchor="start" size={TEXT_SIZES.label} mono color="var(--ok)">
              {fmt(each)}
            </HandText>
            <HandText x={BAR_X} y={188} anchor="start" size={TEXT_SIZES.label}>
              Every token looks at every frame
            </HandText>
            <SketchBox cx={BAR_X + bar(all) / 2} cy={220} w={bar(all)} h={28} r={6} seed={seedOf('vf-a')} stroke="var(--warn)" fill="var(--warn)" />
            <HandText x={BAR_X} y={256} anchor="start" size={TEXT_SIZES.label} mono color="var(--warn)">
              {fmt(all)}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
