import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** One illustrative agent run. Checkpoint rules follow the Claude Code checkpoints docs: one checkpoint per prompt that starts a turn, none for a message typed mid-turn. */
type Lane = 0 | 1 | 2;
interface Ev {
  lane: Lane;
  label: string;
  caption: string;
  tone?: 'warn' | 'bad';
}

const LANES = ['You', 'Agent', 'Checkpoints'];
const LY = [60, 150, 240];

const EVENTS: Ev[] = [
  { lane: 0, label: 'Prompt', caption: 'The user sends a prompt: "Add rate limiting to the API". The run starts.' },
  { lane: 2, label: 'C1', caption: 'A checkpoint C1 is saved before the turn starts. In Claude Code, each prompt that starts a turn creates one. C1 holds the files as they are now.' },
  { lane: 1, label: 'Plan', caption: 'The agent streams a plan first: a short list of steps. The user can see where the run is going before any file changes. Anthropic\'s agent guide says to prioritize transparency by explicitly showing the planning steps.' },
  { lane: 1, label: 'Edit 1', caption: 'A step event appears: "Editing limiter.py". The user sees live progress, so a long run does not look frozen. A file changes on disk.' },
  { lane: 0, label: 'Steer', tone: 'warn', caption: 'The user notices the agent picked an in-memory counter. They type "use Redis" while the run is going. This is steering. The message is queued and read before the turn ends. It gets no checkpoint of its own.' },
  { lane: 1, label: 'Edit 2', caption: 'The agent reads the new message and edits again. Both edits count toward C1, the checkpoint of the prompt that started the turn.' },
  { lane: 1, label: 'Tests', tone: 'bad', caption: 'The tests fail. The UI shows a failure state with the error, not a spinner. The user decides this path is wrong.' },
  { lane: 0, label: 'Rewind', caption: 'The user opens rewind (in Claude Code: /rewind, or Esc twice on an empty prompt) and picks C1. Options include restore code and conversation, restore conversation only, and restore code only.' },
  { lane: 1, label: 'Retry', caption: 'The code is back to C1. The two edits are undone and shown struck through. The prompt is back in the input box to edit and send again. Limit: rewind does not track files changed by Bash commands, so those edits need git.' },
];

const X0 = 66;
const DX = 74;
const xOf = (i: number) => X0 + i * DX;

export default function Ai7UxTimeline() {
  const steps = EVENTS.map((e) => ({ caption: e.caption }));
  return (
    <AnimFrame title="One agent run with a steer and a rewind" steps={steps} interval={4800}>
      {(i) => {
        const rewound = i >= 7;
        return (
          <SketchSvg width={720} height={300} label="Timeline of an agent run">
            {LANES.map((l, k) => (
              <g key={l}>
                <HandText x={12} y={LY[k] - 36} size={14} anchor="start" color="var(--muted)">
                  {l}
                </HandText>
                <SketchArrow points={[[10, LY[k] + 30], [710, LY[k] + 30]]} head="none" dashed stroke="var(--muted)" strokeWidth={1} seed={seedOf(`lane${k}`)} />
              </g>
            ))}
            {rewound && (
              <SketchArrow
                points={[[xOf(7), LY[0] + 26], [xOf(7) - 10, LY[2]], [xOf(1) + 40, LY[2]]]}
                stroke="var(--accent)"
                strokeWidth={2.2}
                seed={seedOf('rewind-arrow')}
              />
            )}
            {EVENTS.slice(0, i + 1).map((e, k) => {
              const active = k === i;
              const undone = rewound && (k === 3 || k === 5);
              const stroke = active ? 'var(--accent)' : e.tone === 'bad' ? 'var(--bad)' : e.tone === 'warn' ? 'var(--warn)' : 'var(--fg)';
              return (
                <g key={k} opacity={undone ? 0.5 : 1}>
                  <SketchBox cx={xOf(k)} cy={LY[e.lane]} w={68} h={44} r={8} seed={seedOf(`ev${k}`)} stroke={stroke} strokeWidth={active ? 2.2 : 1.4} dashed={undone} fill={e.lane === 2 ? 'var(--accent-soft)' : 'var(--bg)'} />
                  <HandText x={xOf(k)} y={LY[e.lane]} size={16} color={undone ? 'var(--muted)' : stroke}>
                    {e.label}
                  </HandText>
                  {undone && <SketchArrow points={[[xOf(k) - 30, LY[e.lane]], [xOf(k) + 30, LY[e.lane]]]} head="none" stroke="var(--bad)" seed={seedOf(`strike${k}`)} />}
                </g>
              );
            })}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
