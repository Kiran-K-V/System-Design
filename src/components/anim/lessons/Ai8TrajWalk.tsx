import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  text?: boolean;
  state?: boolean;
  mark?: boolean;
  score?: boolean;
}

const CALLS = ['find_user\njane', 'get_order\n#1042', 'read_policy', 'refund\n$80', 'reply to\nuser'];
const BAD = 3;
const X0 = 76;
const GAP = 142;

const steps: Step[] = [
  { caption: 'Illustrative refund agent. Policy: refund only within 30 days of delivery. Order #1042 arrived 45 days ago. The agent runs five steps: it finds the user, gets the order, reads the policy, issues an $80 refund, and replies. This list of steps is the trajectory.' },
  { text: true, caption: 'Grade only the final text. The reply says "Your refund is on its way." A text check for the word "refund" passes. The run looks fine, and a dashboard of text checks would show green.' },
  { text: true, state: true, caption: 'Now grade the state. The expected end state is no refund on #1042 and a store credit instead. The database holds an $80 refund row. The state check fails. The text lied: the outcome is what is in the database.' },
  { text: true, state: true, mark: true, caption: 'Walk the steps. Steps 1 to 3 are fine, and the agent even read the policy. Step 4 is the first bad step: it refunded anyway. The reply in step 5 only reports it. A trajectory lets you fix step 4, not guess.' },
  { text: true, state: true, mark: true, score: true, caption: 'Grade four things. Outcome: fail (wrong state). Steps: 1 of 5 wrong. Efficiency: 5 calls, which is fine here. Safety: fail, because the agent took a forbidden action. Outcome comes first. The step grades explain why.' },
];

export default function Ai8TrajWalk() {
  return (
    <AnimFrame title="A run graded by text, then by state" steps={steps} interval={5600}>
      {(i, s) => (
        <SketchSvg width={720} height={340} label="A five-step agent run. The final text looks right, but the database state is wrong at step 4.">
          {CALLS.map((c, k) => {
            const cx = X0 + k * GAP;
            const bad = s.mark && k === BAD;
            const ok = s.mark && k < BAD;
            const tone = bad ? 'var(--bad)' : ok ? 'var(--ok)' : i === 0 ? 'var(--accent)' : 'var(--muted)';
            return (
              <g key={k}>
                <HandText x={cx} y={30} size={TEXT_SIZES.note} color="var(--muted)">{`step ${k + 1}`}</HandText>
                <SketchBox cx={cx} cy={76} w={118} h={60} r={8} seed={seedOf(`tw${k}`)} stroke={tone} fill={bad || ok ? tone : undefined} strokeWidth={bad ? 2.2 : 1.4} />
                <HandText x={cx} y={76} size={TEXT_SIZES.label} mono>{c}</HandText>
                {k < CALLS.length - 1 && <SketchArrow points={[[cx + 64, 76], [cx + GAP - 64, 76]]} seed={seedOf(`twa${k}`)} stroke="var(--muted)" />}
              </g>
            );
          })}
          {s.mark && (
            <HandText x={X0 + BAD * GAP} y={132} size={TEXT_SIZES.note} color="var(--bad)">first bad step</HandText>
          )}
          {s.text && (
            <g>
              <SketchBox cx={190} cy={188} w={300} h={44} r={8} seed={seedOf('twt')} stroke={s.state ? 'var(--ok)' : 'var(--accent)'} fill={s.state ? 'var(--ok)' : undefined} strokeWidth={s.state ? 1.4 : 2.2} />
              <HandText x={190} y={188} size={TEXT_SIZES.label}>text check: pass</HandText>
              <HandText x={360} y={188} anchor="start" size={TEXT_SIZES.note} color="var(--muted)" mono>reply contains "refund"</HandText>
            </g>
          )}
          {s.state && (
            <g>
              <SketchBox cx={190} cy={244} w={300} h={44} r={8} seed={seedOf('tws')} stroke="var(--bad)" fill="var(--bad)" strokeWidth={s.mark ? 1.4 : 2.2} />
              <HandText x={190} y={244} size={TEXT_SIZES.label}>state check: fail</HandText>
              <HandText x={360} y={244} anchor="start" size={TEXT_SIZES.note} color="var(--muted)" mono>refunds[#1042] = $80, want none</HandText>
            </g>
          )}
          {s.score && (
            <g>
              {[
                ['outcome', 'fail', 'var(--bad)'],
                ['steps', '1 of 5 wrong', 'var(--warn)'],
                ['efficiency', '5 calls', 'var(--ok)'],
                ['safety', 'fail', 'var(--bad)'],
              ].map(([n, v, t], k) => (
                <g key={n}>
                  <SketchBox cx={90 + k * 180} cy={308} w={160} h={44} r={8} seed={seedOf(`tws${k}`)} stroke={t} fill={t} strokeWidth={k === 0 ? 2.2 : 1.4} />
                  <HandText x={90 + k * 180} y={308} size={TEXT_SIZES.note} color="var(--fg)">{`${n}: ${v}`}</HandText>
                </g>
              ))}
            </g>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
