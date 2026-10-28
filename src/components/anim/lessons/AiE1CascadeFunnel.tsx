import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** The recommendation cascade as a funnel. Counts and latencies are illustrative. */

interface Row {
  name: string;
  count: string;
  ms: string;
  note: string;
}

const ROWS: Row[] = [
  { name: 'Whole catalogue', count: 'millions', ms: '', note: 'every item' },
  { name: 'Candidate generation', count: '~1,000', ms: '15 ms', note: 'two towers + ANN' },
  { name: 'Ranker', count: '~100', ms: '40 ms', note: 'heavy model' },
  { name: 'Re-rank', count: '~10', ms: '5 ms', note: 'policy, diversity' },
];

interface Step {
  caption: string;
  active: number;
  /** Rows that are visible. */
  upto: number;
  budget?: boolean;
}

const steps: Step[] = [
  {
    caption: 'The catalogue holds millions of items. A good model reads rich features for each (user, item) pair. Running that model on every item for every request would take far longer than a user will wait.',
    active: 0,
    upto: 0,
  },
  {
    caption: 'Stage 1, candidate generation. A cheap model picks about a thousand items that might fit. It is cheap because item vectors were computed ahead of time and the search only compares vectors. It is allowed to be rough. Its job is to not miss good items.',
    active: 1,
    upto: 1,
  },
  {
    caption: 'Stage 2, the ranker. Now only about a thousand items remain, so a heavy model can read many features per pair, such as the user history, item statistics and context. It scores each one and keeps the best hundred or so.',
    active: 2,
    upto: 2,
  },
  {
    caption: 'Stage 3, re-rank. Rules that are not about taste are applied here: do not show ten videos from one creator, drop items the user hid, mix in fresh items. About ten items go to the screen.',
    active: 3,
    upto: 3,
  },
  {
    caption: 'The budget view. Each stage costs more per item and sees fewer items. Latencies are illustrative. Together the stages and the network time must fit the request budget, here 100 ms. If the ranker gets slower, you must send it fewer candidates, and stage 1 then has to be better.',
    active: -1,
    upto: 3,
    budget: true,
  },
];

const CX = 240;
const WIDTHS = [440, 320, 200, 110];
const Y0 = 70;
const GAP = 78;

export default function AiE1CascadeFunnel() {
  return (
    <AnimFrame title="From millions of items to ten" steps={steps} interval={6500}>
      {(_, s) => (
        <SketchSvg width={720} height={380} label="A funnel with four stages: the whole catalogue, candidate generation, ranker and re-rank.">
          {ROWS.map((r, i) => {
            if (i > s.upto) return null;
            const y = Y0 + i * GAP;
            const on = s.active === i;
            return (
              <g key={r.name}>
                <SketchBox
                  cx={CX}
                  cy={y}
                  w={WIDTHS[i]}
                  h={56}
                  r={8}
                  seed={seedOf(`fun-${i}`)}
                  stroke={on ? 'var(--accent)' : s.budget ? 'var(--ok)' : 'var(--muted)'}
                  fill={on ? 'var(--accent-soft)' : undefined}
                  strokeWidth={on ? 2.2 : 1.4}
                />
                <HandText x={CX} y={y} size={TEXT_SIZES.label} mono color={on ? 'var(--accent)' : 'var(--fg)'}>
                  {r.count}
                </HandText>
                <HandText x={490} y={y - 10} anchor="start" size={TEXT_SIZES.label} color={on ? 'var(--accent)' : 'var(--fg)'}>
                  {r.name}
                </HandText>
                <HandText x={490} y={y + 12} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">
                  {s.budget && r.ms ? `${r.ms} (illustrative)` : r.note}
                </HandText>
              </g>
            );
          })}
          {s.budget && (
            <HandText x={24} y={352} anchor="start" size={TEXT_SIZES.label} mono color="var(--ok)">
              All stages together fit inside the 100 ms budget
            </HandText>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
