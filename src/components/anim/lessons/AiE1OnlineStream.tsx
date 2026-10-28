import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchCylinder, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  active: 'log' | 'trainer' | 'sparse' | 'dense' | 'bad' | null;
}

const steps: Step[] = [
  {
    caption:
      'User events (clicks, skips, purchases) land in an append-only event log, as in the pub/sub lesson. The online trainer reads that log as a stream.',
    active: 'log',
  },
  {
    caption:
      'The trainer updates the model from each small batch. One model has two kinds of parameters. Sparse ones are embedding rows, one per user or item ID. Dense ones are the shared layers. A batch only touches the rows of the IDs in it.',
    active: 'trainer',
  },
  {
    caption:
      'Every minute, the trainer ships only the touched embedding rows to the serving copies. A user who clicked a video one minute ago already changes what the next request sees. This is the fast path.',
    active: 'sparse',
  },
  {
    caption:
      'Once a day, the trainer also ships the dense parameters. They move slowly, so a daily copy is enough, and they are far bigger to send per row. This is the slow path.',
    active: 'dense',
  },
  {
    caption:
      'The risk. A burst of bad events (a bot, a broken client, an attack) enters the log. The trainer learns from it, and the fast path carries the damage to every serving copy within the minute. Speed helps and harms by the same road.',
    active: 'bad',
  },
];

export default function AiE1OnlineStream() {
  return (
    <AnimFrame title="Two speeds: touched rows every minute, dense layers every day" steps={steps} interval={6500}>
      {(_, s) => {
        const tone = (k: Step['active'], base = 'var(--muted)') => (s.active === k ? (k === 'bad' ? 'var(--bad)' : 'var(--accent)') : base);
        return (
          <SketchSvg width={720} height={290} label="Event log feeds an online trainer. The trainer sends sparse rows every minute and dense parameters daily to serving copies.">
            <SketchCylinder cx={90} cy={120} w={100} h={70} seed={seedOf('os-log')} stroke={tone('log')} fill={s.active === 'log' ? 'var(--accent)' : undefined} />
            <HandText x={90} y={124} size={TEXT_SIZES.label}>
              Event log
            </HandText>
            <SketchBox cx={300} cy={120} w={130} h={60} r={8} seed={seedOf('os-tr')} stroke={tone('trainer')} fill={s.active === 'trainer' ? 'var(--accent)' : undefined} />
            <HandText x={300} y={120} size={TEXT_SIZES.label}>
              {'Online\ntrainer'}
            </HandText>
            <SketchBox cx={620} cy={70} w={130} h={60} r={8} seed={seedOf('os-s1')} stroke="var(--muted)" />
            <HandText x={620} y={70} size={TEXT_SIZES.label}>
              {'Serving\ncopy 1'}
            </HandText>
            <SketchBox cx={620} cy={180} w={130} h={60} r={8} seed={seedOf('os-s2')} stroke="var(--muted)" />
            <HandText x={620} y={180} size={TEXT_SIZES.label}>
              {'Serving\ncopy 2'}
            </HandText>
            <SketchArrow points={[[146, 120], [228, 120]]} seed={seedOf('os-a1')} stroke={s.active === 'bad' ? 'var(--bad)' : tone('log')} />
            <SketchArrow points={[[366, 100], [548, 72]]} seed={seedOf('os-a2')} stroke={tone(s.active === 'bad' ? 'bad' : 'sparse')} strokeWidth={s.active === 'sparse' || s.active === 'bad' ? 2.2 : 1.4} />
            <SketchArrow points={[[366, 140], [548, 178]]} seed={seedOf('os-a3')} stroke={tone(s.active === 'bad' ? 'bad' : 'sparse')} strokeWidth={s.active === 'sparse' || s.active === 'bad' ? 2.2 : 1.4} />
            <HandText x={440} y={46} size={TEXT_SIZES.note} color={tone('sparse')}>
              touched rows, every minute
            </HandText>
            <SketchArrow points={[[300, 156], [300, 246], [548, 246], [620, 214]]} seed={seedOf('os-a4')} stroke={tone('dense')} dashed strokeWidth={s.active === 'dense' ? 2.2 : 1.4} />
            <HandText x={410} y={268} size={TEXT_SIZES.note} color={tone('dense')}>
              dense parameters, once a day
            </HandText>
            {s.active === 'bad' && (
              <HandText x={90} y={190} size={TEXT_SIZES.label} color="var(--bad)">
                {'bad batch\nenters here'}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
