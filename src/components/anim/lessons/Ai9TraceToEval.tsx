import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  active: number;
  count: number;
  detail: string[];
  failing?: boolean;
}

const BOXES = ['Trace store', 'Redact', 'Label', 'Eval set', 'Every change'];

const steps: Step[] = [
  { caption: 'A customer taps thumbs-down on an answer. The system flags that trace in the trace store. A flagged trace is the cheapest source of real failures you will ever get.', active: 0, count: 120, detail: ['Flagged trace: thumbs-down', 'Question: "How long do I have to return this?"'] },
  { caption: 'You open the trace and walk the spans. The tool returned "14 days". Model call 2 wrote "30 days". The failure is in the last model call, not in the tool.', active: 0, count: 120, detail: ['Tool result: return window 14 days', 'Model answer: "You have 30 days"'] },
  { caption: 'Before anything leaves the trace store, replace private data with placeholders: the customer name, email, and order number. The test case keeps the shape of the problem and drops the person.', active: 1, count: 120, detail: ['Order 8841 for J. Rao  becomes  Order <ORDER> for <NAME>', 'Rule: no real person in a test case'] },
  { caption: 'Write one plain sentence about what went wrong. This label groups many failures later, so you can fix a whole class at once instead of one example.', active: 2, count: 120, detail: ['Label: model ignored the tool result', 'and answered from memory'] },
  { caption: 'Add the case to the eval set. The set grows from 120 cases to 121. It now holds a real failure from production, with the expected answer: 14 days.', active: 3, count: 121, detail: ['Input: question + tool result', 'Expected: "14 days"'] },
  { caption: 'From now on, every prompt or model change runs all 121 cases. This one fails until someone fixes it. When it passes, it stays in the set and guards against the same bug coming back.', active: 4, count: 121, detail: ['Run on the current prompt: 120 pass, 1 fails', 'The failing case is the bug you just found'], failing: true },
];

const BW = 116;
const GAP = 24;
const X0 = 26 + BW / 2;

export default function Ai9TraceToEval() {
  return (
    <AnimFrame title="From a flagged trace to a test case" steps={steps} interval={4200}>
      {(_, s) => (
        <SketchSvg width={720} height={250} label="A flagged trace is redacted, labeled, and added to the eval set">
          {BOXES.map((b, i) => {
            const cx = X0 + i * (BW + GAP);
            const on = i === s.active;
            const done = i < s.active;
            const bad = on && s.failing;
            const tone = bad ? 'var(--bad)' : on ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--muted)';
            return (
              <g key={b}>
                <SketchBox cx={cx} cy={60} w={BW} h={44} r={8} seed={seedOf(`te9${i}`)} stroke={tone} fill={on ? tone : undefined} strokeWidth={on ? 2.2 : 1.4} dashed={!on && !done} />
                <HandText x={cx} y={60} size={TEXT_SIZES.label} color="var(--fg)">{b}</HandText>
                {i < BOXES.length - 1 && (
                  <SketchArrow points={[[cx + BW / 2 + 5, 60], [cx + BW / 2 + GAP - 5, 60]]} seed={seedOf(`tea9${i}`)} stroke={done ? 'var(--ok)' : 'var(--muted)'} />
                )}
              </g>
            );
          })}
          <HandText x={X0 + 3 * (BW + GAP)} y={104} size={TEXT_SIZES.label} mono color={s.count === 121 ? 'var(--ok)' : 'var(--muted)'}>
            {`${s.count} cases`}
          </HandText>
          <SketchBox cx={360} cy={178} w={640} h={76} r={8} seed={seedOf('te9card')} stroke="var(--border)" />
          {s.detail.map((line, k) => (
            <HandText key={k} x={52} y={156 + k * 44} size={TEXT_SIZES.label} anchor="start" mono color={k === 0 ? 'var(--fg)' : 'var(--muted)'}>
              {line}
            </HandText>
          ))}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
