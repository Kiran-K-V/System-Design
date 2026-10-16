import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type Node = 'agent' | 'gate' | 't0' | 't1' | 't2' | 'tool' | 'human';

interface Step {
  caption: string;
  action: string;
  active: Node[];
  tone: Partial<Record<Node, string>>;
  edges: string[];
}

const OK = 'var(--ok)';
const ACC = 'var(--accent)';
const WARN = 'var(--warn)';
const BAD = 'var(--bad)';

const steps: Step[] = [
  {
    caption: 'An agent run proposes three actions. A policy gate sits in your code between the model and the tools. It sorts each action into a risk tier before anything runs. The tiers here are an example design, not a standard.',
    action: 'run starts',
    active: ['agent'],
    tone: { agent: ACC },
    edges: [],
  },
  {
    caption: 'Action 1: read_file("notes.md"). Tier 0: a read with no side effect. It runs with no prompt. A person who is never asked about reads can spend their attention elsewhere.',
    action: 'read_file("notes.md")',
    active: ['agent', 'gate', 't0', 'tool'],
    tone: { gate: ACC, t0: OK, tool: OK },
    edges: ['ag', 'g0', '0t'],
  },
  {
    caption: 'Action 2: edit_file in the working directory. Tier 1: a write that a checkpoint or a diff can undo. It runs and is logged. The person reviews the diff at the end, once, not once per edit.',
    action: 'edit_file(src/app.py)',
    active: ['agent', 'gate', 't1', 'tool'],
    tone: { gate: ACC, t1: OK, tool: OK },
    edges: ['ag', 'g1', '1t'],
  },
  {
    caption: 'Action 3: refund(order 8841, $480). Tier 2: it cannot be undone and it is above the spend limit. The node calls interrupt(). The runtime saves state through the checkpointer and stops. No worker waits, and the run can sit for hours.',
    action: 'refund(8841, $480)',
    active: ['agent', 'gate', 't2', 'human'],
    tone: { gate: ACC, t2: WARN, human: WARN },
    edges: ['ag', 'g2', '2h'],
  },
  {
    caption: 'The person sees the exact call: tool name, order id, and amount. Not a summary such as "issue a refund". They approve. The caller resumes the same thread with Command(resume=...). The node restarts from its first line, interrupt() now returns the answer, and the tool runs once.',
    action: 'approved: run refund(8841, $480)',
    active: ['human', 'tool'],
    tone: { t2: OK, human: OK, tool: OK },
    edges: ['2h', 'ht'],
  },
  {
    caption: 'They could also reject, or edit the amount. A rejection goes back to the model as the tool result, so the agent can pick another plan. Every decision is logged with who, what, and when. That log is how you find out later whether the gate worked.',
    action: 'rejected: result goes back to the model',
    active: ['human', 'agent'],
    tone: { human: BAD, agent: ACC },
    edges: ['2h', 'ha'],
  },
];

const POS: Record<Node, { cx: number; cy: number; w: number; label: string }> = {
  agent: { cx: 90, cy: 160, w: 110, label: 'Agent' },
  gate: { cx: 250, cy: 160, w: 120, label: 'Policy gate' },
  t0: { cx: 440, cy: 80, w: 150, label: 'Tier 0 auto' },
  t1: { cx: 440, cy: 160, w: 150, label: 'Tier 1 log' },
  t2: { cx: 440, cy: 240, w: 150, label: 'Tier 2 ask' },
  tool: { cx: 630, cy: 120, w: 110, label: 'Tool runs' },
  human: { cx: 630, cy: 240, w: 110, label: 'Person' },
};

const EDGE: Record<string, [number, number][]> = {
  ag: [[150, 160], [184, 160]],
  g0: [[310, 150], [364, 86]],
  g1: [[310, 160], [364, 160]],
  g2: [[310, 170], [364, 234]],
  '0t': [[516, 86], [574, 112]],
  '1t': [[516, 160], [574, 128]],
  '2h': [[516, 240], [574, 240]],
  ht: [[630, 214], [630, 152]],
  ha: [[630, 264], [600, 286], [90, 286], [90, 190]],
};

export default function Ai7HitlFlow() {
  return (
    <AnimFrame title="Risk tiers and an approval gate" steps={steps} interval={5200}>
      {(_, s) => (
        <SketchSvg width={720} height={300} label={`Approval flow. Current action: ${s.action}`}>
          <HandText x={30} y={24} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
            {`Action: ${s.action}`}
          </HandText>
          {Object.entries(EDGE).map(([k, pts]) => {
            const on = s.edges.includes(k);
            return <SketchArrow key={k} points={pts} stroke={on ? 'var(--accent)' : 'var(--border)'} strokeWidth={on ? 2.2 : 1.4} dashed={!on} seed={seedOf(`he${k}`)} />;
          })}
          {(Object.keys(POS) as Node[]).map((n) => {
            const p = POS[n];
            const on = s.active.includes(n);
            const t = s.tone[n];
            return (
              <g key={n}>
                <SketchBox cx={p.cx} cy={p.cy} w={p.w} h={44} r={8} seed={seedOf(`hn${n}`)} stroke={t ?? (on ? 'var(--accent)' : 'var(--muted)')} fill={t} dashed={!on && !t} strokeWidth={t ? 2.2 : 1.4} />
                <HandText x={p.cx} y={p.cy} size={TEXT_SIZES.label} color={on || t ? 'var(--fg)' : 'var(--muted)'}>
                  {p.label}
                </HandText>
              </g>
            );
          })}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
