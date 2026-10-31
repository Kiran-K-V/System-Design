import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

// Illustrative support-bot traces. Each card holds the note a reviewer wrote about the FIRST thing that went wrong.
type Group = 'doc' | 'invent' | 'refuse' | 'order';
const CARDS: { note: string; group: Group }[] = [
  { note: 'old refund page', group: 'doc' },
  { note: 'invented 30 days', group: 'invent' },
  { note: 'said "cannot help"', group: 'refuse' },
  { note: 'wrong order used', group: 'order' },
  { note: 'EU page for US', group: 'doc' },
  { note: 'invented a fee', group: 'invent' },
  { note: 'refused a refund', group: 'refuse' },
  { note: 'old return page', group: 'doc' },
  { note: 'ignored order id', group: 'order' },
  { note: 'made up a rule', group: 'invent' },
  { note: 'declined, no reason', group: 'refuse' },
  { note: 'old refund page', group: 'doc' },
];

const FINE: Record<Group, string> = { doc: 'Wrong document', invent: 'Invented rule', refuse: 'Over-refusal', order: 'Wrong order' };
const ORDER: Group[] = ['doc', 'invent', 'refuse', 'order'];
// Illustrative counts across all 40 failed traces.
const COUNTS: Record<Group, number> = { doc: 14, invent: 9, refuse: 10, order: 7 };

const W = 130;
const H = 40;
const COL_X = [120, 280, 440, 600];

type Phase = 'raw' | 'coarse' | 'fine' | 'bars' | 'act';
interface Step {
  caption: string;
  phase: Phase;
}

const steps: Step[] = [
  { caption: 'Twelve of the 40 failed traces. For each one, a reviewer read the whole conversation and wrote a short note on the first thing that went wrong. No categories exist yet. The notes are the raw material.', phase: 'raw' },
  { caption: 'Group notes that look alike. Seven notes about wrong or made-up policy fall into one pile. Three refusals form a second pile. Two order mix-ups form a third. This first grouping is rough.', phase: 'coarse' },
  { caption: 'Look inside the big pile. "Old refund page" means the system fetched the wrong document. "Invented 30 days" means the answer contained a rule that no document had. These two need different fixes, so split the pile. Now there are four groups.', phase: 'fine' },
  { caption: 'Label all 40 failed traces the same way and count each group. The counts are illustrative: 14, 10, 9, and 7 failures. Now you can see that the biggest single group is wrong documents, not the refusals people talked about most.', phase: 'bars' },
  { caption: 'Each count turns into an action. The largest group gets a fix first. A group that a program can check, such as the order id, gets a code check. A fuzzy group, such as over-refusal, gets a judge, which the Code Checks and LLM Judges lesson teaches.', phase: 'act' },
];

const coarseKey = (g: Group) => (g === 'doc' || g === 'invent' ? 'policy' : g);

function pos(phase: Phase, idx: number) {
  const g = CARDS[idx].group;
  if (phase === 'raw') return { x: COL_X[idx % 4], y: 130 + Math.floor(idx / 4) * 52 };
  if (phase === 'coarse') {
    const k = coarseKey(g);
    const n = CARDS.slice(0, idx).filter((c) => coarseKey(c.group) === k).length;
    if (k === 'policy') return { x: 120 + (n % 2) * 140, y: 130 + Math.floor(n / 2) * 52 };
    return { x: k === 'refuse' ? 440 : 600, y: 130 + n * 52 };
  }
  const n = CARDS.slice(0, idx).filter((c) => c.group === g).length;
  return { x: COL_X[ORDER.indexOf(g)], y: 130 + n * 52 };
}

export default function Ai8ErrCards() {
  return (
    <AnimFrame title="From raw notes to a ranked list of failures" steps={steps} interval={5600}>
      {(i, s) => {
        const showCards = s.phase === 'raw' || s.phase === 'coarse' || s.phase === 'fine';
        const max = 14;
        return (
          <SketchSvg width={720} height={330} label={`Step ${i + 1}: ${s.phase}`}>
            {showCards && (
              <>
                {s.phase === 'coarse' && (
                  <>
                    <HandText x={190} y={50} size={TEXT_SIZES.heading}>Wrong policy</HandText>
                    <HandText x={440} y={50} size={TEXT_SIZES.heading}>Refusal</HandText>
                    <HandText x={600} y={50} size={TEXT_SIZES.heading}>Order mix-up</HandText>
                  </>
                )}
                {s.phase === 'fine' && ORDER.map((g, n) => (
                  <HandText key={g} x={COL_X[n]} y={50} size={TEXT_SIZES.heading} color={g === 'doc' || g === 'invent' ? 'var(--accent)' : 'var(--fg)'}>{FINE[g]}</HandText>
                ))}
                {s.phase === 'raw' && (
                  <HandText x={360} y={50} size={TEXT_SIZES.heading} color="var(--muted)">One note per trace</HandText>
                )}
                {CARDS.map((c, idx) => {
                  const { x, y } = pos(s.phase, idx);
                  const split = s.phase === 'fine' && (c.group === 'doc' || c.group === 'invent');
                  return (
                    <g key={idx}>
                      <SketchBox cx={x} cy={y} w={W} h={H} r={8} seed={seedOf(`ec${idx}`)} stroke={split ? 'var(--accent)' : 'var(--fg)'} strokeWidth={split ? 2.2 : 1.4} fill={split ? 'var(--accent-soft)' : undefined} />
                      <HandText x={x} y={y} size={TEXT_SIZES.note}>{c.note}</HandText>
                    </g>
                  );
                })}
              </>
            )}
            {!showCards && (
              <>
                <HandText x={360} y={36} size={TEXT_SIZES.heading} color="var(--muted)">Failures by group, all 40 failed traces</HandText>
                {[...ORDER].sort((a, b) => COUNTS[b] - COUNTS[a]).map((g, n) => {
                  const y = 90 + n * 56;
                  const w = (COUNTS[g] / max) * 360;
                  const top = g === 'doc';
                  const tone = s.phase === 'act' && top ? 'var(--accent)' : 'var(--muted)';
                  return (
                    <g key={g}>
                      <HandText x={40} y={y} anchor="start" size={TEXT_SIZES.label}>{FINE[g]}</HandText>
                      <SketchBox cx={190 + w / 2} cy={y} w={w} h={30} r={6} seed={seedOf(`eb${g}`)} stroke={tone} fill={tone} strokeWidth={top ? 2.2 : 1.4} />
                      <HandText x={190 + w + 12} y={y} anchor="start" size={TEXT_SIZES.label} mono>{String(COUNTS[g])}</HandText>
                      {s.phase === 'act' && (
                        <HandText x={600} y={y} anchor="start" size={TEXT_SIZES.note} color="var(--fg)">
                          {g === 'doc' ? 'fix first' : g === 'invent' ? 'add a judge' : g === 'refuse' ? 'add a judge' : 'code check'}
                        </HandText>
                      )}
                    </g>
                  );
                })}
              </>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
