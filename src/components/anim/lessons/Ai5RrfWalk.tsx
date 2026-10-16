import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { fuse, rrf } from './Ai5RrfMath';

/** Illustrative documents with their rank in each list. null = not in that list's top 5. */
const DOCS = [
  { id: 'A', ranks: [1, 4] as (number | null)[] },
  { id: 'B', ranks: [2, null] as (number | null)[] },
  { id: 'C', ranks: [3, 1] as (number | null)[] },
  { id: 'D', ranks: [null, 2] as (number | null)[] },
  { id: 'E', ranks: [5, 3] as (number | null)[] },
  { id: 'F', ranks: [4, 5] as (number | null)[] },
];
const K = 60;
const byList = (i: number) => DOCS.filter((d) => d.ranks[i] != null).sort((a, b) => a.ranks[i]! - b.ranks[i]!);
const fused = fuse(DOCS, K);
const f4 = (v: number) => v.toFixed(4);

interface Step {
  caption: string;
  stage: 'lists' | 'doc' | 'all' | 'final';
}

const steps: Step[] = [
  { caption: 'Two searches ran on the same query. The dense (vector) search ranks by meaning. The BM25 search ranks by matching words. Each list is top 5, and each gives a rank, not a comparable score. A cosine score and a BM25 score live on different scales, so you cannot add them.', stage: 'lists' },
  { caption: 'RRF uses only ranks. Each list gives a document 1 / (k + rank) points, with k = 60. Take document A: rank 1 in dense gives 1/61 = 0.0164. Rank 4 in BM25 gives 1/64 = 0.0156. A scores 0.0164 + 0.0156 = 0.0320.', stage: 'doc' },
  { caption: 'Do the same for every document. A document missing from a list adds 0 for that list: B scores 1/62 = 0.0161 from dense alone. C is rank 3 and rank 1: 1/63 + 1/61 = 0.0323. D is only in BM25 at rank 2: 1/62 = 0.0161.', stage: 'all' },
  { caption: 'Sort by fused score. C now beats A, though A topped the dense list. C was good in both lists, A was great in one and mild in the other. A document that both searches like rises. Documents found by one search only, like B and D, still appear in the list.', stage: 'final' },
];

export default function Ai5RrfWalk() {
  return (
    <AnimFrame title="Merging two ranked lists with RRF (k = 60)" steps={steps} interval={6500}>
      {(_, s) => {
        const col = (lst: number) => 90 + lst * 200;
        const showScores = s.stage === 'all' || s.stage === 'final';
        return (
          <SketchSvg width={720} height={380} label="Two ranked lists merged into one by reciprocal rank fusion">
            {[0, 1].map((l) => (
              <g key={l}>
                <HandText x={col(l)} y={24} size={TEXT_SIZES.heading} color="var(--muted)">{l === 0 ? 'dense' : 'BM25'}</HandText>
                {byList(l).map((d) => {
                  const r = d.ranks[l]!;
                  const hot = s.stage === 'doc' && d.id === 'A';
                  return (
                    <g key={d.id}>
                      <SketchBox cx={col(l)} cy={32 + r * 56} w={130} h={44} r={8} seed={seedOf(`l${l}-${d.id}`)} stroke={hot ? 'var(--accent)' : 'var(--muted)'} fill={hot ? 'var(--accent)' : undefined} strokeWidth={hot ? 2.2 : 1.4} />
                      <HandText x={col(l)} y={33 + r * 56} size={TEXT_SIZES.label} mono color="var(--fg)">{`${r}. doc ${d.id}`}</HandText>
                    </g>
                  );
                })}
              </g>
            ))}
            {s.stage === 'doc' && (
              <>
                <HandText x={480} y={92} anchor="start" size={TEXT_SIZES.label} color="var(--accent)">doc A, k = 60</HandText>
                <HandText x={480} y={130} anchor="start" size={TEXT_SIZES.label} mono color="var(--fg)">{`1/(60+1) = ${f4(1 / 61)}`}</HandText>
                <HandText x={480} y={162} anchor="start" size={TEXT_SIZES.label} mono color="var(--fg)">{`1/(60+4) = ${f4(1 / 64)}`}</HandText>
                <HandText x={480} y={202} anchor="start" size={TEXT_SIZES.heading} mono color="var(--ok)">{`sum = ${f4(rrf([1, 4], K))}`}</HandText>
              </>
            )}
            {showScores && (
              <>
                <SketchArrow points={[[420, 180], [460, 180]]} seed={seedOf('rrfarrow')} />
                <HandText x={580} y={24} size={TEXT_SIZES.heading} color="var(--muted)">{s.stage === 'final' ? 'fused order' : 'fused score'}</HandText>
                {(s.stage === 'final' ? fused : DOCS.map((d) => ({ ...d, score: rrf(d.ranks, K) }))).map((d, idx) => (
                  <g key={d.id}>
                    <SketchBox cx={580} cy={60 + idx * 50} w={190} h={40} r={8} seed={seedOf(`f-${d.id}`)} stroke={s.stage === 'final' && idx === 0 ? 'var(--ok)' : 'var(--muted)'} fill={s.stage === 'final' && idx === 0 ? 'var(--ok)' : undefined} />
                    <HandText x={580} y={61 + idx * 50} size={TEXT_SIZES.label} mono color="var(--fg)">{`${s.stage === 'final' ? `${idx + 1}. ` : ''}${d.id}  ${f4(d.score)}`}</HandText>
                  </g>
                ))}
              </>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
