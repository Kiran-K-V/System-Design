import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** One failure and its recovery on a training timeline. Time is not to scale: it shows the order of the costs. */

const W = 720;
const Y = 120;
const H = 44;

interface Seg {
  id: string;
  from: number;
  to: number;
  label: string;
  tone: string;
  step: number;
}

const SEGS: Seg[] = [
  { id: 'train', from: 24, to: 360, label: '', tone: 'var(--ok)', step: 0 },
  { id: 'detect', from: 366, to: 436, label: 'Detect', tone: 'var(--warn)', step: 2 },
  { id: 'swap', from: 442, to: 522, label: 'Swap node', tone: 'var(--warn)', step: 3 },
  { id: 'load', from: 528, to: 608, label: 'Reload', tone: 'var(--warn)', step: 4 },
  { id: 'redo', from: 614, to: 654, label: 'Redo', tone: 'var(--bad)', step: 5 },
  { id: 'go', from: 660, to: 696, label: '', tone: 'var(--ok)', step: 6 },
];
const CKPTS = [120, 220, 320];

const steps = [
  { caption: 'The job trains. Every so often it saves a checkpoint, a copy of everything needed to continue (the green marks below the bar). Each GPU works on its own slice and all of them swap results at the end of every step.' },
  { caption: 'A GPU fails. In synchronous training every other GPU waits for its result, so the whole job stops, not one machine. The work done since the last checkpoint is now at risk.' },
  { caption: 'Detect. The system must notice. A crash with an error code is noticed at once. A hang, with no error, is noticed only when a timer expires. This segment can be seconds or hours, depending on the monitoring.' },
  { caption: 'Replace. The scheduler removes the bad machine and puts a healthy spare in its place. With a spare ready, this is quick. With no spare, the job waits in a queue for repair.' },
  { caption: 'Reload. Every GPU reads the last checkpoint from storage. The size of the checkpoint and the speed of the storage set this time. The state goes back to the green mark at 320, not to the moment of the crash.' },
  { caption: 'Redo. The work between that checkpoint and the crash is gone and is done again. This is the red part: on average half the checkpoint interval is lost, so a longer interval means a longer red bar.' },
  { caption: 'Resume. Training moves forward again. Effective training time is the green share of the whole bar. Every amber and red segment is a cost, and each has its own fix: faster detection, spares, faster storage, more frequent checkpoints.' },
];

export default function AiE2FailureCycle() {
  return (
    <AnimFrame title="One failure, from crash to resume" steps={steps} interval={3800}>
      {(i) => {
        const failed = i >= 1;
        return (
          <SketchSvg width={W} height={290} label="Timeline of a training job with one failure: detect, swap a node, reload a checkpoint, redo lost work, resume">
            <HandText x={24} y={28} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">
              Time runs left to right (not to scale)
            </HandText>
            {SEGS.filter((s) => i >= s.step).map((s) => {
              const lost = s.id === 'train' && i >= 5;
              const w = (lost ? 360 - 320 : s.to - s.from);
              if (lost) {
                return (
                  <g key={s.id}>
                    <SketchBox cx={(24 + 320) / 2} cy={Y} w={320 - 24} h={H} r={4} seed={seedOf('e2cyc-train-ok')} stroke="var(--ok)" fill="var(--ok)" />
                    <SketchBox cx={(320 + 360) / 2} cy={Y} w={w} h={H} r={4} seed={seedOf('e2cyc-train-lost')} stroke="var(--bad)" fill="var(--bad)" />
                  </g>
                );
              }
              const active = (i === s.step && s.id !== 'train') || (i === 5 && s.id === 'redo');
              return (
                <g key={s.id}>
                  <SketchBox cx={(s.from + s.to) / 2} cy={Y} w={s.to - s.from} h={H} r={4} seed={seedOf(`e2cyc-${s.id}`)} stroke={s.tone} fill={s.tone} strokeWidth={active ? 2.2 : 1.4} />
                  {s.label && (
                    <HandText x={(s.from + s.to) / 2} y={Y + 44} size={TEXT_SIZES.label} color={s.tone}>
                      {s.label}
                    </HandText>
                  )}
                </g>
              );
            })}
            {CKPTS.map((x) => (
              <g key={x}>
                <SketchBox cx={x} cy={Y + 36} w={14} h={14} r={3} seed={seedOf(`e2cyc-ck${x}`)} stroke="var(--ok)" fill="var(--ok)" />
              </g>
            ))}
            <HandText x={220} y={Y + 70} size={TEXT_SIZES.note} color="var(--muted)">
              checkpoints
            </HandText>
            {failed && (
              <g>
                <SketchArrow points={[[360, 50], [360, Y - 30]]} seed={seedOf("e2fc-fail")} stroke="var(--bad)" strokeWidth={2.2} />
                <HandText x={360} y={40} size={TEXT_SIZES.label} color="var(--bad)">
                  GPU fails
                </HandText>
              </g>
            )}
            {i >= 4 && (
              <g>
                <SketchArrow points={[[560, Y + 110], [330, Y + 110], [322, Y + 58]]} seed={seedOf("e2fc-back")} stroke="var(--accent)" />
                <HandText x={560} y={Y + 128} size={TEXT_SIZES.note} color="var(--accent)">
                  restart from here
                </HandText>
              </g>
            )}
            {i === 6 && (
              <HandText x={360} y={Y + 160} size={TEXT_SIZES.label} color="var(--ok)">
                green is useful time. Amber and red are the cost.
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
