import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

type N = { id: string; x: number; y: number; c: number };
const NODES: N[] = [
  { id: 'Acme', x: 110, y: 70, c: 0 },
  { id: 'Supplier Co', x: 60, y: 150, c: 0 },
  { id: 'Late penalty', x: 170, y: 190, c: 0 },
  { id: 'Beta Ltd', x: 340, y: 70, c: 1 },
  { id: 'Breach clause', x: 310, y: 160, c: 1 },
  { id: 'Insurer', x: 410, y: 195, c: 1 },
  { id: 'Gamma Inc', x: 580, y: 70, c: 2 },
  { id: 'Termination', x: 640, y: 150, c: 2 },
  { id: 'Notice period', x: 540, y: 195, c: 2 },
];
const EDGES: [string, string][] = [
  ['Acme', 'Supplier Co'], ['Acme', 'Late penalty'], ['Supplier Co', 'Late penalty'],
  ['Beta Ltd', 'Breach clause'], ['Breach clause', 'Insurer'], ['Beta Ltd', 'Insurer'],
  ['Gamma Inc', 'Termination'], ['Termination', 'Notice period'], ['Gamma Inc', 'Notice period'],
  ['Acme', 'Beta Ltd'], ['Beta Ltd', 'Gamma Inc'],
];
const TONES = ['var(--accent)', 'var(--ok)', 'var(--warn)'];
const SUMS = ['supply contracts:\nlate penalties', 'data contracts:\nbreach and cover', 'exit terms:\nnotice and ending'];
const SX = [120, 360, 600];
const byId = (id: string) => NODES.find((n) => n.id === id)!;

interface Step {
  caption: string;
  stage: 'docs' | 'entities' | 'graph' | 'comm' | 'sum' | 'global' | 'local';
}
const steps: Step[] = [
  { caption: 'A corpus of contracts, about 1 million tokens in the GraphRAG paper\'s tests. The index must prepare for questions about single facts and questions about the whole set. Plain vector RAG prepares for the first kind only.', stage: 'docs' },
  { caption: 'Step 1 of indexing: an LLM reads every chunk and lists the entities (companies, clauses, people) and relationships it finds. This is an LLM call per chunk, over the whole corpus. That is why GraphRAG indexing is heavy.', stage: 'entities' },
  { caption: 'Step 2: the entities become nodes and the relationships become edges. Names that repeat across documents merge into one node. You now have a graph of the corpus, not a list of chunks.', stage: 'graph' },
  { caption: 'Step 3: a clustering method (the GraphRAG docs name Leiden) splits the graph into communities of densely linked nodes, in levels from small to large. Here three communities appear. A few edges cross between them.', stage: 'comm' },
  { caption: 'Step 4: an LLM writes a summary of each community, bottom-up, and the summaries are stored. All of this happens at index time, before any question. A summary is a small text that covers many documents.', stage: 'sum' },
  { caption: 'Global question: "What are the main themes?" No chunk holds the answer. Global search asks each community summary for a partial answer (map), then combines the partial answers into one reply (reduce). Top-k chunk search would return a few chunks from one corner.', stage: 'global' },
  { caption: 'Local question: "What penalty does Acme owe?" is about one entity. Local search starts at the Acme node and fans out to its neighbours and their text. Ordinary vector RAG also does well here, at far lower index cost. Pick the mode by question type.', stage: 'local' },
];

export default function Ai5GraphWalk() {
  return (
    <AnimFrame title="GraphRAG: from contracts to community summaries" steps={steps} interval={6500}>
      {(_, s) => {
        const st = s.stage;
        const showNodes = st !== 'docs';
        const showEdges = !['docs', 'entities'].includes(st);
        const col = (n: N) => (['comm', 'sum', 'global'].includes(st) ? TONES[n.c] : st === 'local' ? (['Acme', 'Supplier Co', 'Late penalty', 'Beta Ltd'].includes(n.id) ? 'var(--accent)' : 'var(--muted)') : 'var(--muted)');
        return (
          <SketchSvg width={720} height={420} label="Entity graph built from a corpus, grouped into communities with summaries">
            {st === 'docs' &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <g key={i}>
                  <SketchBox cx={80 + i * 112} cy={110} w={92} h={60} r={8} seed={seedOf(`doc-${i}`)} stroke="var(--muted)" />
                  <HandText x={80 + i * 112} y={111} size={TEXT_SIZES.label} color="var(--fg)">{`contract ${i + 1}`}</HandText>
                </g>
              ))}
            {st === 'docs' && <HandText x={360} y={200} size={TEXT_SIZES.label} color="var(--muted)">six of many contracts</HandText>}
            {showEdges &&
              EDGES.map(([a, b], i) => {
                const A = byId(a);
                const B = byId(b);
                return <SketchArrow key={i} points={[[A.x, A.y], [B.x, B.y]]} head="none" seed={seedOf(`e-${i}`)} stroke="var(--muted)" />;
              })}
            {showNodes &&
              NODES.map((n) => (
                <g key={n.id}>
                  <SketchEllipse cx={n.x} cy={n.y} w={112} h={42} seed={seedOf(`n-${n.id}`)} stroke={col(n)} fill={col(n) === 'var(--muted)' ? 'var(--bg)' : col(n)} strokeWidth={st === 'local' && n.id === 'Acme' ? 2.2 : 1.4} />
                  <HandText x={n.x} y={n.y + 1} size={TEXT_SIZES.note} color="var(--fg)">{n.id}</HandText>
                </g>
              ))}
            {(st === 'sum' || st === 'global') &&
              SUMS.map((t, i) => (
                <g key={i}>
                  <SketchBox cx={SX[i]} cy={290} w={190} h={60} r={8} seed={seedOf(`sum-${i}`)} stroke={TONES[i]} fill={TONES[i]} />
                  <HandText x={SX[i]} y={290} size={TEXT_SIZES.note} color="var(--fg)">{t}</HandText>
                </g>
              ))}
            {st === 'global' && (
              <>
                {SX.map((x, i) => (
                  <SketchArrow key={i} points={[[x, 322], [360 + (x - 360) * 0.3, 358]]} seed={seedOf(`ga-${i}`)} stroke={TONES[i]} />
                ))}
                <SketchBox cx={360} cy={388} w={360} h={44} r={8} seed={seedOf('ga-ans')} stroke="var(--ok)" strokeWidth={2.2} />
                <HandText x={360} y={388} size={TEXT_SIZES.label} color="var(--fg)">combine partial answers: top themes</HandText>
              </>
            )}
            {st === 'local' && <HandText x={360} y={300} size={TEXT_SIZES.label} color="var(--accent)">start at Acme, read its neighbours</HandText>}
            {st === 'entities' && <HandText x={360} y={300} size={TEXT_SIZES.label} color="var(--muted)">one LLM pass over every chunk</HandText>}
            {st === 'graph' && <HandText x={360} y={300} size={TEXT_SIZES.label} color="var(--muted)">nodes and edges, no groups yet</HandText>}
            {st === 'comm' && <HandText x={360} y={300} size={TEXT_SIZES.label} color="var(--muted)">colour = community</HandText>}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
