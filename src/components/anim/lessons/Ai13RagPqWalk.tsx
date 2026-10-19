import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchEllipse, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { M, NLIST, NPROBE, candidates, lookups, subDims, tableCells } from './Ai13RagPqMath';

/**
 * Query-by-image neighbours with IVF and product quantization (PQ), for the visual search drill.
 * nlist (262,144) and nprobe (32) are ILLUSTRATIVE. 512 dims, 64 pieces of 8 numbers, 8 bits per piece (256 centroids per piece).
 */

const fmt = (n: number) => n.toLocaleString('en-US');
const CAND = candidates();
const LOOK = lookups();

interface Step {
  caption: string;
  stage: number;
}

const steps: Step[] = [
  { stage: 0, caption: 'A user uploads a photo. The image encoder turns it into one vector of 512 numbers. A text query such as "red bicycle" would pass through the text encoder of the same model and land in the same space. That shared space is why one index can answer both kinds of query.' },
  { stage: 1, caption: `The index has 500 million vectors, so it cannot compare the query with all of them. IVF (inverted file) splits the space into ${fmt(NLIST)} cells (illustrative). The query visits only the ${NPROBE} nearest cells. That is about ${fmt(CAND)} candidates. The picture draws 12 cells and visits 3.` },
  { stage: 2, caption: `Inside a cell, every stored vector is a short code, not 512 numbers. PQ cut the 512 numbers into ${M} pieces of ${subDims()} numbers. For each piece it kept only the number of the nearest of 256 learned centroids. One byte holds a number from 0 to 255, so a vector is ${M} bytes.` },
  { stage: 3, caption: `For this query, the system builds one table before it scans: the distance from each of the query's ${M} pieces to each of the 256 centroids of that piece. That is ${M} x 256 = ${fmt(tableCells())} distances, built once per query.` },
  { stage: 4, caption: `To score one candidate, read its ${M} code bytes. Each byte picks one number from the table. Add the ${M} numbers. That is the approximate distance, with no multiplication over 512 dimensions. ${fmt(CAND)} candidates x ${M} lookups = ${fmt(LOOK)} lookups for the query.` },
  { stage: 5, caption: 'Keep the best candidates by approximate distance. Codes lose precision, so a second step re-scores the best 100 with their full vectors, read from disk: 100 x 2,048 bytes = about 205 KB. Then the thumbnails go back to the user, nearest first.' },
];

const CELLS: [number, number][] = [
  [90, 110], [170, 90], [250, 120], [330, 95], [410, 115], [490, 90],
  [110, 200], [200, 225], [290, 205], [380, 230], [470, 205], [550, 225],
];
const HIT = [3, 4, 9];

export default function Ai13RagPqWalk() {
  return (
    <AnimFrame title="Finding the nearest images among 500 million" steps={steps} interval={6500}>
      {(_, s) => {
        const st = s.stage;
        return (
          <SketchSvg width={720} height={320} label={`Visual search with IVF and product quantization, stage ${st + 1} of 6.`}>
            {st === 0 && (
              <>
                <SketchBox cx={120} cy={150} w={140} h={110} r={8} seed={seedOf('pq-img')} stroke="var(--accent)" fill="var(--accent-soft)" />
                <HandText x={120} y={150} size={TEXT_SIZES.label}>Query photo</HandText>
                <SketchArrow points={[[200, 150], [290, 150]]} seed={seedOf('pq-a0')} stroke="var(--accent)" />
                <HandText x={245} y={130} size={TEXT_SIZES.note} color="var(--muted)">encoder</HandText>
                <SketchBox cx={440} cy={150} w={250} h={70} r={8} seed={seedOf('pq-vec')} stroke="var(--accent)" />
                <HandText x={440} y={140} size={TEXT_SIZES.label} mono color="var(--accent)">[ 512 numbers ]</HandText>
                <HandText x={440} y={165} size={TEXT_SIZES.note} color="var(--muted)">512 x 4 bytes = 2,048 bytes</HandText>
                <HandText x={360} y={250} size={TEXT_SIZES.label} color="var(--muted)">text query: same space, other encoder</HandText>
              </>
            )}
            {st === 1 && (
              <>
                <HandText x={24} y={30} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Space split into cells (12 drawn)</HandText>
                {CELLS.map(([x, y], i) => (
                  <SketchEllipse key={i} cx={x} cy={y} w={74} h={62} seed={seedOf(`pq-c${i}`)} stroke={HIT.includes(i) ? 'var(--accent)' : 'var(--muted)'} fill={HIT.includes(i) ? 'var(--accent)' : undefined} strokeWidth={HIT.includes(i) ? 2.2 : 1.4} />
                ))}
                <HandText x={640} y={110} size={TEXT_SIZES.label} mono color="var(--accent)">{`probe ${NPROBE}`}</HandText>
                <HandText x={640} y={138} size={TEXT_SIZES.note} color="var(--muted)">of 262,144 cells</HandText>
                <HandText x={640} y={200} size={TEXT_SIZES.label} mono color="var(--ok)">{`~${fmt(CAND)}`}</HandText>
                <HandText x={640} y={228} size={TEXT_SIZES.note} color="var(--muted)">candidates scanned</HandText>
                <HandText x={360} y={290} size={TEXT_SIZES.note} color="var(--muted)">500,000,000 / 262,144 = about 1,907 vectors per cell</HandText>
              </>
            )}
            {st === 2 && (
              <>
                <HandText x={24} y={30} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">One stored vector</HandText>
                {Array.from({ length: 8 }, (_, i) => (
                  <SketchBox key={i} cx={80 + i * 80} cy={95} w={72} h={44} r={6} seed={seedOf(`pq-p${i}`)} stroke="var(--muted)" />
                ))}
                <HandText x={360} y={95} size={TEXT_SIZES.label} color="var(--muted)">pieces of 8 numbers each (8 of 64 drawn)</HandText>
                {Array.from({ length: 8 }, (_, i) => (
                  <SketchArrow key={i} points={[[80 + i * 80, 120], [80 + i * 80, 170]]} seed={seedOf(`pq-d${i}`)} stroke="var(--accent)" />
                ))}
                {['17', '203', '4', '88', '251', '9', '130', '66'].map((v, i) => (
                  <g key={i}>
                    <SketchBox cx={80 + i * 80} cy={195} w={64} h={44} r={6} seed={seedOf(`pq-b${i}`)} stroke="var(--accent)" fill="var(--accent-soft)" />
                    <HandText x={80 + i * 80} y={195} size={TEXT_SIZES.label} mono>{v}</HandText>
                  </g>
                ))}
                <HandText x={360} y={255} size={TEXT_SIZES.label} color="var(--accent)">64 pieces x 8 bits = 64 bytes (illustrative byte values)</HandText>
                <HandText x={360} y={285} size={TEXT_SIZES.note} color="var(--muted)">2,048 bytes down to 64, which is 32 times smaller</HandText>
              </>
            )}
            {st === 3 && (
              <>
                <HandText x={24} y={30} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Distance table for this query</HandText>
                {Array.from({ length: 5 }, (_, r) =>
                  Array.from({ length: 8 }, (_, c) => (
                    <SketchBox key={`${r}-${c}`} cx={110 + c * 56} cy={80 + r * 44} w={50} h={36} r={6} seed={seedOf(`pq-t${r}-${c}`)} stroke={c === 7 ? 'var(--muted)' : 'var(--accent)'} />
                  )),
                )}
                <HandText x={560} y={120} size={TEXT_SIZES.label} color="var(--muted)">columns: 256 centroids</HandText>
                <HandText x={560} y={150} size={TEXT_SIZES.label} color="var(--muted)">rows: 64 pieces</HandText>
                <HandText x={560} y={200} size={TEXT_SIZES.label} mono color="var(--accent)">64 x 256</HandText>
                <HandText x={560} y={228} size={TEXT_SIZES.label} mono color="var(--accent)">= 16,384</HandText>
                <HandText x={360} y={300} size={TEXT_SIZES.note} color="var(--muted)">Built once per query. Each cell: distance from the query piece to that centroid.</HandText>
              </>
            )}
            {st === 4 && (
              <>
                <HandText x={24} y={30} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Scoring one candidate</HandText>
                {['17', '203', '4', '88'].map((v, i) => (
                  <g key={i}>
                    <SketchBox cx={90 + i * 90} cy={90} w={64} h={44} r={6} seed={seedOf(`pq-k${i}`)} stroke="var(--accent)" fill="var(--accent-soft)" />
                    <HandText x={90 + i * 90} y={90} size={TEXT_SIZES.label} mono>{v}</HandText>
                    <SketchArrow points={[[90 + i * 90, 116], [90 + i * 90, 168]]} seed={seedOf(`pq-ka${i}`)} stroke="var(--accent)" />
                    <SketchBox cx={90 + i * 90} cy={195} w={64} h={44} r={6} seed={seedOf(`pq-kt${i}`)} stroke="var(--ok)" />
                    <HandText x={90 + i * 90} y={195} size={TEXT_SIZES.label} mono color="var(--ok)">{['0.8', '2.1', '0.3', '1.4'][i]}</HandText>
                  </g>
                ))}
                <HandText x={420} y={90} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">... 64 bytes in all</HandText>
                <HandText x={420} y={195} anchor="start" size={TEXT_SIZES.label} color="var(--muted)">... 64 values</HandText>
                <SketchArrow points={[[540, 195], [585, 195]]} seed={seedOf('pq-sum')} stroke="var(--ok)" />
                <SketchBox cx={650} cy={195} w={100} h={60} r={8} seed={seedOf('pq-sumb')} stroke="var(--ok)" />
                <HandText x={650} y={185} size={TEXT_SIZES.note} color="var(--muted)">sum</HandText>
                <HandText x={650} y={207} size={TEXT_SIZES.label} mono color="var(--ok)">distance</HandText>
                <HandText x={360} y={250} size={TEXT_SIZES.note} color="var(--muted)">table values are illustrative</HandText>
                <HandText x={360} y={290} size={TEXT_SIZES.label} mono color="var(--accent)">{`${fmt(CAND)} x 64 = ${fmt(LOOK)} lookups`}</HandText>
              </>
            )}
            {st === 5 && (
              <>
                <HandText x={24} y={30} anchor="start" size={TEXT_SIZES.heading} color="var(--muted)">Results, nearest first</HandText>
                {[0.21, 0.27, 0.31, 0.44].map((d, i) => (
                  <g key={i}>
                    <SketchBox cx={100 + i * 120} cy={110} w={96} h={80} r={8} seed={seedOf(`pq-r${i}`)} stroke={i === 0 ? 'var(--ok)' : 'var(--muted)'} fill={i === 0 ? 'var(--ok)' : undefined} />
                    <HandText x={100 + i * 120} y={110} size={TEXT_SIZES.label}>{`photo ${i + 1}`}</HandText>
                    <HandText x={100 + i * 120} y={166} size={TEXT_SIZES.note} mono color="var(--muted)">{`d = ${d.toFixed(2)}`}</HandText>
                  </g>
                ))}
                <HandText x={600} y={100} size={TEXT_SIZES.label} color="var(--muted)">distances are</HandText>
                <HandText x={600} y={124} size={TEXT_SIZES.label} color="var(--muted)">illustrative</HandText>
                <SketchBox cx={360} cy={250} w={560} h={56} r={8} seed={seedOf('pq-rr')} stroke="var(--accent)" />
                <HandText x={360} y={250} size={TEXT_SIZES.label} color="var(--accent)">re-score the best 100 with full vectors: 100 x 2,048 B = 205 KB</HandText>
              </>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
