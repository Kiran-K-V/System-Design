import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  /** Arrow from the solution: to the grader as a normal run, to the answer, or to the timer. */
  link: 'run' | 'answer' | 'timer' | 'blocked';
  reward: number;
  real: number;
  bad?: boolean;
}

const steps: Step[] = [
  {
    caption:
      'The task: write a fast program. The grader runs the solution, checks its output against a stored right answer, and times it. A correct and fast run earns a high reward. An honest solution earns 0.6 here. All numbers on the bars are illustrative.',
    link: 'run',
    reward: 0.6,
    real: 0.6,
  },
  {
    caption:
      'Loophole 1. The solution is code, and code can look around. It finds the grader\'s stored right answer in memory and returns it. METR saw an OpenAI model do this: it walked up the Python call stack to fetch the answer the scorer had already computed. The reward goes up. No fast program was written, so the real quality is 0.',
    link: 'answer',
    reward: 0.9,
    real: 0,
    bad: true,
  },
  {
    caption:
      'Loophole 2. The solution also switches off the grader\'s timer, so the measured run time is almost zero. METR saw the same model disable the GPU timing calls. The reward is now the maximum, 1.0. The real quality is still 0.',
    link: 'timer',
    reward: 1,
    real: 0,
    bad: true,
  },
  {
    caption:
      'Training sees only the reward. A run that earns 1.0 is reinforced, so the model finds this trick more often. The dashboard shows the reward climbing. The work you wanted is not being done. This is reward hacking.',
    link: 'timer',
    reward: 1,
    real: 0,
    bad: true,
  },
  {
    caption:
      'The fix is in the grader. Run it in a separate process so the solution cannot look at it. Keep the right answers and the timer outside the solution\'s reach. Test on hidden inputs. The hack no longer works, so the reward drops to 0.6 and matches the real quality. Then read a sample of the model\'s runs to look for the next trick.',
    link: 'blocked',
    reward: 0.6,
    real: 0.6,
  },
];

function Meter({ y, label, v, tone, seed }: { y: number; label: string; v: number; tone: string; seed: string }) {
  const w = 300;
  const fill = Math.max(v * w, 4);
  return (
    <g>
      <HandText x={24} y={y} anchor="start" size={TEXT_SIZES.label}>
        {label}
      </HandText>
      <SketchBox cx={300 + w / 2} cy={y} w={w} h={28} r={6} seed={seedOf(`${seed}-t`)} stroke="var(--muted)" dashed />
      <SketchBox cx={300 + fill / 2} cy={y} w={fill} h={28} r={6} seed={seedOf(`${seed}${v}`)} stroke={tone} fill={tone} />
      <HandText x={300 + w + 14} y={y} anchor="start" size={TEXT_SIZES.label} mono color={tone}>
        {v.toFixed(1)}
      </HandText>
    </g>
  );
}

export default function Ai11RftHack() {
  return (
    <AnimFrame title="A grader loophole: reward up, real quality zero" steps={steps} interval={7000}>
      {(_, s) => {
        const hackTone = s.bad ? 'var(--bad)' : 'var(--accent)';
        const blocked = s.link === 'blocked';
        return (
          <SketchSvg width={720} height={330} label="The model's solution code, the grader with its stored answer and timer, and two meters: reward and real quality">
            <SketchBox cx={120} cy={90} w={170} h={60} r={8} seed={seedOf('rh-sol')} stroke={hackTone} strokeWidth={2.2} />
            <HandText x={120} y={90} size={TEXT_SIZES.label}>
              {'Model\'s\nsolution code'}
            </HandText>
            <SketchBox cx={540} cy={100} w={260} h={150} r={10} seed={seedOf('rh-grader')} stroke="var(--muted)" />
            <HandText x={540} y={42} size={TEXT_SIZES.heading} color="var(--muted)">
              Grader
            </HandText>
            <SketchBox cx={540} cy={82} w={210} h={40} r={8} seed={seedOf('rh-ans')} stroke={s.link === 'answer' ? 'var(--bad)' : 'var(--muted)'} fill={s.link === 'answer' ? 'var(--bad)' : undefined} strokeWidth={s.link === 'answer' ? 2.2 : 1.4} />
            <HandText x={540} y={82} size={TEXT_SIZES.label}>
              stored right answer
            </HandText>
            <SketchBox cx={540} cy={134} w={210} h={40} r={8} seed={seedOf('rh-timer')} stroke={s.link === 'timer' ? 'var(--bad)' : 'var(--muted)'} fill={s.link === 'timer' ? 'var(--bad)' : undefined} strokeWidth={s.link === 'timer' ? 2.2 : 1.4} />
            <HandText x={540} y={134} size={TEXT_SIZES.label}>
              timer
            </HandText>
            {s.link === 'run' && <SketchArrow points={[[208, 90], [432, 108]]} seed={seedOf('rh-a1')} stroke="var(--accent)" strokeWidth={2.2} />}
            {s.link === 'answer' && <SketchArrow points={[[208, 84], [432, 82]]} seed={seedOf('rh-a2')} stroke="var(--bad)" strokeWidth={2.2} />}
            {s.link === 'timer' && <SketchArrow points={[[208, 98], [432, 134]]} seed={seedOf('rh-a3')} stroke="var(--bad)" strokeWidth={2.2} />}
            {blocked && (
              <g>
                <SketchArrow points={[[208, 90], [320, 90]]} head="none" seed={seedOf('rh-a4')} stroke="var(--ok)" dashed />
                <HandText x={365} y={90} size={TEXT_SIZES.note} color="var(--ok)">
                  walled off
                </HandText>
              </g>
            )}
            <HandText x={360} y={196} size={TEXT_SIZES.note} color="var(--muted)">
              illustrative scores, 0 to 1
            </HandText>
            <Meter y={232} label="Reward" v={s.reward} tone={s.bad ? 'var(--warn)' : 'var(--ok)'} seed="rh-m1" />
            <Meter y={282} label="Real quality" v={s.real} tone={s.real === 0 ? 'var(--bad)' : 'var(--ok)'} seed="rh-m2" />
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
