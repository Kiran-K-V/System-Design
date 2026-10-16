import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { visualTokens } from './Ai7CuMath';

const SHOT = visualTokens(1280, 800); // 46 x 29 = 1,334
const SEC_PER_TURN = 5; // illustrative: no source gives latency per step

type Who = 'app' | 'claude' | 'screen';
interface Step {
  caption: string;
  /** Screenshots now in the context window. */
  shots: number;
  /** Elapsed model turns. */
  turns: number;
  /** Screenshots sent over all calls so far (the sum of images in each call). */
  billed: number;
  from: Who;
  to: Who;
  label: string;
}

const X: Record<Who, number> = { app: 110, claude: 360, screen: 610 };

const steps: Step[] = [
  {
    caption: `Your app starts the loop. It sends the task ("find the status of order 4417"), the computer tool, and a first screenshot. At 1280x800 the page's formula, ceil(1280/28) x ceil(800/28) = 46 x 29, gives ${SHOT.toLocaleString('en-US')} visual tokens. The docs say roughly 1,000 to 1,800 per screenshot.`,
    shots: 1,
    turns: 0,
    billed: 1,
    from: 'app',
    to: 'claude',
    label: 'task + screenshot 1',
  },
  {
    caption: 'Claude looks at the pixels and replies with a tool_use block: left_click at (640, 120), the search box. The reply has stop_reason "tool_use". Claude did not click anything. It wrote an action for your app to run.',
    shots: 1,
    turns: 1,
    billed: 1,
    from: 'claude',
    to: 'app',
    label: 'left_click (640, 120)',
  },
  {
    caption: 'Your app runs the click on the virtual display. The coordinates are in the pixel space of the screenshots you returned, origin at the top left. If you shrank the screenshot, you must scale the point back up first. Unscaled coordinates make clicks land off to one side.',
    shots: 1,
    turns: 1,
    billed: 1,
    from: 'app',
    to: 'screen',
    label: 'click, then wait',
  },
  {
    caption: `Your app takes screenshot 2 and sends it back as the tool_result. The API is stateless, so screenshot 1 is sent again with it. Context holds 2 images, ${(2 * SHOT).toLocaleString('en-US')} image tokens on this call. Every later call carries one more.`,
    shots: 2,
    turns: 1,
    billed: 3,
    from: 'app',
    to: 'claude',
    label: 'tool_result: screenshot 2',
  },
  {
    caption: `Claude replied with a type action for "4417" plus Enter. Your app ran it and sent screenshot 3, so call 3 carries 3 images. Image tokens sent so far over the three calls: 1 + 2 + 3 = 6 images, ${(6 * SHOT).toLocaleString('en-US')} tokens. The total grows with the square of the steps unless you prune old screenshots.`,
    shots: 3,
    turns: 2,
    billed: 6,
    from: 'app',
    to: 'claude',
    label: 'type + screenshot 3',
  },
  {
    caption: `Claude reads "Shipped" on screen and replies with text and no tool calls. That ends the loop. 3 model calls and 2 actions, about ${3 * SEC_PER_TURN} s at an illustrative ${SEC_PER_TURN} s per turn. A real task can run for many more turns, and each turn can fail.`,
    shots: 3,
    turns: 3,
    billed: 6,
    from: 'claude',
    to: 'app',
    label: 'text: "Shipped"',
  },
];

const NAMES: Record<Who, string> = { app: 'Your app', claude: 'Claude API', screen: 'Screen (VM)' };

export default function Ai7CuLoop() {
  return (
    <AnimFrame title="The screenshot and action loop" steps={steps} interval={5200}>
      {(i, s) => {
        const billed = s.billed;
        const done = i === steps.length - 1;
        return (
          <SketchSvg width={720} height={330} label={`Step ${i + 1}: ${s.label}`}>
            {(Object.keys(X) as Who[]).map((w) => {
              const active = w === s.from || w === s.to;
              return (
                <g key={w}>
                  <SketchBox cx={X[w]} cy={70} w={150} h={52} r={8} seed={seedOf(`cu-${w}`)} stroke={active ? 'var(--accent)' : 'var(--muted)'} strokeWidth={active ? 2.2 : 1.4} fill={active ? 'var(--accent-soft)' : undefined} />
                  <HandText x={X[w]} y={70} size={TEXT_SIZES.label} color={active ? 'var(--fg)' : 'var(--muted)'}>{NAMES[w]}</HandText>
                </g>
              );
            })}
            {(() => {
              const a = X[s.from];
              const b = X[s.to];
              const dir = b > a ? 1 : -1;
              const y = 138;
              return (
                <g>
                  <SketchArrow points={[[a + dir * 20, y], [b - dir * 20, y]]} seed={seedOf(`cu-arrow-${i}`)} stroke={done ? 'var(--ok)' : 'var(--accent)'} strokeWidth={2.2} />
                  <HandText x={(a + b) / 2} y={y - 16} size={TEXT_SIZES.label} color={done ? 'var(--ok)' : 'var(--accent)'}>{s.label}</HandText>
                </g>
              );
            })()}
            <HandText x={30} y={196} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">screenshots in context (each ~1,334 tokens at 1280x800)</HandText>
            {[0, 1, 2].map((c) => {
              const filled = c < s.shots;
              return (
                <g key={c}>
                  <SketchBox cx={80 + c * 110} cy={236} w={90} h={44} r={8} seed={seedOf(`cu-shot${c}`)} stroke={filled ? 'var(--ok)' : 'var(--muted)'} fill={filled ? 'var(--ok)' : undefined} dashed={!filled} />
                  <HandText x={80 + c * 110} y={236} size={TEXT_SIZES.label} color={filled ? 'var(--fg)' : 'var(--muted)'}>{`shot ${c + 1}`}</HandText>
                </g>
              );
            })}
            <HandText x={400} y={222} anchor="start" size={TEXT_SIZES.label} mono color="var(--fg)">{`this call: ${(s.shots * SHOT).toLocaleString('en-US')} tok`}</HandText>
            <HandText x={400} y={250} anchor="start" size={TEXT_SIZES.label} mono color="var(--warn)">{`all calls: ${(billed * SHOT).toLocaleString('en-US')} tok`}</HandText>
            <HandText x={360} y={304} size={TEXT_SIZES.note} mono color="var(--muted)">{`elapsed ${s.turns * SEC_PER_TURN} s (illustrative, ${SEC_PER_TURN} s per turn)`}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
