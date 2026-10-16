import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  /** Which part is the active one this step. */
  active: 'none' | 'w' | 'ab' | 'sum' | 'h' | 'back' | 'merge';
  adapter: boolean;
  readout: string;
}

const steps: Step[] = [
  {
    caption:
      'One layer of the model has a big grid of numbers, W. The layer multiplies the input x by W to get the output h. In our example W has 8,192 x 8,192 = 67,108,864 numbers. Full fine-tuning would change every one of them.',
    active: 'w',
    adapter: false,
    readout: 'W: 67,108,864 numbers',
  },
  {
    caption:
      'LoRA freezes W. Frozen means: the numbers are read and never changed. Next to W it adds two thin grids. A is 16 x 8,192. B is 8,192 x 16. The 16 is the rank. Together A and B hold 2 x 131,072 = 262,144 numbers, 1 in 256 of W.',
    active: 'ab',
    adapter: true,
    readout: 'A + B: 262,144 numbers',
  },
  {
    caption:
      'B starts as all zeros. So at the start A and B add nothing, and the layer gives exactly the same answers as the base model. Training starts from a model you already trust, not from a broken one.',
    active: 'ab',
    adapter: true,
    readout: 'B = 0, so output = base output',
  },
  {
    caption:
      'Forward pass: the input x goes down two paths at once. The wide path multiplies x by W. The thin path multiplies x by A, then by B. The layer adds the two results. That sum is h.',
    active: 'sum',
    adapter: true,
    readout: 'h = W x + B (A x)',
  },
  {
    caption:
      'The model compares its final answer with the example answer and computes a loss. The loss sends a gradient back through the layer. A gradient says how to nudge each number to make the loss smaller.',
    active: 'h',
    adapter: true,
    readout: 'gradient arrives at h',
  },
  {
    caption:
      'Backward pass: the gradient flows back through both paths. W gets no update, because it is frozen, so the training run never stores a gradient or optimizer notes for its 67 million numbers. Only A and B are updated.',
    active: 'back',
    adapter: true,
    readout: 'update A and B only',
  },
  {
    caption:
      'For serving, add the thin path into W once: W becomes W + B A. The layer is the same size as before, so the merged model runs at the same speed as the base model. Or keep A and B in a separate small file, one per customer, and attach the right one to each request.',
    active: 'merge',
    adapter: false,
    readout: 'merged: one grid again',
  },
];

const frozen = 'var(--muted)';

export default function Ai11LoraWalk() {
  return (
    <AnimFrame title="LoRA on one layer: freeze W, train a thin side path" steps={steps} interval={6500}>
      {(i, s) => {
        const back = s.active === 'back';
        const wTone = s.active === 'w' || s.active === 'merge' ? 'var(--accent)' : frozen;
        const abTone = s.active === 'ab' ? 'var(--accent)' : back ? 'var(--warn)' : s.adapter ? 'var(--ok)' : frozen;
        const flow = s.active === 'sum' ? 'var(--accent)' : back ? 'var(--warn)' : 'var(--muted)';
        const w = i === 6 ? 'W + B A' : 'W';
        return (
          <SketchSvg width={720} height={320} label="Layer with a frozen weight grid W and a thin trainable side path A then B, added together into the output h">
            <SketchBox cx={70} cy={130} w={80} h={44} r={8} seed={seedOf('lw-x')} stroke={s.active === 'sum' ? 'var(--accent)' : frozen} />
            <HandText x={70} y={130} size={TEXT_SIZES.label}>
              input x
            </HandText>

            <SketchBox cx={320} cy={70} w={220} h={60} r={8} seed={seedOf('lw-w')} stroke={wTone} strokeWidth={s.active === 'w' || s.active === 'merge' ? 2.2 : 1.4} fill={s.active === 'w' || s.active === 'merge' ? 'var(--accent)' : undefined} dashed={false} />
            <HandText x={320} y={60} size={TEXT_SIZES.label}>
              {w}
            </HandText>
            <HandText x={320} y={82} size={TEXT_SIZES.note} color="var(--muted)">
              {i === 6 ? 'one grid, same size' : 'frozen, 67.1M numbers'}
            </HandText>

            {s.adapter && (
              <>
                <SketchBox cx={250} cy={200} w={110} h={60} r={8} seed={seedOf('lw-a')} stroke={abTone} strokeWidth={s.active === 'ab' || back ? 2.2 : 1.4} fill={s.active === 'ab' ? 'var(--accent)' : undefined} />
                <HandText x={250} y={190} size={TEXT_SIZES.label}>
                  A
                </HandText>
                <HandText x={250} y={212} size={TEXT_SIZES.note} color="var(--muted)">
                  16 x 8,192
                </HandText>
                <SketchBox cx={400} cy={200} w={110} h={60} r={8} seed={seedOf('lw-b')} stroke={abTone} strokeWidth={s.active === 'ab' || back ? 2.2 : 1.4} fill={s.active === 'ab' ? 'var(--accent)' : undefined} />
                <HandText x={400} y={190} size={TEXT_SIZES.label}>
                  B
                </HandText>
                <HandText x={400} y={212} size={TEXT_SIZES.note} color="var(--muted)">
                  8,192 x 16
                </HandText>
                <SketchArrow points={[[310, 200], [340, 200]]} seed={seedOf('lw-ab')} stroke={flow} head={back ? 'none' : 'end'} />
                <SketchArrow points={[[70 + 20, 154], [250 - 60, 200]]} seed={seedOf('lw-xa')} stroke={flow} head={back ? 'both' : 'end'} />
                <SketchArrow points={[[400 + 60, 200], [580 - 24, 150]]} seed={seedOf('lw-bs')} stroke={flow} head={back ? 'both' : 'end'} />
              </>
            )}

            <SketchArrow points={[[70 + 44, 118], [320 - 116, 70]]} seed={seedOf('lw-xw')} stroke={flow} head={back ? 'both' : 'end'} />
            <SketchArrow points={[[320 + 116, 70], [580 - 20, 116]]} seed={seedOf('lw-ws')} stroke={flow} head={back ? 'both' : 'end'} />

            <SketchEllipse cx={580} cy={130} w={44} h={44} seed={seedOf('lw-sum')} stroke={s.active === 'sum' ? 'var(--accent)' : frozen} strokeWidth={s.active === 'sum' ? 2.2 : 1.4} fill={s.active === 'sum' ? 'var(--accent)' : undefined} />
            <HandText x={580} y={130} size={TEXT_SIZES.heading}>
              +
            </HandText>
            <SketchArrow points={[[580 + 24, 130], [650 - 40, 130]]} seed={seedOf('lw-sh')} stroke={flow} />
            <SketchBox cx={670} cy={130} w={80} h={44} r={8} seed={seedOf('lw-h')} stroke={s.active === 'h' ? 'var(--accent)' : frozen} strokeWidth={s.active === 'h' ? 2.2 : 1.4} fill={s.active === 'h' ? 'var(--accent)' : undefined} />
            <HandText x={670} y={130} size={TEXT_SIZES.label}>
              output h
            </HandText>

            <SketchBox cx={360} cy={288} w={600} h={40} r={8} seed={seedOf('lw-read')} fill="var(--accent-soft)" />
            <HandText x={360} y={289} size={TEXT_SIZES.label} mono color="var(--accent)">
              {s.readout}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
