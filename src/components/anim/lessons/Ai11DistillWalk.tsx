import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { STUDENT, TEACHER, overall } from './Ai11DistillLogic';

type S = 'match' | 'differs' | 'confident-wrong';

interface Step {
  caption: string;
  student: S[];
  focusRare?: boolean;
  showAverage?: boolean;
}

const PROMPTS = ['Where is my order?', 'Reset my password', 'Change my plan', 'Refund a late fee', 'Chargeback dispute (rare)'];

const steps: Step[] = [
  {
    caption:
      'Five support questions. The teacher is a large, expensive model. Its answers are the target. The student is a small, cheap model that has not been trained on them yet. It matches the teacher on 1 of 5. All examples here are illustrative.',
    student: ['match', 'differs', 'differs', 'differs', 'differs'],
  },
  {
    caption: 'After some training on the teacher\'s answers, the student matches on 3 of 5. The common questions come first, because the training data holds many of them.',
    student: ['match', 'match', 'match', 'differs', 'differs'],
  },
  {
    caption:
      'After full training the student matches on 4 of 5. It looks done. The last row is different. It is a rare question, and the training data had only a few like it. The student writes an answer in the teacher\'s tone, with the same confidence, but a wrong fact.',
    student: ['match', 'match', 'match', 'match', 'confident-wrong'],
  },
  {
    caption: `If most of your test questions are common ones, the average hides the problem. With the numbers from the lesson text (rare questions are 3% of traffic), the teacher scores ${(overall(TEACHER, 0.03) * 100).toFixed(1)}% overall and the student ${(overall(STUDENT, 0.03) * 100).toFixed(1)}%. That gap of 2.2 points looks small.`,
    student: ['match', 'match', 'match', 'match', 'confident-wrong'],
    showAverage: true,
  },
  {
    caption:
      'Score the rare slice on its own and the gap is 40 points (90% against 50%). The fix is not more training. The fix is a test set with enough rare questions to see this before you ship. The next sections show how many are enough.',
    student: ['match', 'match', 'match', 'match', 'confident-wrong'],
    focusRare: true,
  },
];

const ROW0 = 84;
const ROWH = 46;

export default function Ai11DistillWalk() {
  return (
    <AnimFrame title="Student copies the teacher: the average hides a rare failure" steps={steps} interval={6500}>
      {(_, s) => {
        const matches = s.student.filter((x) => x === 'match').length;
        return (
          <SketchSvg width={720} height={350} label={`Teacher and student answers on five questions. The student matches on ${matches} of 5.`}>
            <HandText x={24} y={36} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
              Question
            </HandText>
            <HandText x={470} y={36} size={TEXT_SIZES.heading} color="var(--muted)">
              Teacher
            </HandText>
            <HandText x={620} y={36} size={TEXT_SIZES.heading} color="var(--muted)">
              Student
            </HandText>
            {PROMPTS.map((p, i) => {
              const y = ROW0 + i * ROWH;
              const st = s.student[i];
              const tone = st === 'match' ? 'var(--ok)' : st === 'differs' ? 'var(--warn)' : 'var(--bad)';
              const rare = i === 4;
              const active = s.focusRare && rare;
              return (
                <g key={p}>
                  <HandText x={24} y={y} anchor="start" size={TEXT_SIZES.label} color={rare ? 'var(--accent)' : 'var(--fg)'}>
                    {p}
                  </HandText>
                  <SketchBox cx={470} cy={y} w={110} h={36} r={6} seed={seedOf(`dw-t${i}`)} stroke="var(--ok)" />
                  <HandText x={470} y={y} size={TEXT_SIZES.note}>
                    correct
                  </HandText>
                  <SketchBox cx={620} cy={y} w={130} h={36} r={6} seed={seedOf(`dw-s${i}${st}`)} stroke={tone} fill={tone} strokeWidth={active ? 2.2 : 1.4} />
                  <HandText x={620} y={y} size={TEXT_SIZES.note}>
                    {st === 'match' ? 'matches' : st === 'differs' ? 'differs' : 'wrong, sure'}
                  </HandText>
                </g>
              );
            })}
            <HandText x={24} y={326} anchor="start" size={TEXT_SIZES.label} mono color={s.showAverage ? 'var(--warn)' : 'var(--muted)'}>
              {s.showAverage ? `overall: teacher ${(overall(TEACHER, 0.03) * 100).toFixed(1)}%  student ${(overall(STUDENT, 0.03) * 100).toFixed(1)}%` : `student matches on ${matches} of 5`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
