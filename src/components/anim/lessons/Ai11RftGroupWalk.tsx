import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { advantages } from './Ai11RftLogic';

type Row = 'answer' | 'reward' | 'advantage';

interface Step {
  caption: string;
  prompt: string;
  answers: string[];
  rewards: number[];
  show: Row[];
  active: Row | 'prompt' | 'none';
}

const EASY = ['408', '418', '398', '408'];
const EASY_R = [1, 0, 0, 1];
const HARD = ['1061', '1071', '1091', '1051'];
const HARD_R = [0, 0, 0, 0];

const steps: Step[] = [
  {
    caption:
      'One prompt: "What is 17 x 24?" A checker program knows the right answer, 408. We ask the model to answer the same prompt 4 times. Each time it picks its words by chance, so the answers can differ. These 4 answers are one group.',
    prompt: 'What is 17 x 24?  (right answer: 408)',
    answers: EASY,
    rewards: EASY_R,
    show: [],
    active: 'prompt',
  },
  {
    caption: 'The model writes 4 answers: 408, 418, 398 and 408. Nobody has judged them yet.',
    prompt: 'What is 17 x 24?  (right answer: 408)',
    answers: EASY,
    rewards: EASY_R,
    show: ['answer'],
    active: 'answer',
  },
  {
    caption: 'The checker scores each answer. Right is 1, wrong is 0. This score is the reward. No person and no second model is involved.',
    prompt: 'What is 17 x 24?  (right answer: 408)',
    answers: EASY,
    rewards: EASY_R,
    show: ['answer', 'reward'],
    active: 'reward',
  },
  {
    caption:
      'Now compare each answer with its own group. The group average is 0.5. The typical spread around it is also 0.5. The advantage is (reward - average) / spread. The two right answers get +1. The two wrong answers get -1. The advantage says how much better than its siblings an answer was.',
    prompt: 'What is 17 x 24?  (right answer: 408)',
    answers: EASY,
    rewards: EASY_R,
    show: ['answer', 'reward', 'advantage'],
    active: 'advantage',
  },
  {
    caption:
      'The update. The words of the answers with +1 become a bit more likely. The words of the answers with -1 become a bit less likely. The model repeats this over thousands of prompts. It learns what its own better answers had in common.',
    prompt: 'What is 17 x 24?  (right answer: 408)',
    answers: EASY,
    rewards: EASY_R,
    show: ['answer', 'reward', 'advantage'],
    active: 'none',
  },
  {
    caption:
      'A harder prompt: "What is 23 x 47?" (right answer: 1081). All 4 answers are wrong. All rewards are 0, so the average is 0 and the spread is 0. Every advantage is 0. The group teaches nothing. A prompt the model always fails (or always passes) is wasted work.',
    prompt: 'What is 23 x 47?  (right answer: 1081)',
    answers: HARD,
    rewards: HARD_R,
    show: ['answer', 'reward', 'advantage'],
    active: 'advantage',
  },
];

const COLS = [220, 350, 480, 610];
const ROWS: { key: Row; y: number; label: string }[] = [
  { key: 'answer', y: 130, label: 'Answer' },
  { key: 'reward', y: 190, label: 'Reward' },
  { key: 'advantage', y: 250, label: 'Advantage' },
];

export default function Ai11RftGroupWalk() {
  return (
    <AnimFrame title="One group of 4 answers: from checker score to advantage" steps={steps} interval={6000}>
      {(_, s) => {
        const a = advantages(s.rewards);
        return (
          <SketchSvg width={720} height={290} label="A group of four answers, each scored by a checker, then compared with the group average">
            <SketchBox cx={360} cy={40} w={440} h={44} r={8} seed={seedOf('rg-prompt')} stroke={s.active === 'prompt' ? 'var(--accent)' : 'var(--muted)'} strokeWidth={s.active === 'prompt' ? 2.2 : 1.4} />
            <HandText x={360} y={40} size={TEXT_SIZES.label} mono>
              {s.prompt}
            </HandText>
            {ROWS.map((r) => (
              <HandText key={r.key} x={24} y={r.y} anchor="start" size={TEXT_SIZES.label} color={s.show.includes(r.key) ? 'var(--fg)' : 'var(--muted)'}>
                {r.label}
              </HandText>
            ))}
            {COLS.map((cx, i) =>
              ROWS.map((r) => {
                if (!s.show.includes(r.key)) return <SketchBox key={`${r.key}${i}`} cx={cx} cy={r.y} w={100} h={44} r={8} seed={seedOf(`rg-e${r.key}${i}`)} stroke="var(--muted)" dashed />;
                const on = s.active === r.key;
                let text = s.answers[i];
                let tone = 'var(--muted)';
                if (r.key === 'reward') {
                  text = String(s.rewards[i]);
                  tone = s.rewards[i] === 1 ? 'var(--ok)' : 'var(--bad)';
                } else if (r.key === 'advantage') {
                  const v = a.adv[i];
                  text = (v > 0 ? '+' : '') + v.toFixed(0);
                  tone = v > 0 ? 'var(--ok)' : v < 0 ? 'var(--bad)' : 'var(--muted)';
                } else {
                  tone = s.show.includes('reward') ? (s.rewards[i] === 1 ? 'var(--ok)' : 'var(--bad)') : 'var(--accent)';
                }
                return (
                  <g key={`${r.key}${i}`}>
                    <SketchBox cx={cx} cy={r.y} w={100} h={44} r={8} seed={seedOf(`rg-${r.key}${i}`)} stroke={tone} fill={on ? tone : undefined} strokeWidth={on ? 2.2 : 1.4} />
                    <HandText x={cx} y={r.y} size={TEXT_SIZES.label} mono>
                      {text}
                    </HandText>
                  </g>
                );
              }),
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
