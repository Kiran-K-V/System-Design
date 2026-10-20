import DesignBuild, { type BuildEdge, type BuildNode, type BuildStep } from '../DesignBuild';

/**
 * The fixed three-step pipeline in LinkedIn's post (2024-04-25): routing, retrieval, generation.
 * Boxes and order follow the post's Figure 1 and "Calling internal APIs" text. Model names and sizes are not published.
 */

const nodes: BuildNode[] = [
  { id: 'member', x: 90, y: 70, w: 120, label: 'Member', sub: 'asks a question', step: 0 },
  { id: 'router', x: 270, y: 70, w: 130, label: 'Router', sub: 'small model', step: 0 },
  { id: 'agent', x: 450, y: 70, w: 130, label: 'Agent', sub: 'small model plans', step: 1 },
  { id: 'parser', x: 630, y: 70, w: 120, label: 'Parser', sub: 'patch, then parse', step: 2 },
  { id: 'skills', x: 630, y: 200, w: 120, label: 'Skills', sub: 'APIs and Bing', step: 2 },
  { id: 'gen', x: 450, y: 200, w: 130, label: 'Generation', sub: 'larger model', step: 3 },
  { id: 'stream', x: 270, y: 200, w: 130, label: 'Stream', sub: 'tokens as ready', step: 4 },
  { id: 'screen', x: 90, y: 200, w: 120, label: 'Screen', sub: 'member reads', step: 4 },
];

const edges: BuildEdge[] = [
  { from: 'member', to: 'router', step: 0 },
  { from: 'router', to: 'agent', step: 1 },
  { from: 'agent', to: 'parser', step: 2 },
  { from: 'parser', to: 'skills', step: 2 },
  { from: 'skills', to: 'gen', step: 3 },
  { from: 'gen', to: 'stream', step: 4 },
  { from: 'stream', to: 'screen', step: 4 },
];

const steps: BuildStep[] = [
  {
    req: 'Step 1: routing',
    caption: 'A member asks a question about a post. A small model decides whether it is in scope and which agent should take it. The post says there are dozens of agents, such as job assessment, company understanding, and post takeaways.',
    packets: [{ from: 'member', to: 'router', label: 'ask' }],
  },
  {
    req: 'Step 2: retrieval',
    caption: 'The chosen agent decides which services to call and how. The post calls this step recall-oriented: gather more than you need, because a missing fact cannot be added later.',
    packets: [{ from: 'router', to: 'agent', label: 'route' }],
  },
  {
    req: 'Step 2: skills',
    caption: 'The agent writes its call as YAML text. A defensive parser repairs common mistakes in that text, then the call runs against a skill: an internal API or Bing, wrapped so a model can use it.',
    packets: [{ from: 'agent', to: 'parser', label: 'YAML' }, { from: 'parser', to: 'skills', label: 'call', delay: 0.9 }],
  },
  {
    req: 'Step 3: generation',
    caption: 'The skills return noisy data. A larger model sieves it, drops what does not help, and writes the answer. The post calls this step precision-oriented, and says it was the hard one.',
    packets: [{ from: 'skills', to: 'gen', label: 'data' }],
  },
  {
    req: 'Streaming',
    caption: 'The answer streams to the screen token by token. Internal APIs also add attachments, such as article links or profiles, so the reply is not a wall of text.',
    packets: [{ from: 'gen', to: 'stream', label: 'text' }, { from: 'stream', to: 'screen', label: 'text', delay: 0.9 }],
  },
  {
    req: 'Streaming, end to end',
    caption: 'The streaming goes further back. The post says the model output that picks the APIs is parsed as it arrives, and each API call fires as soon as its parameters are complete, without waiting for the full reply.',
    active: ['agent', 'parser', 'skills'],
    packets: [{ from: 'agent', to: 'parser', label: 'part' }, { from: 'parser', to: 'skills', label: 'call', delay: 0.9 }],
  },
];

export default function Ai14LinkedinPipeline() {
  return <DesignBuild title="LinkedIn's three-step pipeline, built up" steps={steps} nodes={nodes} edges={edges} height={256} label="Member question flowing through router, agent, parser, skills, generation, and a streamed reply" />;
}
