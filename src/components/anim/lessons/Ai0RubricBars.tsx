import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

const CLASSIC = ['Problem navigation', 'Data, features, labels', 'Model design', 'Integration and eval', 'Communication'];
const NEW = ['Quality bar', 'Eval plan', 'Cost per request', 'Risk and failure modes'];

/** Illustrative scores 0 to 4 per level. Not taken from any company rubric. */
const CLASSIC_SCORES = [
  [2, 2, 3, 1, 2],
  [3, 3, 3, 3, 3],
  [4, 3, 3, 4, 4],
];
const NEW_SCORES = [
  [1, 1, 1, 0],
  [3, 3, 2, 2],
  [4, 4, 4, 4],
];
const LEVELS = ['mid', 'senior', 'staff'];

interface Step {
  caption: string;
  level: number;
  showNew: boolean;
  /** Show filled new bars. */
  fillNew: boolean;
}

const steps: Step[] = [
  {
    caption:
      'Hello Interview lists five areas that applied ML design interviews score. These are the classic axes: problem navigation, data and labels, model design, integration and evaluation, and communication. Bars show an illustrative mid-level answer.',
    level: 0,
    showNew: false,
    fillNew: false,
  },
  {
    caption:
      'A GenAI interview adds four axes in practice: a quality bar, an eval plan, cost per request, and risk. They are drawn dashed and empty. A strong backend answer, with no model in it, scores nothing on them.',
    level: 0,
    showNew: true,
    fillNew: false,
  },
  {
    caption: 'Mid level (illustrative). The candidate draws a sound pipeline and names a model. Quality is "it should be accurate". Cost and risk are mostly missing.',
    level: 0,
    showNew: true,
    fillNew: true,
  },
  {
    caption: 'Senior (illustrative). The candidate states a number for quality, sketches a golden set, gives a rough cost per request, and names two failure modes.',
    level: 1,
    showNew: true,
    fillNew: true,
  },
  {
    caption:
      'Staff (illustrative). Eval comes first and drives every design choice. Budgets carry numbers, failure modes have rates and a human fallback, and the rollout has gates. The four new axes are where staff answers separate from the rest.',
    level: 2,
    showNew: true,
    fillNew: true,
  },
];

const LABEL_X = 230;
const BAR_X = 250;
const UNIT = 100;
const ROW = 36;
const TOP = 66;

export default function Ai0RubricBars() {
  return (
    <AnimFrame title="Scoring axes: classic ML versus GenAI" steps={steps}>
      {(_, s) => {
        const classic = CLASSIC_SCORES[s.level];
        const nw = NEW_SCORES[s.level];
        const newTop = TOP + CLASSIC.length * ROW + 40;
        return (
          <SketchSvg width={720} height={newTop + NEW.length * ROW + 10} label="Rubric bars for classic and new scoring axes">
            <HandText x={BAR_X - 10} y={26} size={TEXT_SIZES.title} anchor="start">
              {`Level: ${LEVELS[s.level]}`}
            </HandText>
            <HandText x={BAR_X + 4 * UNIT} y={26} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">
              illustrative scores, 0 to 4
            </HandText>
            <HandText x={24} y={TOP - 24} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">
              Classic ML areas
            </HandText>
            {CLASSIC.map((label, i) => {
              const y = TOP + i * ROW;
              const w = Math.max(classic[i] * UNIT, 8);
              return (
                <g key={label}>
                  <HandText x={LABEL_X} y={y} size={TEXT_SIZES.label} anchor="end">
                    {label}
                  </HandText>
                  <SketchBox cx={BAR_X + w / 2} cy={y} w={w} h={22} r={6} seed={seedOf(`c${i}`)} stroke="var(--ok)" fill="var(--ok)" />
                </g>
              );
            })}
            {s.showNew && (
              <g>
                <HandText x={24} y={newTop - 26} size={TEXT_SIZES.heading} anchor="start" color="var(--accent)">
                  New axes for GenAI
                </HandText>
                {NEW.map((label, i) => {
                  const y = newTop + i * ROW;
                  const w = Math.max(nw[i] * UNIT, 8);
                  return (
                    <g key={label}>
                      <HandText x={LABEL_X} y={y} size={TEXT_SIZES.label} anchor="end" color="var(--accent)">
                        {label}
                      </HandText>
                      {s.fillNew ? (
                        <SketchBox cx={BAR_X + w / 2} cy={y} w={w} h={22} r={6} seed={seedOf(`n${i}`)} stroke="var(--accent)" fill="var(--accent)" />
                      ) : (
                        <SketchBox cx={BAR_X + 2 * UNIT} cy={y} w={4 * UNIT} h={22} r={6} seed={seedOf(`nd${i}`)} stroke="var(--accent)" dashed />
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
