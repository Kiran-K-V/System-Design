import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowNode, type FlowEdge, type FlowGroup, type FlowPacket, type Tone } from '../FlowDiagram';
import { callCost } from './Ai13CodeBudgetMath';

/**
 * One agent loop with a failing test and a retry, and two sandbox checks.
 * The run is ILLUSTRATIVE. Context sizes and dollars come from the lesson budget model (Sonnet 5.5, warm cache).
 */

const START = 20_000;
const GROWTH = 2_500;

function ctxAt(call: number): number {
  return call === 0 ? 0 : START + GROWTH * (call - 1);
}
const costTo: number[] = [0];
for (let k = 1; k <= 9; k++) {
  costTo[k] = costTo[k - 1] + callCost({ model: 'sonnet', cached: true, prefix: ctxAt(k - 1), delta: k === 1 ? START : GROWTH, out: 600 });
}

const nodes: FlowNode[] = [
  { id: 'agent', x: 90, y: 190, w: 120, label: 'Agent loop', sub: 'model + history' },
  { id: 'guard', x: 270, y: 190, w: 120, label: 'Boundary', sub: 'checks each call' },
  { id: 'repo', x: 470, y: 118, w: 130, label: 'Repo files', sub: 'src/dates.py' },
  { id: 'tests', x: 470, y: 282, w: 130, label: 'Test run', sub: 'pytest' },
  { id: 'home', x: 640, y: 118, w: 110, label: 'Home dir', sub: '~/.bashrc' },
  { id: 'net', x: 640, y: 282, w: 110, label: 'Network', sub: 'proxy' },
];

const edges: FlowEdge[] = [
  { from: 'agent', to: 'guard', head: 'both' },
  { from: 'guard', to: 'repo' },
  { from: 'guard', to: 'tests' },
  { from: 'guard', to: 'home', dashed: true, bend: -40 },
  { from: 'guard', to: 'net', dashed: true, bend: 40 },
];

const groups: FlowGroup[] = [{ x: 380, y: 40, w: 175, h: 300, label: 'Sandbox: the repo clone' }];

interface S {
  caption: string;
  call: number;
  attempts: number;
  active: string[];
  tones: Record<string, Tone>;
  packets?: FlowPacket[];
  line: string;
}

const steps: S[] = [
  { call: 0, attempts: 0, active: ['agent'], tones: { tests: 'bad' }, line: 'Goal: make test_parse_date pass', caption: 'The task: one test is red. The loop starts with the goal and the failing test name. Counters on this picture come from the lesson cost model: 20,000 tokens at the first call, then 2,500 more per call, Sonnet 5.5, warm cache (illustrative run).' },
  { call: 1, attempts: 0, active: ['repo'], tones: { tests: 'bad' }, packets: [{ from: 'guard', to: 'repo', label: 'grep' }], line: 'Gather: grep, read the test', caption: 'Gather context. The agent greps for parse_date and reads the test and the function. The boundary allows reads inside the clone. No index is needed for a search that small.' },
  { call: 2, attempts: 1, active: ['repo'], tones: { repo: 'ok', tests: 'bad' }, packets: [{ from: 'guard', to: 'repo', label: 'write', tone: 'ok' }], line: 'Act: edit src/dates.py', caption: 'Act. The agent edits one function. The path is inside the clone, so the boundary lets the write through. This is attempt 1.' },
  { call: 3, attempts: 1, active: ['tests'], tones: { repo: 'ok', tests: 'bad' }, packets: [{ from: 'guard', to: 'tests', label: 'pytest' }], line: 'Verify: 1 failed (assert in test_parse_date)', caption: 'Verify. The tests run and one fails with the message "expected ValueError for 2024-02-30". The harness sends back only the failing assertion and a few lines, not the whole log.' },
  { call: 4, attempts: 1, active: ['guard'], tones: { guard: 'bad', home: 'bad', tests: 'bad' }, packets: [{ from: 'guard', to: 'home', label: 'write', tone: 'bad' }], line: 'Blocked: write outside the repo', caption: 'The agent guesses the failure is a timezone issue and tries to add TZ=UTC to ~/.bashrc. That path is outside the clone, so the boundary blocks it. The block comes back as an error result, and no person is asked.' },
  { call: 5, attempts: 1, active: ['guard'], tones: { guard: 'bad', net: 'bad', tests: 'bad' }, packets: [{ from: 'guard', to: 'net', label: 'pip', tone: 'bad' }], line: 'Blocked: host not on the allow list', caption: 'It tries to install a date library from an unknown host. The proxy checks the host against the allow list and refuses. Two blocked calls cost two calls of tokens, but they cost no damage.' },
  { call: 6, attempts: 1, active: ['net'], tones: { net: 'ok', tests: 'bad' }, packets: [{ from: 'guard', to: 'net', label: 'pip', tone: 'ok' }], line: 'Allowed: package mirror on the list', caption: 'The agent reads the error text and uses the approved package mirror instead. The allow list passes it. The agent adapted to the wall. This is why a block returns a clear error, not a silent failure.' },
  { call: 7, attempts: 2, active: ['repo'], tones: { repo: 'ok', tests: 'bad' }, packets: [{ from: 'guard', to: 'repo', label: 'write', tone: 'ok' }], line: 'Act again: attempt 2', caption: 'Retry. The agent fixes the test inside the repo by setting the date explicitly in the code under test. This is attempt 2. A retry cap would count it. A no-progress check would see a different failure than before, so it would not fire.' },
  { call: 8, attempts: 2, active: ['tests'], tones: { repo: 'ok', tests: 'ok' }, packets: [{ from: 'guard', to: 'tests', label: 'pytest', tone: 'ok' }], line: 'Verify: all tests pass', caption: 'Verify again. The suite is green. The pass is the signal that lets the loop end. The tests are the reward, so a weak test means a weak reward.' },
  { call: 9, attempts: 2, active: ['agent'], tones: { repo: 'ok', tests: 'ok' }, line: 'Stop: no tool call, summary written', caption: 'The model replies with text and no tool call, so the loop stops. Nine calls and about 18 cents in this illustrative run. A stuck run would not stop here, which is why the next widget exists.' },
];

const money = (n: number) => `$${n.toFixed(3)}`;

export default function Ai13CodeLoop() {
  return (
    <AnimFrame title="One run: gather, act, verify, retry, with a boundary" steps={steps} interval={3600}>
      {(i, s) => {
        const shown: FlowNode[] = nodes.map((n) => ({ ...n, tone: s.tones[n.id] }));
        const notes = [
          { x: 24, y: 24, text: s.line, size: 16, tone: 'accent' as Tone },
          { x: 24, y: 376, text: `call ${s.call} · context ${(ctxAt(s.call) / 1000).toFixed(1)}k tokens · ${money(costTo[s.call])} so far · attempt ${s.attempts}`, size: 14 },
        ];
        return (
          <FlowDiagram
            width={720}
            height={400}
            nodes={shown}
            edges={edges}
            groups={groups}
            notes={notes}
            active={s.active}
            packets={s.packets}
            stepKey={i}
            label="One coding agent run with a failing test, a retry, and two blocked calls at the sandbox boundary"
          />
        );
      }}
    </AnimFrame>
  );
}
