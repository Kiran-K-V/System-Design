import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { NODES } from './Ai7DurLogic';

type St = 'idle' | 'run' | 'done' | 'crash' | 'redo';

interface Step {
  caption: string;
  a: St[];
  b: St[];
  cps: number;
  llmA: number;
  llmB: number;
  note?: string;
}

const steps: Step[] = [
  {
    caption:
      'A 5-node agent run: plan, search, summarize, draft, send email. Three nodes call the LLM. The top lane keeps no state between nodes. The bottom lane saves a checkpoint each time a step finishes. In this chain, one super-step is one node.',
    a: ['idle', 'idle', 'idle', 'idle', 'idle'],
    b: ['idle', 'idle', 'idle', 'idle', 'idle'],
    cps: 0,
    llmA: 0,
    llmB: 0,
  },
  {
    caption: 'Nodes 1 and 2 finish. The bottom lane now holds two checkpoints: the graph state after plan, and after search. Each lane has made 1 LLM call.',
    a: ['done', 'done', 'idle', 'idle', 'idle'],
    b: ['done', 'done', 'idle', 'idle', 'idle'],
    cps: 2,
    llmA: 1,
    llmB: 1,
  },
  {
    caption: 'Node 3 starts and fires LLM call 2. The worker dies in the middle of it. The half-finished answer is lost in both lanes: a node writes its output only when it completes.',
    a: ['done', 'done', 'crash', 'idle', 'idle'],
    b: ['done', 'done', 'crash', 'idle', 'idle'],
    cps: 2,
    llmA: 2,
    llmB: 2,
    note: 'worker dies',
  },
  {
    caption:
      'A new worker takes over. The top lane has nothing saved, so it starts at node 1 and pays for plan again (LLM call 3). The bottom lane loads checkpoint 2 for this thread and runs node 3 again (LLM call 3). The in-flight node always runs again.',
    a: ['redo', 'redo', 'idle', 'idle', 'idle'],
    b: ['done', 'done', 'run', 'idle', 'idle'],
    cps: 2,
    llmA: 3,
    llmB: 3,
  },
  {
    caption: 'Both lanes finish. Top: 5 LLM calls. Bottom: 4. The checkpoint saved one call here. The later the crash, the larger the gap. In the widget below you can move the crash.',
    a: ['done', 'done', 'done', 'done', 'done'],
    b: ['done', 'done', 'done', 'done', 'done'],
    cps: 5,
    llmA: 5,
    llmB: 4,
  },
  {
    caption:
      'Replay is a different thing. To debug, you re-run the finished thread from checkpoint 2. LangGraph says replay re-executes nodes and does not read from a cache. Nodes 3, 4, and 5 run again, so 2 more LLM calls fire and may return different text, and the email goes out again.',
    a: ['done', 'done', 'done', 'done', 'done'],
    b: ['done', 'done', 'redo', 'redo', 'redo'],
    cps: 5,
    llmA: 5,
    llmB: 6,
    note: 'replay from checkpoint 2',
  },
];

const X = [100, 230, 360, 490, 620];
const TONE: Record<St, string> = { idle: 'var(--muted)', run: 'var(--accent)', done: 'var(--ok)', crash: 'var(--bad)', redo: 'var(--warn)' };

function Lane({ y, title, states, cps, llm, id }: { y: number; title: string; states: St[]; cps: number | null; llm: number; id: string }) {
  return (
    <g>
      <HandText x={30} y={y - 52} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">
        {title}
      </HandText>
      <HandText x={690} y={y - 52} anchor="end" size={TEXT_SIZES.label} mono>
        {`LLM calls: ${llm}`}
      </HandText>
      {X.slice(0, -1).map((x, i) => (
        <SketchArrow key={i} points={[[x + 56, y], [X[i + 1] - 56, y]]} stroke="var(--muted)" seed={seedOf(`${id}a${i}`)} />
      ))}
      {NODES.map((n, i) => {
        const s = states[i];
        return (
          <g key={n.name}>
            <SketchBox cx={X[i]} cy={y} w={100} h={44} r={8} seed={seedOf(`${id}n${i}`)} stroke={TONE[s]} fill={s === 'idle' ? undefined : TONE[s]} dashed={s === 'idle'} strokeWidth={s === 'run' || s === 'crash' ? 2.2 : 1.4} />
            <HandText x={X[i]} y={y} size={TEXT_SIZES.label}>
              {n.name}
            </HandText>
            <HandText x={X[i]} y={y + 36} size={TEXT_SIZES.note} color="var(--muted)">
              {n.llm ? 'LLM call' : n.name === 'send email' ? 'side effect' : 'tool'}
            </HandText>
            {cps !== null && i < cps && (
              <HandText x={X[i]} y={y - 34} size={TEXT_SIZES.note} color="var(--ok)">
                {`cp ${i + 1}`}
              </HandText>
            )}
          </g>
        );
      })}
    </g>
  );
}

export default function Ai7DurWalk() {
  return (
    <AnimFrame title="A crash at node 3: restart or resume" steps={steps} interval={5200}>
      {(_, s) => (
        <SketchSvg width={720} height={340} label="Two lanes run a 5-node agent graph. The worker dies at node 3. One lane restarts from node 1, the other resumes from a checkpoint.">
          <Lane y={95} title="No checkpoints: restart" states={s.a} cps={null} llm={s.llmA} id="top" />
          <Lane y={245} title="Checkpoint per super-step: resume" states={s.b} cps={s.cps} llm={s.llmB} id="bot" />
          {s.note && (
            <HandText x={360} y={322} size={TEXT_SIZES.label} color={s.note === 'worker dies' ? 'var(--bad)' : 'var(--warn)'}>
              {s.note}
            </HandText>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
