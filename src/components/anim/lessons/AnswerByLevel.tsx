import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, seedOf } from '../sketch';

interface S {
  caption: string;
  level: string;
  color: string;
  lines: string[];
  note: string;
}

const steps: S[] = [
  { caption: 'The prompt is the same for everyone: how do you generate the short IDs? What separates answers is not the topic. It is how the person handles it.', level: 'Question', color: 'var(--muted)', lines: ['Teammate: "Design a URL shortener.', 'How do you generate the short IDs?"'], note: 'Same question at every level.' },
  { caption: 'A typical mid-level answer is correct and simple. Hashing works. It shows core knowledge. A reviewer will probably have to lead the next questions, such as collisions.', level: 'Mid-level answer', color: 'var(--accent)', lines: ['Hash the long URL with MD5. Keep the first 7 characters.', 'Store short ID to long URL in a database.', 'If the ID already exists, hash again with a salt.'], note: 'Review notes: works, fundamentals right. Did not raise collisions or scale.' },
  { caption: 'A typical senior answer finds the weakness in the first idea, uses numbers, and compares options without being asked. 62^7 is about 3.5 trillion, so 7 characters of base62 (a-z, A-Z, 0-9) are enough.', level: 'Senior answer', color: 'var(--ok)', lines: ['Hashing means collisions and a database check on every write.', 'Better: a counter, encoded in base62.', '7 characters give 62^7, about 3.5 trillion IDs.', 'One counter is a bottleneck. Give each app server a range.'], note: 'Review notes: names the flaw, gives numbers, compares, picks one.' },
  { caption: 'A typical staff answer ties the choice to constraints and risk, covers failure, and thinks about change over time. It also leads: it picks the next topic itself.', level: 'Staff answer', color: 'var(--purple)', lines: ['Pick by constraint: unique, short, and hard to guess?', 'Ranges come from a small coordination service. A lost range wastes IDs. That is fine.', 'Counters are guessable. For private links, scramble the bits.', 'Plan range-service outage, multi-region ranges, and migration.'], note: 'Review notes: frames the decision, covers failure and evolution, leads.' },
  { caption: 'Same topic, three depths. The facts did not change much. What changed is who finds the problems, how many are found, and how far the answer looks ahead.', level: 'Compare', color: 'var(--warn)', lines: ['Mid: one working design. A reviewer finds the gaps.', 'Senior: finds own gaps, compares, uses numbers.', 'Staff: frames by constraints, failure, and evolution.'], note: 'Typical expectations, not a formal rubric.' },
];

export default function AnswerByLevel() {
  return (
    <AnimFrame title="One question, three answers" steps={steps}>
      {(i, s) => (
        <SketchSvg width={720} height={330} label={`${s.level}: ${s.lines.join(' ')}`}>
          {steps.slice(1, 4).map((x, k) => (
            <g key={x.level}>
              <SketchBox cx={100 + k * 260} cy={34} w={160} h={36} r={18} seed={seedOf('tab' + k)} stroke={x.color} strokeWidth={i === k + 1 ? 2.6 : 1.1} fill={i === k + 1 ? x.color : undefined} />
              <HandText x={100 + k * 260} y={35} size={15} halo weight={i === k + 1 ? 700 : 400} color={i === k + 1 ? 'var(--fg)' : 'var(--muted)'}>{['Mid-level', 'Senior', 'Staff'][k]}</HandText>
            </g>
          ))}
          <SketchBox cx={360} cy={160} w={680} h={170} r={16} seed={seedOf('bubble' + i)} stroke={s.color} strokeWidth={2} />
          <HandText x={360} y={160} size={16} lineHeight={1.5}>{s.lines.join('\n')}</HandText>
          <SketchBox cx={360} cy={288} w={680} h={44} r={12} dashed seed={seedOf('note' + i)} stroke="var(--muted)" />
          <HandText x={360} y={289} size={14} color="var(--muted)">{s.note}</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
