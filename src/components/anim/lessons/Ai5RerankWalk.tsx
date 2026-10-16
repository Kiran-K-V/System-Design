import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Step {
  caption: string;
  view: 'rewrite' | 'funnel';
  /** rewrite: 0 raw query, 1 rewritten. funnel: 0 index, 1 stage 1, 2 stage 2, 3 keep top. */
  at: number;
}

const steps: Step[] = [
  { caption: 'A user types a follow-up in a chat: "and what about for annual plans?". Searched as it is, the words match nothing useful. Embedding the raw turn loses the topic, which sat in the earlier turn. Retrieval quality is capped before any index is touched. (Illustrative example.)', view: 'rewrite', at: 0 },
  { caption: 'Query rewriting asks a small LLM to turn the turn into a stand-alone query using the chat so far. The rewritten text carries the topic and the plan type. It costs one short LLM call before retrieval. Multi-query goes further: write 3 variants, search each, merge with RRF.', view: 'rewrite', at: 1 },
  { caption: 'Now retrieval. The index holds 1,000,000 chunks (illustrative). Every chunk vector was computed offline. A query is embedded once and compared against the index with an ANN search, as in lesson A5.2. Nothing here reads the query and a chunk together.', view: 'funnel', at: 0 },
  { caption: 'Stage 1 is fast and broad. Dense plus BM25 plus RRF returns the top 50. It is cheap per document, and it errs on the side of recall. The right chunk is in the 50, but at position 31. The LLM would see the wrong chunks first, or you would pay to send all 50.', view: 'funnel', at: 1 },
  { caption: 'Stage 2 is slow and exact. A cross-encoder reads the query and one chunk together, as one input, and outputs a relevance score. It runs 50 times, once per pair, and nothing can be precomputed because the query is new. The right chunk moves from position 31 to position 2.', view: 'funnel', at: 2 },
  { caption: 'Keep the top 5 and send only those to the LLM. The reranker cost is paid on 50 chunks. The savings come on the expensive model: it reads 5 chunks, not 50. The next calculator puts numbers on this.', view: 'funnel', at: 3 },
];

export default function Ai5RerankWalk() {
  return (
    <AnimFrame title="Rewrite the query, retrieve wide, rerank narrow" steps={steps} interval={6500}>
      {(_, s) => {
        if (s.view === 'rewrite') {
          const r = s.at === 1;
          return (
            <SketchSvg width={720} height={300} label="A vague follow-up question and its stand-alone rewrite">
              <HandText x={40} y={26} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">chat so far</HandText>
              <SketchBox cx={360} cy={62} w={640} h={44} r={8} seed={seedOf('rw-h')} stroke="var(--muted)" />
              <HandText x={360} y={62} size={TEXT_SIZES.label} color="var(--muted)">user: what is the refund policy for monthly plans?</HandText>
              <SketchBox cx={360} cy={128} w={640} h={44} r={8} seed={seedOf('rw-q')} stroke={r ? 'var(--muted)' : 'var(--bad)'} fill={r ? undefined : 'var(--bad)'} />
              <HandText x={360} y={128} size={TEXT_SIZES.label} color="var(--fg)">user: and what about for annual plans?</HandText>
              {r && (
                <>
                  <SketchArrow points={[[360, 154], [360, 188]]} seed={seedOf('rw-a')} stroke="var(--accent)" />
                  <HandText x={380} y={171} anchor="start" size={TEXT_SIZES.note} color="var(--accent)">rewrite with a small LLM</HandText>
                  <SketchBox cx={360} cy={226} w={640} h={44} r={8} seed={seedOf('rw-r')} stroke="var(--ok)" fill="var(--ok)" />
                  <HandText x={360} y={226} size={TEXT_SIZES.label} color="var(--fg)">refund policy for annual subscription plans</HandText>
                </>
              )}
              <HandText x={360} y={r ? 280 : 200} size={TEXT_SIZES.label} color={r ? 'var(--ok)' : 'var(--bad)'}>{r ? 'stand-alone query: searchable' : 'topic is missing: not searchable'}</HandText>
            </SketchSvg>
          );
        }
        const a = s.at;
        const rows = [
          { w: 560, y: 56, label: '1,000,000 chunks', sub: 'vectors precomputed', tone: a === 0 ? 'var(--accent)' : 'var(--muted)' },
          { w: 360, y: 150, label: 'top 50 candidates', sub: a >= 2 ? 'scored by cross-encoder' : 'right chunk at position 31', tone: a === 1 || a === 2 ? 'var(--accent)' : 'var(--muted)' },
          { w: 170, y: 244, label: 'top 5 to LLM', sub: 'right chunk now at 2', tone: a === 3 ? 'var(--ok)' : 'var(--muted)' },
        ];
        const show = [true, a >= 1, a >= 3];
        return (
          <SketchSvg width={720} height={310} label="Funnel from one million chunks to fifty candidates to five">
            {rows.map((r, i) =>
              show[i] ? (
                <g key={i}>
                  <SketchBox cx={310} cy={r.y} w={r.w} h={60} r={8} seed={seedOf(`fn-${i}`)} stroke={r.tone} fill={r.tone === 'var(--muted)' ? undefined : r.tone} strokeWidth={r.tone === 'var(--muted)' ? 1.4 : 2.2} />
                  <HandText x={310} y={r.y - 8} size={TEXT_SIZES.label} color="var(--fg)">{r.label}</HandText>
                  <HandText x={310} y={r.y + 14} size={TEXT_SIZES.note} color="var(--muted)">{r.sub}</HandText>
                </g>
              ) : null,
            )}
            {a >= 1 && <SketchArrow points={[[310, 88], [310, 118]]} seed={seedOf('fa1')} />}
            {a >= 3 && <SketchArrow points={[[310, 182], [310, 212]]} seed={seedOf('fa2')} />}
            {a >= 1 && <HandText x={510} y={104} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">stage 1: bi-encoder,</HandText>}
            {a >= 1 && <HandText x={510} y={124} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">fast, ~tens of ms</HandText>}
            {a >= 2 && <HandText x={510} y={176} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">stage 2: cross-encoder,</HandText>}
            {a >= 2 && <HandText x={510} y={196} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">slow per pair</HandText>}
            {a >= 1 && <HandText x={510} y={226} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">(latencies illustrative)</HandText>}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
