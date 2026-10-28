import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { credit, teamDraft } from './AiE1AbLogic';

const A = ['P', 'Q', 'R', 'S'];
const B = ['Q', 'T', 'P', 'U'];
const MERGED = teamDraft(A, B, ['A', 'B'], 4);
const CLICKED = [1, 2];
const TALLY = credit(MERGED, CLICKED);

interface Step {
  caption: string;
  picks: number;
  clicks: boolean;
  active: number | null;
}

const steps: Step[] = [
  {
    caption:
      'Two rankers order the same four videos for one user. Ranker A is the current model. Ranker B is the new one. A/B testing would give this user only one list. Interleaving shows a mix of both.',
    picks: 0,
    clicks: false,
    active: null,
  },
  {
    caption: 'Round 1. A coin flip says A picks first. A takes its top video, P, and puts it in slot 1. Slot 1 now belongs to team A.',
    picks: 1,
    clicks: false,
    active: 0,
  },
  {
    caption: 'B picks next. Its top video is Q, which is not used yet. Q goes to slot 2, team B.',
    picks: 2,
    clicks: false,
    active: 1,
  },
  {
    caption: 'Round 2. A new coin flip says B picks first. B skips Q (used) and takes T. Slot 3 is team B.',
    picks: 3,
    clicks: false,
    active: 2,
  },
  {
    caption: 'A picks. It skips P and Q (used) and takes R. Slot 4 is team A. The user sees the merged list P, Q, T, R and cannot tell which ranker supplied which.',
    picks: 4,
    clicks: false,
    active: 3,
  },
  {
    caption: `The user clicks slots 2 and 3. Both came from team B. Credit goes to the ranker that supplied the clicked video: B ${TALLY.B}, A ${TALLY.A}. One session is one small vote for B. Over many sessions, the share of votes tells which ranker users prefer.`,
    picks: 4,
    clicks: true,
    active: null,
  },
];

const SLOT_X = [150, 270, 390, 510];

export default function AiE1AbInterleave() {
  return (
    <AnimFrame title="Interleaving: one user judges two rankers" steps={steps} interval={6000}>
      {(_, s) => (
        <SketchSvg width={720} height={290} label="Two ranked lists are merged into one list by alternate picks. Clicks are credited to the ranker that supplied the clicked item.">
          <HandText x={24} y={34} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
            Ranker A
          </HandText>
          {A.map((t, i) => (
            <SketchBox key={t} cx={SLOT_X[i]} cy={34} w={56} h={44} r={8} seed={seedOf(`il-a${i}`)} stroke="var(--muted)" />
          ))}
          {A.map((t, i) => (
            <HandText key={`at${t}`} x={SLOT_X[i]} y={35} size={TEXT_SIZES.label}>
              {t}
            </HandText>
          ))}
          <HandText x={24} y={100} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
            Ranker B
          </HandText>
          {B.map((t, i) => (
            <SketchBox key={`b${t}`} cx={SLOT_X[i]} cy={100} w={56} h={44} r={8} seed={seedOf(`il-b${i}`)} stroke="var(--muted)" />
          ))}
          {B.map((t, i) => (
            <HandText key={`bt${t}`} x={SLOT_X[i]} y={101} size={TEXT_SIZES.label}>
              {t}
            </HandText>
          ))}
          <HandText x={24} y={206} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
            User sees
          </HandText>
          {SLOT_X.map((x, i) => {
            const filled = i < s.picks;
            const slot = MERGED[i];
            const clicked = s.clicks && CLICKED.includes(i);
            return (
              <g key={i}>
                <SketchBox
                  cx={x}
                  cy={206}
                  w={56}
                  h={60}
                  r={8}
                  seed={seedOf(`il-m${i}`)}
                  dashed={!filled}
                  stroke={clicked ? 'var(--ok)' : s.active === i ? 'var(--accent)' : 'var(--muted)'}
                  fill={clicked ? 'var(--ok)' : s.active === i ? 'var(--accent)' : undefined}
                />
                {filled && (
                  <HandText x={x} y={206} size={TEXT_SIZES.label} color={s.active === i ? 'var(--accent)' : 'var(--fg)'}>
                    {`${slot.item}\n${slot.team}`}
                  </HandText>
                )}
              </g>
            );
          })}
          {s.clicks && (
            <>
              <SketchArrow points={[[270, 262], [270, 246]]} seed={seedOf('il-c1')} stroke="var(--ok)" />
              <SketchArrow points={[[390, 262], [390, 246]]} seed={seedOf('il-c2')} stroke="var(--ok)" />
              <HandText x={600} y={206} anchor="start" size={TEXT_SIZES.label} color="var(--ok)">
                {`B ${TALLY.B}, A ${TALLY.A}`}
              </HandText>
            </>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
