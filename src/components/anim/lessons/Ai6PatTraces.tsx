import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode } from '../FlowDiagram';
import { HandText, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Each trace is illustrative: a made-up failing case that shows how the loop reacts. */
interface Pat {
  title: string;
  caption: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  active: string;
  trace: string[];
}

const N = (id: string, x: number, y: number, label: string, sub?: string, extra: Partial<FlowNode> = {}): FlowNode => ({ id, x, y, w: 120, h: 60, label, sub, ...extra });

const PATS: Pat[] = [
  {
    title: 'ReAct',
    caption: 'ReAct: think, act, observe, repeat. The model writes a short thought, calls a tool, reads the observation, and thinks again. In this failing case the second search finds nothing. The thought step reads the empty observation and changes the query. The outside signal here is the tool result.',
    nodes: [N('t', 150, 90, 'Thought', 'LLM'), N('a', 360, 90, 'Act', 'tool call'), N('o', 360, 200, 'Observe', 'tool result'), N('f', 600, 90, 'Finish', undefined, { w: 100, h: 44 })],
    edges: [{ from: 't', to: 'a' }, { from: 'a', to: 'o' }, { from: 'o', to: 't', label: 'next thought', labelAt: [-20, 22] }, { from: 'a', to: 'f', dashed: true, tone: 'ok' }],
    active: 'o',
    trace: ['Thought: I need the capital of A, then its river.', 'Act: search("capital of A")      Obs: "B"', 'Act: search("river B")           Obs: no results', 'Thought: query too narrow, try the region.', 'Act: search("B geography")       Obs: "...river C"', 'Finish: C'],
  },
  {
    title: 'Critique loop',
    caption: 'Critique loop: Self-Refine, or evaluator-optimizer with two calls. A draft is critiqued and then revised. The failing case: the critic is the same model, it has no outside facts, and it says "looks good" about a draft that holds an invented number. The loop stops with the error inside.',
    nodes: [N('d', 130, 90, 'Draft', 'LLM'), N('c', 370, 90, 'Critique', 'LLM', { tone: 'warn' }), N('r', 370, 200, 'Refine', 'LLM'), N('f', 600, 90, 'Done', undefined, { w: 100, h: 44 })],
    edges: [{ from: 'd', to: 'c' }, { from: 'c', to: 'r', label: 'issues found', labelAt: [75, 0], bend: 26 }, { from: 'r', to: 'c', bend: 26 }, { from: 'c', to: 'f', label: 'looks good', labelAt: [0, -18], dashed: true }],
    active: 'c',
    trace: ['Draft: "Revenue grew 14% (up from 9%)."  <- 9% is invented', 'Critique (same model): "Clear and accurate. No changes."', 'Done. The wrong number ships. No outside signal caught it.'],
  },
  {
    title: 'Reflexion',
    caption: 'Reflexion: attempt, evaluate, write a reflection, retry with the reflection in memory. The evaluator is an outside signal, such as unit tests. In this failing case 2 of 5 tests fail, the model writes what it got wrong in words, and the next attempt reads that note and fixes it.',
    nodes: [N('a', 120, 90, 'Attempt', 'LLM'), N('e', 330, 90, 'Evaluate', 'run tests', { tone: 'bad' }), N('r', 540, 90, 'Reflect', 'LLM'), N('m', 330, 205, 'Memory', 'lessons', { shape: 'db', w: 140, h: 76 })],
    edges: [{ from: 'a', to: 'e' }, { from: 'e', to: 'r', label: '2 of 5 fail', labelAt: [0, -18] }, { from: 'r', to: 'm', label: 'write note', labelAt: [60, 10] }, { from: 'm', to: 'a', label: 'retry with note', labelAt: [-55, 12] }],
    active: 'e',
    trace: ['Attempt 1: tests 3 of 5 pass', 'Reflect: "I forgot empty input and a negative index."', 'Memory += that note', 'Attempt 2 (sees the note): tests 5 of 5 pass'],
  },
  {
    title: 'Generate, verify, fix',
    caption: 'Generate, verify, fix: run a check that is code, such as tests, a schema validator, or a linter, and feed its exact errors back. In this failing case the output is missing a required field. The error text names the field, so the fix is specific. The loop ends when the check passes or the cap hits.',
    nodes: [N('g', 130, 90, 'Generate', 'LLM'), N('v', 360, 90, 'Verify', 'code', { tone: 'bad' }), N('x', 360, 200, 'Fix', 'LLM'), N('f', 600, 90, 'Pass', undefined, { w: 100, h: 44, tone: 'ok' })],
    edges: [{ from: 'g', to: 'v' }, { from: 'v', to: 'x', label: 'exact errors', labelAt: [75, 0], bend: 26 }, { from: 'x', to: 'v', bend: 26 }, { from: 'v', to: 'f', label: 'pass', labelAt: [0, -18], dashed: true, tone: 'ok' }],
    active: 'v',
    trace: ['Generate: {"name": "Ada"}', 'Verify (schema): FAIL "email" is a required property', 'Fix: {"name": "Ada", "email": "ada@example.com"}', 'Verify (schema): PASS'],
  },
  {
    title: 'Plan, execute, replan',
    caption: 'Plan, execute, replan: write the steps first, run them one by one, and revise the remaining plan when a step fails. In this failing case step 3 hits a missing resource. The replanner changes steps 3 and 4 and the run goes on. The Planning lesson covers planning in depth.',
    nodes: [N('p', 120, 90, 'Plan', 'LLM'), N('x', 330, 90, 'Execute', 'one step'), N('c', 540, 90, 'Check', undefined, { tone: 'bad' }), N('r', 330, 200, 'Replan', 'LLM')],
    edges: [{ from: 'p', to: 'x' }, { from: 'x', to: 'c' }, { from: 'c', to: 'r', label: 'step failed', labelAt: [60, 6] }, { from: 'r', to: 'x', label: 'new steps', labelAt: [-48, 0] }],
    active: 'c',
    trace: ['Plan: 1 find file, 2 read it, 3 call API X, 4 write report', 'Steps 1 and 2 pass', 'Step 3 fails: API X returns 404', 'Replan: 3 call API Y instead, 4 write report', 'Steps 3 and 4 pass'],
  },
];

const ROWS: { name: string; signal: string; tone: string }[] = [
  { name: 'ReAct', signal: 'Tool observations', tone: 'var(--ok)' },
  { name: 'Critique loop', signal: 'The model\'s own opinion', tone: 'var(--warn)' },
  { name: 'Reflexion', signal: 'Tests, plus notes', tone: 'var(--ok)' },
  { name: 'Generate, verify, fix', signal: 'Code check, exact errors', tone: 'var(--ok)' },
  { name: 'Plan, execute, replan', signal: 'Step results', tone: 'var(--ok)' },
];

const steps = [...PATS.map((p) => ({ caption: p.caption })), { caption: 'Side by side, the loops differ in one thing that matters: where the signal to stop or to fix comes from. A critique loop with the same model as the judge has only its own opinion. The others take a signal from outside the model: a tool result, a test, or a step check. When a code check exists, it is the most reliable signal here, because it does not share the model\'s blind spots.' }];

export default function Ai6PatTraces() {
  return (
    <AnimFrame title="Five loop patterns, one failing case each" steps={steps} interval={7000}>
      {(i) => {
        if (i >= PATS.length) {
          return (
            <SketchSvg width={720} height={300} label="Where each loop gets its signal">
              <HandText x={40} y={24} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">Loop pattern</HandText>
              <HandText x={330} y={24} size={TEXT_SIZES.heading} anchor="start" color="var(--muted)">Where the signal comes from</HandText>
              {ROWS.map((r, k) => (
                <g key={r.name}>
                  <SketchBox cx={150} cy={66 + k * 50} w={220} h={40} r={6} seed={seedOf(`pn${k}`)} />
                  <HandText x={150} y={66 + k * 50} size={TEXT_SIZES.label}>{r.name}</HandText>
                  <SketchBox cx={500} cy={66 + k * 50} w={300} h={40} r={6} seed={seedOf(`ps${k}`)} stroke={r.tone} fill={r.tone} />
                  <HandText x={500} y={66 + k * 50} size={TEXT_SIZES.label}>{r.signal}</HandText>
                </g>
              ))}
            </SketchSvg>
          );
        }
        const p = PATS[i];
        return (
          <div>
            <FlowDiagram width={720} height={250} nodes={p.nodes} edges={p.edges} active={[p.active]} label={`${p.title} loop`} />
            <pre className="mx-3 mb-3 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-[12.5px] leading-relaxed">{p.trace.join('\n')}</pre>
            <p className="px-3 pb-2 text-xs text-muted">Trace is illustrative.</p>
          </div>
        );
      }}
    </AnimFrame>
  );
}
