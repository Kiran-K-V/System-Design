import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowNode } from '../FlowDiagram';

const ALL: FlowNode[] = [
  { id: 's1', x: 100, y: 70, w: 170, h: 60, label: 'Requirements\nwith a quality bar', badge: 1 },
  { id: 's2', x: 360, y: 70, w: 170, h: 60, label: 'Eval plan\nfirst', badge: 2 },
  { id: 's3', x: 620, y: 70, w: 170, h: 60, label: 'Latency and\ncost budget', badge: 3 },
  { id: 's4', x: 620, y: 200, w: 170, h: 60, label: 'Data and\nmodel choice', badge: 4 },
  { id: 's5', x: 360, y: 200, w: 170, h: 60, label: 'Architecture', badge: 5 },
  { id: 's6', x: 100, y: 200, w: 170, h: 60, label: 'Rollout, monitoring,\nfailure modes', badge: 6 },
];

const EDGES: (FlowEdge & { at: number })[] = [
  { from: 's1', to: 's2', at: 2 },
  { from: 's2', to: 's3', label: 'eval gate', at: 3 },
  { from: 's3', to: 's4', label: 'budget gate', labelAt: [60, 0], at: 4 },
  { from: 's4', to: 's5', label: 'budget ok?', at: 5 },
  { from: 's5', to: 's6', label: 'bar met?', at: 6 },
  { from: 's6', to: 's1', label: 'monitor, re-run evals', labelAt: [80, 0], dashed: true, tone: 'warn', at: 7 },
];

const steps = [
  { caption: 'Step 1. Requirements with a quality bar. Not "a good support bot" but "answers match policy on at least 90% of a golden set". The bar is a number you can fail. (Illustrative numbers for a support bot.)', note: 'Bar: 90% of a 200-ticket golden set match policy. p95 under 3 s.' },
  { caption: 'Step 2. Eval plan, before any architecture. Pick the test set, the grader (code, human, or a model as judge), and who reads transcripts. Without this step no later change can be judged. The arrow into step 3 is the eval gate: no design work until the eval runs.', note: '200 real tickets. Binary pass or fail grader. Humans label 25 to 50 traces per batch.' },
  { caption: 'Step 3. Latency and cost budget. Write the cap per request now, as a number. Every later choice must fit inside it. The budget gate checks this before you pick a model.', note: 'Cap: $0.01 per request. 1M requests per day means $10,000 per day at most.' },
  { caption: 'Step 4. Data and model choice. Start with a hosted model and a prompt. Add retrieval if the model lacks facts. Choose by the eval and the budget, not by name.', note: 'Policy docs as context. A small model first. A bigger model only for hard tickets.' },
  { caption: 'Step 5. Architecture. Now draw boxes: retrieval, model call, answer check, human handoff. Each box exists because an earlier step asked for it. Run the eval on the design. If it misses the bar or the budget, go back.', note: 'Retrieve, answer, check the answer cites policy, else hand off to a human.' },
  { caption: 'Step 6. Rollout, monitoring, failure modes. Ship in stages and watch the same metrics as the eval. Name how often each failure happens and what the fallback is.', note: 'Shadow mode, then 5% canary. Alarm if thumbs-down rate rises. Instant rollback.' },
  { caption: 'The method is a loop. Production traffic shows new failures. They become new eval cases, and the eval gate runs again. This is why eval comes before architecture: it is the one thing that stays fixed while the design changes.', note: 'Each production failure becomes a new test in the golden set.' },
];

export default function Ai0MethodFlow() {
  return (
    <AnimFrame title="The AI design method, built step by step" steps={steps}>
      {(i, s) => {
        const upto = Math.min(i + 1, 6);
        const nodes = ALL.slice(0, upto).map((n, k) => ({ ...n, tone: k < i || i >= 6 ? ('ok' as const) : ('default' as const) }));
        const edges = EDGES.filter((e) => e.at <= i + 1);
        return (
          <FlowDiagram
            width={720}
            height={320}
            nodes={nodes}
            edges={edges}
            active={i < 6 ? [`s${i + 1}`] : []}
            notes={[{ x: 360, y: 288, text: s.note, size: 14, tone: 'muted', anchor: 'middle' }]}
            label="Six step AI design method"
          />
        );
      }}
    </AnimFrame>
  );
}
