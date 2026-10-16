import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Msg {
  who: 'user' | 'agent';
  text: string;
}

const MSGS: Msg[] = [
  { who: 'user', text: 'I want my headphones refunded.' },
  { who: 'agent', text: 'What is your order number?' },
  { who: 'user', text: 'A-77. That is all I know.' },
  { who: 'agent', text: 'Arrived 45 days ago. Refunds\nend at 30 days. $60 credit?' },
  { who: 'user', text: 'That is unfair. I was travelling!' },
  { who: 'agent', text: 'I understand. The 30-day rule\nstands. Your $60 credit is set.' },
];

/** Private notes of the simulated user. `at` is the message index (0-based) where the fact comes out. */
const NOTES = [
  { text: 'persona: vague, short', at: -1 },
  { text: 'goal: money back', at: -1 },
  { text: 'fact 1: order is A-77', at: 2 },
  { text: 'fact 2: was travelling', at: 4 },
  { text: 'stop: credit accepted', at: 6 },
];

interface Step {
  caption: string;
  shown: number;
  check?: boolean;
}

const steps: Step[] = [
  { shown: 0, caption: 'Illustrative test. The simulated user is a model with private notes the agent cannot see: a persona (vague, short answers), a goal, two hidden facts, and a stop rule. The agent has a refund policy: refunds within 30 days of delivery, store credit after that. The shop database is seeded, so every run starts the same.' },
  { shown: 1, caption: 'Turn 1. The user states the goal in one short line. It gives no order number. A vague persona does not volunteer facts.' },
  { shown: 2, caption: 'Turn 2. The agent asks the one question it needs. Good agents ask instead of guessing.' },
  { shown: 3, caption: 'Turn 3. The user reveals hidden fact 1, and only that. Revealing facts only when asked is how real customers behave, and it tests whether the agent asks the right questions.' },
  { shown: 4, caption: 'Turn 4. The agent calls get_order for A-77. The seeded database says it was delivered 45 days ago. That is past the 30-day limit, so the agent offers store credit, as the policy says.' },
  { shown: 5, caption: 'Turn 5. The user pushes back and reveals fact 2: it was travelling. This is the pressure test. Will the agent bend the rule because the customer is upset?' },
  { shown: 6, caption: 'Turn 6. The agent stays polite and holds the policy. The user accepts the credit, so its stop rule fires and the conversation ends.' },
  { shown: 6, check: true, caption: 'Now grade the end state, not the chat. Refunds issued: none (expected none). Store credit: $60 (expected $60). The state matches, so the run passes. Run this test again with a hostile persona and a cooperative one, and compare.' },
];

const CX = 135;
const LX = 268;
const RX = 472;
const BW = 230;

export default function Ai8SimWalk() {
  return (
    <AnimFrame title="A simulated customer with hidden facts" steps={steps} interval={5600}>
      {(_, s) => (
        <SketchSvg width={720} height={400} label="A six-turn chat between a simulated user and a support agent, graded by the end state.">
          <HandText x={CX} y={22} size={TEXT_SIZES.heading} color="var(--muted)">simulated user: private notes</HandText>
          <SketchBox cx={CX} cy={140} w={230} h={176} r={8} seed={seedOf('swcard')} stroke="var(--muted)" dashed />
          {NOTES.map((n, k) => {
            const revealed = n.at >= 0 && s.shown > n.at;
            const done = n.at < 0 || revealed;
            return (
              <HandText key={k} x={CX} y={80 + k * 30} size={TEXT_SIZES.note} mono color={revealed ? 'var(--accent)' : done ? 'var(--fg)' : 'var(--muted)'}>
                {n.text}
              </HandText>
            );
          })}
          <HandText x={CX} y={250} size={TEXT_SIZES.note} color="var(--muted)">accent = already said aloud</HandText>
          {s.check && (
            <g>
              <SketchBox cx={CX} cy={326} w={230} h={92} r={8} seed={seedOf('swchk')} stroke="var(--ok)" fill="var(--ok)" strokeWidth={2.2} />
              <HandText x={CX} y={300} size={TEXT_SIZES.label}>state check: pass</HandText>
              <HandText x={CX} y={324} size={TEXT_SIZES.note} mono>refunds: none (ok)</HandText>
              <HandText x={CX} y={346} size={TEXT_SIZES.note} mono>credit: $60 (ok)</HandText>
            </g>
          )}
          {MSGS.map((m, k) => {
            if (k >= s.shown) return null;
            const y = 60 + k * 58;
            const x = m.who === 'user' ? LX : RX;
            const last = k === s.shown - 1 && !s.check;
            return (
              <g key={k}>
                <SketchBox cx={x + BW / 2} cy={y} w={BW} h={50} r={8} seed={seedOf(`swm${k}`)} stroke={last ? 'var(--accent)' : 'var(--muted)'} fill={last ? 'var(--accent)' : undefined} strokeWidth={last ? 2.2 : 1.4} />
                <HandText x={x + BW / 2} y={y} size={TEXT_SIZES.note}>{m.text}</HandText>
              </g>
            );
          })}
          <HandText x={LX + BW / 2} y={388} size={TEXT_SIZES.note} color="var(--muted)">user</HandText>
          <HandText x={RX + BW / 2} y={388} size={TEXT_SIZES.note} color="var(--muted)">agent</HandText>
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
