import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type Tone } from '../FlowDiagram';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Illustrative run: a coding agent fixes a failing test. Tool names are made up. The cap of 6 is an example. */
interface Cell {
  label: string;
  tone: Tone;
}

interface Step {
  caption: string;
  active: string;
  hist: string;
  tools?: Tone;
  stop?: { tone: Tone; sub: string };
  cells: Cell[];
  note: string;
}

const A: Tone = 'accent';
const OK: Tone = 'ok';
const BAD: Tone = 'bad';

const steps: Step[] = [
  {
    caption: 'The user gives the agent a goal: fix a failing test. The loop is plain code. It calls the model, runs the tools the model asks for, and calls the model again. The history starts with one message.',
    active: 'goal',
    hist: '1 message',
    cells: [],
    note: 'Illustrative cap: max_turns = 6',
  },
  {
    caption: 'Turn 1. Your code calls the model with the history and the tool definitions. The model replies with a tool_use block for search_code. The stop reason is tool_use, so the loop goes on.',
    active: 'model',
    hist: '1 message',
    cells: [{ label: '1 search_code', tone: A }],
    note: 'Turns used: 1 of 6',
  },
  {
    caption: 'Your code runs search_code and appends the result to the history. The next model call resends the whole history, so the context grows every turn.',
    active: 'tools',
    hist: '3 messages',
    cells: [{ label: '1 search_code', tone: OK }],
    note: 'Turns used: 1 of 6',
  },
  {
    caption: 'Turn 2. The model asks for read_file and it works. The shape is the same each time: the model asks, your code runs, the result is appended, the history is longer.',
    active: 'hist',
    hist: '5 messages',
    cells: [
      { label: '1 search_code', tone: OK },
      { label: '2 read_file', tone: OK },
    ],
    note: 'Turns used: 2 of 6',
  },
  {
    caption: 'Turn 3. The model asks for run_tests. The tool times out. Your code does not throw. It appends a tool_result with is_error set to true and the error text, so the model can see what happened.',
    active: 'tools',
    tools: BAD,
    hist: '7 messages',
    cells: [
      { label: '1 search_code', tone: OK },
      { label: '2 read_file', tone: OK },
      { label: '3 run_tests', tone: BAD },
    ],
    note: 'Turns used: 3 of 6',
  },
  {
    caption: 'Turn 4. The model reads the error and retries run_tests on one test file. A retry is a new model call, so it uses a turn. Each failed tool call spends budget even though no progress was made.',
    active: 'model',
    hist: '7 messages',
    cells: [
      { label: '1 search_code', tone: OK },
      { label: '2 read_file', tone: OK },
      { label: '3 run_tests', tone: BAD },
      { label: '4 run_tests', tone: A },
    ],
    note: 'Turns used: 4 of 6',
  },
  {
    caption: 'The retry passes. The model replies with text and no tool_use block, and the stop reason is end_turn. The loop exits. This run used 4 tool turns plus one last model call.',
    active: 'stop',
    stop: { tone: OK, sub: 'end_turn' },
    hist: '11 messages',
    cells: [
      { label: '1 search_code', tone: OK },
      { label: '2 read_file', tone: OK },
      { label: '3 run_tests', tone: BAD },
      { label: '4 run_tests', tone: OK },
      { label: '5 answer', tone: OK },
    ],
    note: 'Stopped by the model',
  },
  {
    caption: 'Now the bad day. The tool keeps failing and the model keeps retrying. With no cap, the only exit is the model choosing to stop. With a cap of 6, your code stops the loop at turn 6 and returns what it has. The Claude Agent SDK calls this result error_max_turns.',
    active: 'stop',
    stop: { tone: BAD, sub: 'cap hit' },
    hist: '15 messages',
    cells: [
      { label: '1 search_code', tone: OK },
      { label: '2 read_file', tone: OK },
      { label: '3 run_tests', tone: BAD },
      { label: '4 run_tests', tone: BAD },
      { label: '5 run_tests', tone: BAD },
      { label: '6 run_tests', tone: BAD },
    ],
    note: 'Stopped by your code: 6 of 6',
  },
];

const EDGES: FlowEdge[] = [
  { from: 'goal', to: 'model' },
  { from: 'model', to: 'tools', label: 'tool_use', labelAt: [0, -16] },
  { from: 'tools', to: 'hist', label: 'result', labelAt: [38, -4] },
  { from: 'hist', to: 'model', label: 'resend all', labelAt: [-34, 4] },
  { from: 'model', to: 'stop', label: 'no tool_use', labelAt: [-46, -6], dashed: true },
];

const CELL_W = 104;
const GAP = 10;
const X0 = 36;

export default function Ai6LoopWalk() {
  return (
    <AnimFrame title="One agent run, with a failing tool" steps={steps} interval={4600}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'goal', x: 80, y: 60, w: 110, h: 54, label: 'Goal' },
          { id: 'model', x: 290, y: 60, w: 150, h: 60, label: 'Model call' },
          { id: 'tools', x: 560, y: 60, w: 150, h: 60, label: 'Run tools', tone: s.tools },
          { id: 'hist', x: 425, y: 180, w: 170, h: 60, label: 'History', sub: s.hist },
          { id: 'stop', x: 130, y: 180, w: 150, h: 60, label: 'Stop', sub: s.stop?.sub ?? '', tone: s.stop?.tone },
        ];
        return (
          <div>
            <FlowDiagram width={720} height={240} nodes={nodes} edges={EDGES} active={[s.active]} label="Agent loop: model call, run tools, append to history, repeat" />
            <SketchSvg width={720} height={110} label="Turn log">
              <HandText x={X0} y={16} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">
                {s.note}
              </HandText>
              {Array.from({ length: 6 }, (_, k) => {
                const c = s.cells[k];
                const cx = X0 + CELL_W / 2 + k * (CELL_W + GAP);
                return (
                  <g key={k}>
                    <SketchBox cx={cx} cy={62} w={CELL_W} h={44} r={6} seed={seedOf(`lw${k}`)} dashed={!c} stroke={c ? `var(--${c.tone === 'accent' ? 'accent' : c.tone})` : 'var(--muted)'} fill={c ? `var(--${c.tone === 'accent' ? 'accent' : c.tone})` : undefined} />
                    <HandText x={cx} y={62} size={TEXT_SIZES.note} color={c ? 'var(--fg)' : 'var(--muted)'}>
                      {c ? c.label : `turn ${k + 1}`}
                    </HandText>
                  </g>
                );
              })}
            </SketchSvg>
          </div>
        );
      }}
    </AnimFrame>
  );
}
