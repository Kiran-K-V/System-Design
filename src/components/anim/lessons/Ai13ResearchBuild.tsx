import DesignBuild, { type BuildEdge, type BuildGroup, type BuildNode, type BuildStep } from '../DesignBuild';

/** Deep research agent: the high-level design grows one requirement at a time. */

const nodes: BuildNode[] = [
  { id: 'user', x: 90, y: 70, w: 120, label: 'User', sub: 'asks, polls', step: 0 },
  { id: 'api', x: 250, y: 70, label: 'Run API', sub: 'returns a run id', step: 0 },
  { id: 'store', x: 410, y: 70, h: 84, label: 'Run store', sub: 'plan, state, report', shape: 'db', step: 0 },
  { id: 'lead', x: 250, y: 200, label: 'Lead agent', sub: 'plans, sets effort', step: 1 },
  { id: 'subs', x: 250, y: 330, w: 150, label: 'Subagents', sub: '3 to 5 in parallel', step: 2 },
  { id: 'tools', x: 430, y: 330, label: 'Search, fetch', sub: 'web pages', step: 2 },
  { id: 'cite', x: 410, y: 200, label: 'Citation gate', sub: 'claim by claim', step: 3 },
  { id: 'budget', x: 90, y: 200, w: 120, label: 'Budget meter', sub: 'tokens, calls, $', step: 4 },
  { id: 'ckpt', x: 90, y: 330, w: 120, h: 84, label: 'Checkpoints', sub: 'one per step', shape: 'db', step: 5 },
  { id: 'judge', x: 570, y: 70, label: 'Rubric judge', sub: 'scores a sample', step: 7 },
  { id: 'human', x: 570, y: 200, label: 'Human check', sub: 'weekly sample', step: 7 },
];

const edges: BuildEdge[] = [
  { from: 'user', to: 'api', head: 'both', step: 0 },
  { from: 'api', to: 'store', step: 0 },
  { from: 'api', to: 'lead', step: 1 },
  { from: 'lead', to: 'store', label: 'plan', labelAt: [30, -8], dashed: true, step: 1 },
  { from: 'lead', to: 'subs', step: 2 },
  { from: 'subs', to: 'tools', head: 'both', step: 2 },
  { from: 'lead', to: 'cite', step: 3 },
  { from: 'cite', to: 'store', label: 'report', labelAt: [30, 0], step: 3 },
  { from: 'budget', to: 'lead', dashed: true, step: 4 },
  { from: 'subs', to: 'ckpt', dashed: true, step: 5 },
  { from: 'store', to: 'judge', step: 7 },
  { from: 'judge', to: 'human', step: 7 },
];

const groups: BuildGroup[] = [{ x: 170, y: 262, w: 330, h: 122, label: 'untrusted zone: no private data', step: 6 }];

const steps: BuildStep[] = [
  { req: 'FR1: ask, get a run id', caption: 'A run takes minutes, so the API cannot hold the connection. It stores the question, returns a run id, and the user polls or gets a notification. The run store holds the state of every run.', packets: [{ from: 'user', to: 'api', label: 'question' }, { from: 'api', to: 'store', label: 'run id', delay: 0.9 }] },
  { req: 'FR2: plan and scale effort', caption: 'The lead agent reads the question, writes a plan, and saves it to the run store. It picks the effort from a rule table: how many subagents, and how many tool calls each. The plan is saved so a long run can lose its context and still know what it set out to do.', packets: [{ from: 'api', to: 'lead', label: 'run' }, { from: 'lead', to: 'store', label: 'plan', delay: 0.9 }] },
  { req: 'FR3: search in parallel', caption: 'The lead starts the subagents. Each gets a brief, a fresh context, and the search and fetch tools. They read pages at the same time and return short findings, not raw pages.', packets: [{ from: 'lead', to: 'subs', label: 'briefs' }, { from: 'subs', to: 'tools', label: 'query', delay: 0.9 }] },
  { req: 'FR4: every claim cited', caption: 'The lead merges the findings into a draft. The citation gate then checks each claim against the exact text of its cited page. A claim that no source supports is repaired or struck before the report is stored.', packets: [{ from: 'lead', to: 'cite', label: 'draft' }, { from: 'cite', to: 'store', label: 'report', delay: 0.9 }] },
  { req: 'NFR: cost and time are capped', caption: 'The budget meter counts tokens, tool calls, dollars, and seconds for each run. It lives outside the model. When a cap is hit, the lead must wrap up with what it has. The model does not get a vote.', packets: [{ from: 'budget', to: 'lead', label: 'cap hit', tone: 'warn' }] },
  { req: 'NFR: survive crashes and deploys', caption: 'After every step the runtime writes a checkpoint. A crash resumes from the last one, so only one step is redone. Old and new code run side by side during a deploy, so a deploy does not kill runs that are in flight.', packets: [{ from: 'subs', to: 'ckpt', label: 'step 41' }] },
  { req: 'NFR: pages are untrusted', caption: 'No new box. The pages are written by strangers. The zone that reads them holds no private data and has no way to send data out. It returns structured findings, and the lead treats them as data, not as orders.', active: ['subs', 'tools'] },
  { req: 'NFR: measure quality', caption: 'A judge scores a sample of reports on a rubric. People read a smaller sample every week. They catch what the judge shares with the agent, such as a liking for polished content-farm pages.', packets: [{ from: 'store', to: 'judge', label: 'sample' }, { from: 'judge', to: 'human', label: 'review', delay: 0.9 }] },
];

export default function Ai13ResearchBuild() {
  return <DesignBuild title="Deep research agent, built up" steps={steps} nodes={nodes} edges={edges} groups={groups} height={420} label="Deep research agent architecture growing from a run API to a judge and human review" />;
}
