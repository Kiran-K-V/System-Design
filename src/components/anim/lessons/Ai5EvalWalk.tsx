import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  active: number;
  recall?: number;
  faith?: number;
  tag?: string;
}

const NAMES = ['Golden set', 'Retrieve', 'Generate', 'Judge'];
const X = [92, 252, 412, 572];

const steps: Step[] = [
  { caption: 'Start from a golden set: questions, each with the chunk ids that hold the answer and a short reference answer. Here, 200 questions (illustrative). Every later number is computed against it.', active: 0 },
  { caption: 'Run only the retriever and check whether the gold chunk is in the top 5. Case A: recall@5 is 0.95. Retrieval looks healthy. No LLM call was needed, so this meter is cheap and exact.', active: 1, recall: 0.95, tag: 'case A' },
  { caption: 'Now generate answers from the retrieved chunks. A judge splits each answer into claims and checks each against the context. Faithfulness is only 0.62. The right facts were retrieved and the model did not use them. Fix the prompt, the context order, or the model.', active: 2, recall: 0.95, faith: 0.62, tag: 'case A: generation broke' },
  { caption: 'The judge is itself an LLM. It adds cost and variance, so check it against a few human labels before you trust it. Full eval method is in the Error Analysis lesson.', active: 3, recall: 0.95, faith: 0.62, tag: 'case A' },
  { caption: 'Case B, a different system: recall@5 is 0.55 and faithfulness is 0.97. The model stays faithful to what it is given, but the right chunk is missing in 45% of questions. Prompt work cannot help. Fix chunking, hybrid search, or reranking.', active: 1, recall: 0.55, faith: 0.97, tag: 'case B: retrieval broke' },
];

function Meter({ x, label, v, good }: { x: number; label: string; v: number | undefined; good: boolean }) {
  const w = 200;
  const c = v === undefined ? 'var(--muted)' : good ? 'var(--ok)' : 'var(--bad)';
  return (
    <g>
      <HandText x={x} y={176} size={TEXT_SIZES.label} color="var(--fg)">{label}</HandText>
      <rect x={x - w / 2} y={194} width={w} height={22} rx={6} fill="none" stroke="var(--muted)" strokeWidth={1.4} />
      {v !== undefined && <rect x={x - w / 2} y={194} width={Math.max(3, v * w)} height={22} rx={6} fill={c} fillOpacity={0.35} stroke={c} strokeWidth={1.8} />}
      <HandText x={x} y={246} size={TEXT_SIZES.display} mono color={c}>{v === undefined ? '--' : v.toFixed(2)}</HandText>
    </g>
  );
}

export default function Ai5EvalWalk() {
  return (
    <AnimFrame title="Evaluate retrieval and generation separately" steps={steps} interval={7000}>
      {(_, s) => (
        <SketchSvg width={720} height={300} label="Eval pipeline from golden set to judge, with a retrieval meter and a generation meter">
          {NAMES.map((n, k) => {
            const a = k === s.active;
            return (
              <g key={n}>
                <SketchBox cx={X[k]} cy={52} w={124} h={44} r={8} seed={seedOf(`ew-${k}`)} stroke={a ? 'var(--accent)' : 'var(--muted)'} strokeWidth={a ? 2.2 : 1.4} fill={a ? 'var(--accent)' : undefined} />
                <HandText x={X[k]} y={53} size={TEXT_SIZES.label}>{n}</HandText>
                {k < 3 && <SketchArrow points={[[X[k] + 68, 52], [X[k + 1] - 68, 52]]} seed={seedOf(`ea-${k}`)} stroke="var(--muted)" />}
              </g>
            );
          })}
          <Meter x={180} label="Retrieval: recall@5" v={s.recall} good={(s.recall ?? 0) >= 0.9} />
          <Meter x={540} label="Generation: faithfulness" v={s.faith} good={(s.faith ?? 0) >= 0.9} />
          {s.tag && <HandText x={360} y={110} size={TEXT_SIZES.heading} color="var(--accent)">{s.tag}</HandText>}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
