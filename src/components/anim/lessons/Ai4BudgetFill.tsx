import AnimFrame from '../AnimFrame';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** A 200K window filling at 6K tokens per turn. Round numbers for a ballpark: no system prompt, no tools, no reply reserve. */
const WINDOW = 200000;
const PER = 6000;
const X0 = 30;
const W = 660;
const CELL = (PER / WINDOW) * W; // 19.8 px per turn

interface Step {
  caption: string;
  turn: number;
}
const steps: Step[] = [
  { turn: 0, caption: 'The window is empty. It holds 200,000 tokens. Each turn adds about 6,000: the user message, the model reply, and any tool results. That is a rough figure for an agent that reads files.' },
  { turn: 10, caption: 'After 10 turns the history is 60,000 tokens, 30% of the window. The model still reads all of it on every call, so each call is bigger than the last.' },
  { turn: 20, caption: 'After 20 turns: 120,000 tokens, 60%. A quality drop from long input (context rot) may already show here, well before the window is full. It is gradual, not a cliff.' },
  { turn: 30, caption: 'After 30 turns: 180,000 tokens, 90%. Three more turns fit. A real run has a system prompt and tools in front of the history, so it would stop sooner.' },
  { turn: 33, caption: 'Turn 33 brings the total to 198,000. Turns until full = 200,000 / 6,000 = 33.3, so 33. The window is 99% full. Only 2,000 tokens are left, not enough for the next turn.' },
  { turn: 34, caption: 'Turn 34 would need 204,000 tokens. Anthropic\'s docs say that when the input alone exceeds the window, the API returns a 400 error ("prompt is too long"). The design must act before this point: trim, clear, or compact.' },
];

export default function Ai4BudgetFill() {
  return (
    <AnimFrame title="A conversation fills the window" steps={steps} interval={3600}>
      {(i, s) => {
        const tokens = s.turn * PER;
        const over = tokens > WINDOW;
        const tone = over ? 'var(--bad)' : s.turn >= 30 ? 'var(--warn)' : 'var(--accent)';
        const shown = Math.min(s.turn, 33);
        return (
          <SketchSvg width={720} height={220} label={`Step ${i + 1}: ${s.turn} turns`}>
            <HandText x={X0} y={24} anchor="start" size={TEXT_SIZES.heading}>
              {`Turn ${s.turn}`}
            </HandText>
            <HandText x={X0 + W} y={24} anchor="end" size={TEXT_SIZES.label} mono color={tone}>
              {`${tokens.toLocaleString('en-US')} / ${WINDOW.toLocaleString('en-US')}`}
            </HandText>
            <SketchBox cx={X0 + W / 2} cy={90} w={W + 8} h={64} r={8} seed={seedOf('bf-frame')} stroke="var(--muted)" />
            {Array.from({ length: shown }, (_, n) => (
              <SketchBox key={n} cx={X0 + CELL * n + CELL / 2} cy={90} w={CELL - 3} h={50} r={6} seed={seedOf(`bf-${n}`)} fill={tone} stroke={tone} />
            ))}
            <HandText x={X0} y={150} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">
              {over ? 'Next turn does not fit' : `${(WINDOW - tokens).toLocaleString('en-US')} tokens left`}
            </HandText>
            <HandText x={X0} y={185} anchor="start" size={TEXT_SIZES.label} color={tone}>
              {over ? 'API error 400: prompt is too long' : `${Math.round((tokens / WINDOW) * 100)}% full`}
            </HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
