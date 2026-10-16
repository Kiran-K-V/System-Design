import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode } from '../FlowDiagram';

/** Pattern names and shapes follow Anthropic, Building effective agents. Node labels are generic. */
interface Pat {
  title: string;
  caption: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  active: string;
  note: string;
}

const io = (id: string, x: number, y: number, label: string): FlowNode => ({ id, x, y, w: 84, h: 44, label });

const PATS: Pat[] = [
  {
    title: 'Prompt chaining',
    caption: 'Prompt chaining. The task splits into fixed steps. Each model call handles the output of the one before. Between steps, plain code runs a gate: a check that the output is on track. If the gate fails, the run stops early. You trade latency for accuracy, because each call has an easier job.',
    nodes: [io('in', 55, 90, 'Input'), { id: 'c1', x: 175, y: 90, w: 100, h: 60, label: 'Call 1', sub: 'LLM' }, { id: 'g', x: 305, y: 90, w: 90, h: 60, label: 'Gate', sub: 'code' }, { id: 'c2', x: 465, y: 90, w: 100, h: 60, label: 'Call 2', sub: 'LLM' }, io('out', 610, 90, 'Output'), { id: 'x', x: 305, y: 200, w: 90, h: 44, label: 'Stop', tone: 'bad' }],
    edges: [{ from: 'in', to: 'c1' }, { from: 'c1', to: 'g' }, { from: 'g', to: 'c2', label: 'pass', labelAt: [0, -20] }, { from: 'c2', to: 'out' }, { from: 'g', to: 'x', label: 'fail', labelAt: [24, 0], dashed: true, tone: 'bad' }],
    active: 'g',
    note: 'Fixed order. Code decides the path.',
  },
  {
    title: 'Routing',
    caption: 'Routing. A first call classifies the input. Code then sends it to one specialist path. Each path has its own prompt, and it can use a different model. Anthropic\'s example sends easy questions to a small model and hard ones to a larger one. Without routing, tuning for one kind of input can hurt another.',
    nodes: [io('in', 60, 130, 'Input'), { id: 'r', x: 200, y: 130, w: 110, h: 60, label: 'Router', sub: 'LLM' }, { id: 'a', x: 390, y: 50, w: 150, h: 44, label: 'Small model' }, { id: 'b', x: 390, y: 130, w: 150, h: 44, label: 'Refund prompt' }, { id: 'c', x: 390, y: 210, w: 150, h: 44, label: 'Large model' }, io('out', 620, 130, 'Output')],
    edges: [{ from: 'in', to: 'r' }, { from: 'r', to: 'a', labelAt: [0, 0] }, { from: 'r', to: 'b' }, { from: 'r', to: 'c' }, { from: 'a', to: 'out' }, { from: 'b', to: 'out' }, { from: 'c', to: 'out' }],
    active: 'r',
    note: 'One branch runs for each input.',
  },
  {
    title: 'Parallelization',
    caption: 'Parallelization. Independent calls run at the same time and code merges the outputs. Sectioning gives each call a different subtask. Voting runs the same task several times and takes the majority. Latency is the slowest call, not the sum. Cost is the sum.',
    nodes: [io('in', 60, 130, 'Input'), { id: 'a', x: 280, y: 50, w: 150, h: 44, label: 'Call A' }, { id: 'b', x: 280, y: 130, w: 150, h: 44, label: 'Call B' }, { id: 'c', x: 280, y: 210, w: 150, h: 44, label: 'Call C' }, { id: 'm', x: 500, y: 130, w: 110, h: 60, label: 'Merge', sub: 'code' }, io('out', 650, 130, 'Output')],
    edges: [{ from: 'in', to: 'a' }, { from: 'in', to: 'b' }, { from: 'in', to: 'c' }, { from: 'a', to: 'm' }, { from: 'b', to: 'm' }, { from: 'c', to: 'm' }, { from: 'm', to: 'out' }],
    active: 'm',
    note: 'Calls do not depend on each other.',
  },
  {
    title: 'Orchestrator-workers',
    caption: 'Orchestrator-workers. A central model reads the task and decides the subtasks at run time. The number of workers is not fixed. It could be 2 or 12, depending on the input. The orchestrator then merges their results. This differs from parallelization, where you wrote the subtasks in advance.',
    nodes: [io('in', 55, 130, 'Input'), { id: 'o', x: 195, y: 130, w: 130, h: 60, label: 'Orchestrator', sub: 'plans at run time' }, { id: 'a', x: 385, y: 50, w: 120, h: 44, label: 'Worker 1', shape: 'dashed' }, { id: 'b', x: 385, y: 130, w: 120, h: 44, label: 'Worker 2', shape: 'dashed' }, { id: 'c', x: 385, y: 210, w: 120, h: 44, label: 'Worker n', shape: 'dashed' }, { id: 's', x: 535, y: 130, w: 90, h: 60, label: 'Merge', sub: 'LLM' }, io('out', 665, 130, 'Output')],
    edges: [{ from: 'in', to: 'o' }, { from: 'o', to: 'a' }, { from: 'o', to: 'b' }, { from: 'o', to: 'c' }, { from: 'a', to: 's' }, { from: 'b', to: 's' }, { from: 'c', to: 's' }, { from: 's', to: 'out' }],
    active: 'o',
    note: 'Used when you cannot predict the subtasks, such as which files a change touches.',
  },
  {
    title: 'Evaluator-optimizer',
    caption: 'Evaluator-optimizer. One call writes a draft. A second call judges it against clear criteria and sends feedback. The first call revises. The loop ends when the evaluator passes the draft or a round cap hits. It fits when feedback measurably improves the output and the model can give that feedback.',
    nodes: [io('in', 60, 90, 'Input'), { id: 'g', x: 220, y: 90, w: 130, h: 60, label: 'Generate', sub: 'LLM' }, { id: 'e', x: 430, y: 90, w: 130, h: 60, label: 'Evaluate', sub: 'LLM' }, io('out', 620, 90, 'Output')],
    edges: [{ from: 'in', to: 'g' }, { from: 'g', to: 'e' }, { from: 'e', to: 'out', label: 'meets bar', labelAt: [0, -18], tone: 'ok' }, { from: 'e', to: 'g', label: 'feedback', labelAt: [0, 20], bend: 55, tone: 'warn' }],
    active: 'e',
    note: 'Always set a round cap. Without one this loop can run forever.',
  },
  {
    title: 'Autonomous agent',
    caption: 'Autonomous agent. No fixed path. The model picks the next tool from what it sees, and it decides when it is done. This is the loop from lesson A6.1. Anthropic says agents suit open-ended problems where the number of steps is hard to predict, and that they bring higher cost and compounding errors. Budgets are required.',
    nodes: [io('in', 60, 120, 'Goal'), { id: 'm', x: 230, y: 120, w: 140, h: 60, label: 'Model', sub: 'picks next step' }, { id: 't', x: 430, y: 120, w: 120, h: 60, label: 'Tools' }, io('out', 645, 120, 'Answer')],
    edges: [{ from: 'in', to: 'm' }, { from: 'm', to: 't', label: 'tool_use', labelAt: [0, -18] }, { from: 't', to: 'm', label: 'result', labelAt: [0, 20], bend: 50 }, { from: 't', to: 'out', label: 'model stops', labelAt: [-14, -24], dashed: true, tone: 'ok' }],
    active: 'm',
    note: 'The model controls the path. You control the budget.',
  },
];

export default function Ai6FlowPatterns() {
  const steps = PATS.map((p) => ({ caption: p.caption }));
  return (
    <AnimFrame title="Five workflow patterns, then the agent" steps={steps} interval={6000}>
      {(i) => {
        const p = PATS[i];
        return (
          <div>
            <FlowDiagram
              width={720}
              height={270}
              nodes={p.nodes}
              edges={p.edges}
              active={[p.active]}
              notes={[{ x: 360, y: 258, text: `${p.title}: ${p.note}`, anchor: 'middle' }]}
              label={`${p.title} pattern`}
            />
          </div>
        );
      }}
    </AnimFrame>
  );
}
