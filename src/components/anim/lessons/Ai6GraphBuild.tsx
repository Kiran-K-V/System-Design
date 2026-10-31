import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode, type FlowNote } from '../FlowDiagram';

/** The agent graph is built in the shape of LangGraph's StateGraph: state, nodes, fixed edges, a conditional edge. */
interface Step {
  caption: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  notes: FlowNote[];
  active: string[];
}

const START = (x: number, y: number): FlowNode => ({ id: 'start', x, y, w: 80, h: 44, label: 'START' });
const END = (x: number, y: number): FlowNode => ({ id: 'end', x, y, w: 80, h: 44, label: 'END' });
const AGENT: FlowNode = { id: 'agent', x: 230, y: 110, w: 120, h: 60, label: 'agent', sub: 'model call' };
const TOOLS: FlowNode = { id: 'tools', x: 460, y: 110, w: 120, h: 60, label: 'tools', sub: 'run tool calls' };
const STATE: FlowNode = { id: 'state', x: 140, y: 238, w: 200, h: 70, label: 'State', sub: 'messages, steps', shape: 'db' };

const base = [START(60, 110), END(650, 110)];

const steps: Step[] = [
  {
    caption: 'A workflow is a graph too. Here a fixed chain of three nodes. Every edge points forward, so the graph has no cycle, and it always ends. A graph with no cycle is a DAG (directed acyclic graph). The path is known before the run.',
    nodes: [START(60, 110), { id: 'a', x: 200, y: 110, w: 120, h: 60, label: 'extract' }, { id: 'b', x: 360, y: 110, w: 120, h: 60, label: 'summarize' }, { id: 'c', x: 520, y: 110, w: 120, h: 60, label: 'format' }, END(660, 110)],
    edges: [{ from: 'start', to: 'a' }, { from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'end' }],
    notes: [{ x: 360, y: 220, text: 'Fixed edges only. One path.', anchor: 'middle' }],
    active: [],
  },
  {
    caption: 'An agent has two nodes: one that calls the model and one that runs tools. Add an edge from tools back to agent and the graph has a cycle. This is the loop from the Agent Loop lesson drawn as a graph. The next steps add what the loop needs to be safe.',
    nodes: [...base, AGENT, TOOLS],
    edges: [{ from: 'start', to: 'agent' }, { from: 'agent', to: 'tools' }, { from: 'tools', to: 'agent', bend: 55, label: 'back', labelAt: [0, 14] }],
    notes: [{ x: 360, y: 250, text: 'A cycle, and so far no way out.', anchor: 'middle', tone: 'bad' }],
    active: ['tools'],
  },
  {
    caption: 'State. All nodes share one typed object. Here it holds messages (a list that grows) and steps (a counter). Each key has a reducer, a rule for merging an update. Messages append. Steps replace the old value. State is the only way nodes pass data.',
    nodes: [...base, AGENT, TOOLS, STATE],
    edges: [{ from: 'start', to: 'agent' }, { from: 'agent', to: 'tools' }, { from: 'tools', to: 'agent', bend: 55, label: 'back', labelAt: [0, 14] }],
    notes: [{ x: 280, y: 238, text: 'messages: append   steps: replace', anchor: 'start', tone: 'muted' }],
    active: ['state'],
  },
  {
    caption: 'A node is a function. It reads the state and returns a partial update, only the keys it changes. The agent node calls the model and returns the new message and steps + 1. It does not edit the state in place. The framework applies the update with the reducers.',
    nodes: [...base, AGENT, TOOLS, STATE],
    edges: [{ from: 'start', to: 'agent' }, { from: 'agent', to: 'tools' }, { from: 'tools', to: 'agent', bend: 55, label: 'back', labelAt: [0, 14] }],
    notes: [{ x: 280, y: 238, text: 'agent(state) -> {messages: [reply], steps: steps + 1}', anchor: 'start' }],
    active: ['agent'],
  },
  {
    caption: 'The conditional edge. After the agent node, a routing function reads the state and picks the next node. "Tool calls present? Go to tools. Otherwise go to END." This is how the model\'s stop decision becomes a graph edge. The dashed edge is the exit.',
    nodes: [...base, AGENT, TOOLS, STATE],
    edges: [{ from: 'start', to: 'agent' }, { from: 'agent', to: 'tools', label: 'tool calls?', labelAt: [0, -20] }, { from: 'tools', to: 'agent', bend: 55, label: 'back', labelAt: [0, 14] }, { from: 'agent', to: 'end', bend: 85, dashed: true, tone: 'ok', label: 'no calls', labelAt: [0, -12] }],
    notes: [{ x: 280, y: 238, text: 'route(state): "tools" or END', anchor: 'start' }],
    active: ['agent'],
  },
  {
    caption: 'The guard. A model that keeps asking for tools would never reach the exit above. So the routing function also reads the counter: if steps has reached the budget, go to END anyway. Every cycle needs an exit edge that your code controls, not only one the model controls.',
    nodes: [...base, AGENT, TOOLS, STATE],
    edges: [{ from: 'start', to: 'agent' }, { from: 'agent', to: 'tools', label: 'tool calls?', labelAt: [0, -20] }, { from: 'tools', to: 'agent', bend: 55, label: 'back', labelAt: [0, 14] }, { from: 'agent', to: 'end', bend: 85, dashed: true, tone: 'ok', label: 'no calls, or steps >= max', labelAt: [0, -12] }],
    notes: [{ x: 280, y: 238, text: 'route: steps >= max -> END', anchor: 'start', tone: 'warn' }],
    active: ['agent'],
  },
  {
    caption: 'Why draw it this way. Each node is a step you can name, test with a fixed state, retry, and trace. The state can be saved after every node, which gives checkpoints. A runtime that persists them can resume after a crash (the Durable Execution and the Graph Runtime lesson). You get this only because the steps are explicit.',
    nodes: [...base, AGENT, TOOLS, { ...STATE, tone: 'ok' }],
    edges: [{ from: 'start', to: 'agent' }, { from: 'agent', to: 'tools' }, { from: 'tools', to: 'agent', bend: 55 }, { from: 'agent', to: 'end', bend: 85, dashed: true, tone: 'ok' }],
    notes: [{ x: 280, y: 238, text: 'saved after each node: resume, replay, debug', anchor: 'start', tone: 'ok' }],
    active: ['state'],
  },
];

export default function Ai6GraphBuild() {
  return (
    <AnimFrame title="From a chain to an agent graph" steps={steps} interval={6000}>
      {(i) => {
        const s = steps[i];
        return <FlowDiagram width={720} height={290} nodes={s.nodes} edges={s.edges} notes={s.notes} active={s.active} label="Agent graph being built" />;
      }}
    </AnimFrame>
  );
}
