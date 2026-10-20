import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowNode, type FlowEdge, type FlowGroup, type FlowPacket, type Tone } from '../FlowDiagram';

/**
 * The loop from the Claude Agent SDK post, with each stage opened to the tools the post names.
 * Every step caption starts with "Company claim" (the post says it) or "Our reading" (we infer it).
 * The post has no numbers for any stage, so this picture has none either.
 */

type Stage = 'gather' | 'act' | 'verify';

const STAGE_X: Record<Stage, number> = { gather: 115, act: 360, verify: 605 };
const STAGE_Y = 100;
const ROWS = [215, 280, 345, 410];

const stageNodes: FlowNode[] = [
  { id: 'gather', x: STAGE_X.gather, y: STAGE_Y, w: 170, h: 60, label: 'Gather context' },
  { id: 'act', x: STAGE_X.act, y: STAGE_Y, w: 170, h: 60, label: 'Take action' },
  { id: 'verify', x: STAGE_X.verify, y: STAGE_Y, w: 170, h: 60, label: 'Verify work' },
];

const toolNodes: Record<Stage, FlowNode[]> = {
  gather: [
    { id: 'search', x: STAGE_X.gather, y: ROWS[0], w: 190, h: 52, label: 'Agentic search', sub: 'grep, tail on files' },
    { id: 'subagents', x: STAGE_X.gather, y: ROWS[1], w: 190, h: 52, label: 'Subagents', sub: 'own context windows' },
    { id: 'compact', x: STAGE_X.gather, y: ROWS[2], w: 190, h: 52, label: 'Compaction', sub: 'near the limit' },
    { id: 'semantic', x: STAGE_X.gather, y: ROWS[3], w: 190, h: 52, label: 'Semantic search', sub: 'only if needed', shape: 'dashed' },
  ],
  act: [
    { id: 'tools', x: STAGE_X.act, y: ROWS[0], w: 190, h: 52, label: 'Tools', sub: 'primary actions' },
    { id: 'bash', x: STAGE_X.act, y: ROWS[1], w: 190, h: 52, label: 'Bash and scripts', sub: 'general purpose' },
    { id: 'code', x: STAGE_X.act, y: ROWS[2], w: 190, h: 52, label: 'Code generation', sub: 'precise, reusable' },
    { id: 'mcp', x: STAGE_X.act, y: ROWS[3], w: 190, h: 52, label: 'MCP', sub: 'external services' },
  ],
  verify: [
    { id: 'rules', x: STAGE_X.verify, y: ROWS[0], w: 190, h: 52, label: 'Rules', sub: 'lint, explicit checks' },
    { id: 'visual', x: STAGE_X.verify, y: ROWS[1], w: 190, h: 52, label: 'Visual feedback', sub: 'screenshots' },
    { id: 'judge', x: STAGE_X.verify, y: ROWS[2], w: 190, h: 52, label: 'LLM as judge', sub: 'not very robust' },
  ],
};

const GROUP_LABEL: Record<Stage, string> = {
  gather: 'Stage 1: fetch context',
  act: 'Stage 2: do the work',
  verify: 'Stage 3: check the result',
};

const groupFor = (s: Stage, rows: number): FlowGroup => ({
  x: STAGE_X[s] - 105,
  y: 148,
  w: 210,
  h: rows === 4 ? 298 : 233,
  label: GROUP_LABEL[s],
});

const stageEdges: FlowEdge[] = [
  { from: 'gather', to: 'act' },
  { from: 'act', to: 'verify' },
  { from: 'verify', to: 'gather', bend: -90, labelAt: [0, 22], label: 'repeat' },
];

interface S {
  caption: string;
  open?: Stage;
  active: string[];
  tones?: Record<string, Tone>;
  packets?: FlowPacket[];
}

const steps: S[] = [
  {
    caption: 'Company claim: "In Claude Code, Claude often operates in a specific feedback loop: gather context -> take action -> verify work -> repeat." The post says this is a useful way to think about other agents too. Three stages and one arrow back. The next steps open each stage.',
    active: [],
  },
  {
    caption: 'Company claim, gather: the file system "represents information that could be pulled into the model\'s context". Claude loads large files with bash tools like grep and tail. The post says to start here. Semantic search (dashed) comes later, "if you need faster results or more variations".',
    open: 'gather',
    active: ['search'],
  },
  {
    caption: 'Company claim, gather: subagents give parallel work and "their own isolated context windows", and send only "relevant information back to the orchestrator". The post draws no diagram of how many run at once or what a brief holds.',
    open: 'gather',
    active: ['subagents'],
  },
  {
    caption: 'Company claim, gather: compaction "automatically summarizes previous messages when the context limit approaches". Not published: the trigger size, the summary prompt, and what is kept word for word.',
    open: 'gather',
    active: ['compact'],
  },
  {
    caption: 'Company claim, act: tools are "the primary building blocks of execution" and "prominent in Claude\'s context window". Our reading: so every tool name, description, and result competes for the same budget. Bash, code generation, and MCP are the other three ways to act.',
    open: 'act',
    active: ['tools'],
  },
  {
    caption: 'Company claim, act: code is "precise, composable, and infinitely reusable". The post says file creation in Claude.ai relies entirely on code generation. Our reading: a script is also something a later verify step can run and check.',
    open: 'act',
    active: ['code'],
  },
  {
    caption: 'Company claim, verify: the post calls clearly defined rules the best form of feedback, and says to explain which rule failed and why. Its examples: lint the code, validate an email address, warn on a repeat send. Our reading: a rule is code, so it gives the same verdict every time, and it can say which rule failed.',
    open: 'verify',
    active: ['rules'],
    tones: { rules: 'ok' },
  },
  {
    caption: 'Company claim, verify: for visual tasks, screenshot the output and give it back to the model. A Playwright MCP server can automate it. The post adds a limit: "a single screenshot has limited viewport info". Our reading: the check is a model reading an image, so it is softer than a rule.',
    open: 'verify',
    active: ['visual'],
  },
  {
    caption: 'Company claim, verify: a second model grading by fuzzy rules is "generally not a very robust method, and can have heavy latency tradeoffs". The post still allows it when "any boost in performance is worth the cost". It gives no accuracy or latency number.',
    open: 'verify',
    active: ['judge'],
    tones: { judge: 'warn' },
  },
  {
    caption: 'Our reading: the arrow back is the whole point. A failed check turns into new context, and the loop runs again. Whether the loop ends is decided by the verify stage. If that stage is weak, the agent stops on its own opinion.',
    active: ['gather'],
    packets: [{ from: 'verify', to: 'gather', tone: 'accent' }],
  },
];

export default function Ai14SdkLoop() {
  return (
    <AnimFrame title="The agent loop in the Claude Agent SDK post, stage by stage" steps={steps} interval={4600}>
      {(i, s) => {
        const nodes: FlowNode[] = stageNodes.map((n) => ({
          ...n,
          tone: s.open && s.open !== n.id ? ('muted' as Tone) : undefined,
        }));
        const groups: FlowGroup[] = [];
        if (s.open) {
          const tools = toolNodes[s.open].map((n) => ({ ...n, tone: s.tones?.[n.id] }));
          nodes.push(...tools);
          groups.push(groupFor(s.open, tools.length));
        }
        const ids = new Set(nodes.map((n) => n.id));
        const edges = stageEdges.filter((e) => ids.has(e.from) && ids.has(e.to));
        return (
          <FlowDiagram
            width={720}
            height={470}
            nodes={nodes}
            edges={edges}
            groups={groups}
            active={s.active}
            packets={s.packets}
            stepKey={i}
            label="The loop gather context, take action, verify work, repeat, with the tools the post names under each stage"
          />
        );
      }}
    </AnimFrame>
  );
}
