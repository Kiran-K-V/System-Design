import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Illustrative run (not measured): checkpoint every 30 min, one crash at 2 h 20 min. */
const X0 = 40;
const X1 = 680;
const T_END = 190; // minutes drawn
const px = (min: number) => X0 + (min / T_END) * (X1 - X0);
const CRASH = 140;
const LAST_CKPT = 120;
const CKPTS = [30, 60, 90, 120];

interface Step {
  caption: string;
  upTo: number; // training bar drawn up to this minute
  showCkpt: number[]; // which checkpoint markers are visible
  crash: boolean;
  lost: boolean;
  resume: boolean;
  async: boolean;
  stat: string;
  tone: 'accent' | 'ok' | 'warn' | 'bad';
}

const steps: Step[] = [
  {
    caption: 'Training runs for hours. Every 30 minutes the job writes a checkpoint: a copy of everything needed to resume. The times are illustrative.',
    upTo: 100,
    showCkpt: [30, 60, 90],
    crash: false,
    lost: false,
    resume: false,
    async: false,
    stat: 'checkpoint every 30 min',
    tone: 'ok',
  },
  {
    caption: 'While a checkpoint is written in the simple way, every GPU waits. Each marker is a short stall. Many checkpoints mean many stalls, and that is the cost of safety.',
    upTo: 125,
    showCkpt: CKPTS,
    crash: false,
    lost: false,
    resume: false,
    async: false,
    stat: 'each marker = a stall',
    tone: 'warn',
  },
  {
    caption: 'At minute 140 a GPU fails. The whole job stops, because every GPU needs the others. Memory is lost.',
    upTo: CRASH,
    showCkpt: CKPTS,
    crash: true,
    lost: false,
    resume: false,
    async: false,
    stat: 'crash at 140 min',
    tone: 'bad',
  },
  {
    caption: 'The job restarts from the last checkpoint, at minute 120. The 20 minutes of work between that checkpoint and the crash must be done again. That work is lost.',
    upTo: CRASH,
    showCkpt: CKPTS,
    crash: true,
    lost: true,
    resume: false,
    async: false,
    stat: 'lost: 20 min of work',
    tone: 'bad',
  },
  {
    caption: 'After a restart delay (find a spare node, load the checkpoint), training continues from minute 120. On average, a crash lands halfway between two checkpoints, so about half an interval is lost each time.',
    upTo: 175,
    showCkpt: CKPTS,
    crash: true,
    lost: true,
    resume: true,
    async: false,
    stat: 'average loss per crash: half an interval',
    tone: 'accent',
  },
  {
    caption: 'Asynchronous checkpointing shortens each stall. The GPUs copy state to CPU memory (fast), then training goes on while a background thread writes it to storage. Stalls shrink, so you can afford checkpoints more often and lose less per crash.',
    upTo: 175,
    showCkpt: CKPTS,
    crash: true,
    lost: true,
    resume: true,
    async: true,
    stat: 'smaller stall, same safety',
    tone: 'ok',
  },
];

const tone = (t: string) => `var(--${t})`;

export default function AiE2CkptTimeline() {
  return (
    <AnimFrame title="A crash and the work it costs" steps={steps} interval={5600}>
      {(i, s) => (
        <SketchSvg width={720} height={250} label={`Step ${i + 1}: ${s.stat}`}>
          <HandText x={X0} y={20} size={TEXT_SIZES.note} color="var(--muted)" anchor="start">time (minutes)</HandText>
          <SketchArrow points={[[X0, 190], [X1, 190]]} head="end" seed={seedOf('ck-axis')} stroke="var(--muted)" />
          {[0, 30, 60, 90, 120, 150, 180].map((m) => (
            <HandText key={m} x={px(m)} y={208} size={TEXT_SIZES.note} color="var(--muted)" mono>{String(m)}</HandText>
          ))}
          <SketchBox cx={(px(0) + px(Math.min(s.upTo, s.crash ? CRASH : s.upTo))) / 2} cy={110} w={Math.max(10, px(Math.min(s.upTo, s.crash ? CRASH : s.upTo)) - px(0))} h={44} r={6} seed={seedOf('ck-run')} stroke={tone('ok')} fill="var(--ok)" />
          {s.crash && s.lost && (
            <SketchBox cx={(px(LAST_CKPT) + px(CRASH)) / 2} cy={110} w={px(CRASH) - px(LAST_CKPT)} h={44} r={6} seed={seedOf('ck-lost')} stroke={tone('bad')} fill="var(--bad)" />
          )}
          {s.resume && (
            <SketchBox cx={(px(150) + px(s.upTo)) / 2} cy={110} w={px(s.upTo) - px(150)} h={44} r={6} seed={seedOf('ck-res')} stroke={tone('accent')} fill="var(--accent)" />
          )}
          {s.resume && <HandText x={(px(CRASH) + px(150)) / 2} y={110} size={TEXT_SIZES.note} color="var(--muted)">restart</HandText>}
          {s.showCkpt.map((c) => (
            <g key={c}>
              <SketchArrow points={[[px(c), 160], [px(c), 140]]} head="end" seed={seedOf(`ck-c${c}`)} stroke={tone('accent')} />
              <HandText x={px(c)} y={172} size={TEXT_SIZES.note} color={tone('accent')}>{s.async ? 'snap' : 'save'}</HandText>
            </g>
          ))}
          {s.crash && <HandText x={px(CRASH)} y={70} size={TEXT_SIZES.label} color={tone('bad')}>crash</HandText>}
          {s.lost && <HandText x={(px(LAST_CKPT) + px(CRASH)) / 2} y={110} size={TEXT_SIZES.note} color="var(--fg)">lost</HandText>}
          <HandText x={360} y={238} size={TEXT_SIZES.label} mono color={tone(s.tone)}>{s.stat}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
