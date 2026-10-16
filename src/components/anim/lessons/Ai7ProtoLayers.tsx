import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowGroup, type FlowNode, type FlowNote, type FlowPacket } from '../FlowDiagram';

/** Step captions use the A2A v1.0.0 spec (task states, agent card, streaming) and the A2A and MCP topic page. Names of the agents are illustrative. */
const ALL: Record<string, FlowNode> = {
  user: { id: 'user', x: 70, y: 190, w: 100, h: 60, label: 'User' },
  agent: { id: 'agent', x: 250, y: 190, w: 140, h: 60, label: 'Your agent' },
  tool: { id: 'tool', x: 470, y: 80, w: 150, h: 60, label: 'Tool server' },
  remote: { id: 'remote', x: 490, y: 300, w: 150, h: 60, label: 'Remote agent' },
  rtool: { id: 'rtool', x: 630, y: 385, w: 140, h: 50, label: 'Its tools' },
  card: { id: 'card', x: 620, y: 190, w: 140, h: 60, label: 'Agent card', shape: 'dashed' },
};

interface Step {
  caption: string;
  nodes: string[];
  edges: FlowEdge[];
  active: string[];
  notes?: FlowNote[];
  packets?: FlowPacket[];
  groups?: FlowGroup[];
}

const UA: FlowEdge = { from: 'user', to: 'agent', label: '' };
const MCP: FlowEdge = { from: 'agent', to: 'tool', label: 'MCP' };
const A2A: FlowEdge = { from: 'agent', to: 'remote', label: 'A2A', dashed: true, tone: 'accent' };
const RMCP: FlowEdge = { from: 'remote', to: 'rtool', label: 'MCP', labelAt: [-32, 4] };

const STEPS: Step[] = [
  {
    caption: 'MCP is vertical. One agent calls its tools. The A2A docs say MCP tools are typically "primitives with well-defined, structured inputs and outputs". You own both sides, or you trust the server enough to call it.',
    nodes: ['user', 'agent', 'tool'],
    edges: [UA, MCP],
    active: ['agent', 'tool'],
  },
  {
    caption: 'A2A is horizontal. A second agent, run by another team or vendor, sits across a boundary. Your agent does not call its tools. It hands it a task. The remote agent keeps its own tools behind its own MCP connection, and you never see them.',
    nodes: ['user', 'agent', 'tool', 'remote', 'rtool'],
    edges: [UA, MCP, A2A, RMCP],
    active: ['remote'],
  },
  {
    caption: 'Discovery. Your agent fetches the remote agent\'s Agent Card, a JSON document. The A2A spec says to look for it at /.well-known/agent-card.json on the server domain. The card lists skills, the interface URL, capabilities such as streaming, and the security schemes the client must use.',
    nodes: ['user', 'agent', 'tool', 'remote', 'rtool', 'card'],
    edges: [UA, MCP, A2A, RMCP, { from: 'agent', to: 'card', label: 'GET card', bend: 40 }],
    active: ['card'],
    packets: [{ from: 'agent', to: 'card', tone: 'accent' }],
  },
  {
    caption: 'Submit. Your agent calls SendMessage (or SendStreamingMessage). The remote agent may answer with a direct Message, or create a Task, which is a stateful unit of work with an id. The new task starts in TASK_STATE_SUBMITTED.',
    nodes: ['user', 'agent', 'tool', 'remote', 'rtool'],
    edges: [UA, MCP, { ...A2A, label: 'SendMessage' }, RMCP],
    active: ['remote'],
    packets: [{ from: 'agent', to: 'remote', label: 'task', tone: 'accent' }],
    notes: [{ x: 490, y: 348, text: 'SUBMITTED', anchor: 'middle', tone: 'warn' }],
  },
  {
    caption: 'Stream. The remote agent works and pushes TaskStatusUpdateEvent messages. In the streaming call the first event is the Task, and the stream closes at a terminal state. The task is in TASK_STATE_WORKING. It may use its own tools through MCP meanwhile.',
    nodes: ['user', 'agent', 'tool', 'remote', 'rtool'],
    edges: [UA, MCP, { ...A2A, label: 'status events' }, { ...RMCP, tone: 'accent' }],
    active: ['remote', 'rtool'],
    packets: [{ from: 'remote', to: 'agent', label: 'WORKING', tone: 'accent' }],
    notes: [{ x: 490, y: 348, text: 'WORKING', anchor: 'middle', tone: 'accent' }],
  },
  {
    caption: 'Result. The remote agent returns an Artifact (a document, image, or structured data) and the task reaches TASK_STATE_COMPLETED, a terminal state. A follow-up must be a new task, because a terminal task takes no more messages.',
    nodes: ['user', 'agent', 'tool', 'remote', 'rtool'],
    edges: [UA, MCP, { ...A2A, label: 'artifact', tone: 'ok' }, RMCP],
    active: ['agent'],
    packets: [{ from: 'remote', to: 'agent', label: 'artifact', tone: 'ok' }],
    notes: [{ x: 490, y: 348, text: 'COMPLETED', anchor: 'middle', tone: 'ok' }],
  },
  {
    caption: 'The trust boundary. Everything inside the dashed box belongs to someone else. The artifact is data from an outside party. Your agent may read it and show it. It must not take instructions from it. Any tool call still goes through your own policy and your own user\'s approval.',
    nodes: ['user', 'agent', 'tool', 'remote', 'rtool'],
    edges: [UA, MCP, { ...A2A, label: 'untrusted data', tone: 'bad', labelAt: [-40, 32] }, RMCP],
    active: ['agent'],
    groups: [{ x: 395, y: 232, w: 305, h: 190, label: 'Other team or vendor: untrusted' }],
  },
];

export default function Ai7ProtoLayers() {
  const steps = STEPS.map((s) => ({ caption: s.caption }));
  return (
    <AnimFrame title="MCP goes down to tools, A2A goes across to other agents" steps={steps} interval={5200}>
      {(i, _s) => {
        const s = STEPS[i];
        return (
          <FlowDiagram
            width={720}
            height={430}
            nodes={s.nodes.map((id) => ALL[id])}
            edges={s.edges}
            active={s.active}
            notes={s.notes}
            groups={s.groups}
            packets={s.packets}
            stepKey={i}
            label="MCP and A2A layers"
          />
        );
      }}
    </AnimFrame>
  );
}
