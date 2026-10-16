import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';
import { FAIL } from './Ai5ChunkMath';

/** A 12-sentence document. The rule sits in sentences 7 and 8 (index 6 and 7). Illustrative. */
const RULE: [number, number] = [6, 8];
const X0 = 40;
const U = 640 / 12;

interface Chunk {
  a: number;
  b: number;
  row?: number;
}
const METHODS: Record<string, Chunk[]> = {
  fixed: [{ a: 0, b: 3.5 }, { a: 3.5, b: 7 }, { a: 7, b: 10.5 }, { a: 10.5, b: 12 }],
  recursive: [{ a: 0, b: 4 }, { a: 4, b: 8 }, { a: 8, b: 12 }],
  semantic: [{ a: 0, b: 3 }, { a: 3, b: 8 }, { a: 8, b: 12 }],
  overlap: [{ a: 0, b: 3.5, row: 0 }, { a: 2.5, b: 7, row: 1 }, { a: 6, b: 10.5, row: 0 }, { a: 9.5, b: 12, row: 1 }],
};

interface Step {
  caption: string;
  view: 'chunks' | 'ctx' | 'fail';
  method?: keyof typeof METHODS;
  ctx?: boolean;
  label?: string;
}

const steps: Step[] = [
  {
    caption: 'A document of 12 sentences (illustrative). One rule you need to answer questions sits in sentences 7 and 8. A retrieval index cannot read the whole document. It must cut it into chunks, and each chunk is embedded and found on its own.',
    view: 'chunks',
    label: 'the document, before cutting',
  },
  {
    caption: 'Fixed-size chunking cuts every N tokens, whatever the text says. Here the cut falls between sentences 7 and 8. The rule is split over two chunks. A search for it finds half of the rule in each, and neither chunk answers the question alone.',
    view: 'chunks',
    method: 'fixed',
    label: 'fixed size: cuts mid-rule',
  },
  {
    caption: 'Recursive chunking tries to split on the biggest natural boundary first (paragraph, then sentence, then word) and only goes smaller when a piece is still too big. Here the paragraph breaks fall at sentences 4 and 8, so the rule stays whole in chunk 2.',
    view: 'chunks',
    method: 'recursive',
    label: 'recursive: splits on structure',
  },
  {
    caption: 'Semantic chunking cuts where the topic changes, found by comparing embeddings of neighbouring sentences. Chunk sizes vary. The rule is whole again. The cost is an embedding pass over the document before you even index it.',
    view: 'chunks',
    method: 'semantic',
    label: 'semantic: cuts at topic shifts',
  },
  {
    caption: 'Overlap is the cheap fix for fixed cuts. Each chunk repeats the last sentence of the one before. Chunk 3 now holds sentences 7 and 8 together. The price: those repeated sentences are embedded and stored twice. In the Chroma test, overlap barely moved recall.',
    view: 'chunks',
    method: 'overlap',
    label: 'fixed + overlap: repeats text',
  },
  {
    caption: 'A different problem: a chunk that is cut well can still lose its subject. This chunk says "revenue grew 3% over the previous quarter". It names no company and no year. The query asks about ACME in Q2 2023. The chunk is not close to the query in embedding space and not a BM25 match either.',
    view: 'ctx',
    ctx: false,
  },
  {
    caption: 'Contextual retrieval asks an LLM to write 1 or 2 sentences that place the chunk in its document, then prepends them before embedding and before BM25 indexing. Now the chunk text holds "ACME" and "Q2 2023", and both searches find it. This runs once per chunk at index time.',
    view: 'ctx',
    ctx: true,
  },
  {
    caption: 'Anthropic measured the effect on top-20 retrieval failures (1 minus recall@20): 5.7% with plain embeddings, 3.7% with contextual embeddings, 2.9% adding contextual BM25, 1.9% adding a reranker. Each stage removes failures. Lesson A5.5 adds the BM25 half and lesson A5.6 the reranker.',
    view: 'fail',
  },
];

export default function Ai5ChunkWalk() {
  return (
    <AnimFrame title="Cutting a document, then fixing the lost context" steps={steps} interval={6500}>
      {(_, s) => {
        if (s.view === 'fail') {
          const base = 270;
          const sc = 36;
          return (
            <SketchSvg width={720} height={330} label="Top-20 retrieval failure rate for four setups">
              <HandText x={360} y={26} size={TEXT_SIZES.heading} color="var(--fg)">top-20 failure rate (lower is better)</HandText>
              {FAIL.map((f, i) => {
                const cx = 110 + i * 166;
                const h = f.v * sc;
                const last = i === FAIL.length - 1;
                return (
                  <g key={f.label}>
                    <SketchBox cx={cx} cy={base - h / 2} w={90} h={h} r={6} seed={seedOf(`fail-${i}`)} stroke={last ? 'var(--ok)' : 'var(--accent)'} fill={last ? 'var(--ok)' : 'var(--accent)'} />
                    <HandText x={cx} y={base - h - 16} size={TEXT_SIZES.heading} mono color={last ? 'var(--ok)' : 'var(--fg)'}>{`${f.v}%`}</HandText>
                    <HandText x={cx} y={base + 28} size={TEXT_SIZES.note} color="var(--muted)">{f.label.replace('+ ', '+ \n').replace('Embeddings only', 'embeddings\nonly')}</HandText>
                  </g>
                );
              })}
            </SketchSvg>
          );
        }
        if (s.view === 'ctx') {
          const ok = s.ctx!;
          return (
            <SketchSvg width={720} height={330} label="One chunk before and after a context prefix">
              <SketchBox cx={360} cy={50} w={640} h={44} r={8} seed={seedOf('cq')} stroke="var(--accent)" />
              <HandText x={360} y={50} size={TEXT_SIZES.label} color="var(--fg)">query: how much did ACME revenue grow in Q2 2023?</HandText>
              <SketchArrow points={[[360, 78], [360, 126]]} seed={seedOf('ca')} stroke={ok ? 'var(--ok)' : 'var(--bad)'} dashed={!ok} />
              <HandText x={450} y={102} anchor="start" size={TEXT_SIZES.note} color={ok ? 'var(--ok)' : 'var(--bad)'}>{ok ? 'match: ACME, Q2 2023' : 'no match: no entity, no year'}</HandText>
              {ok && (
                <>
                  <SketchBox cx={360} cy={168} w={640} h={60} r={8} seed={seedOf('cp')} stroke="var(--warn)" fill="var(--warn)" />
                  <HandText x={360} y={168} size={TEXT_SIZES.label} color="var(--fg)">{'prefix: this chunk is from ACME Corp\'s Q2 2023 report;\nthe previous quarter\'s revenue was $314 million.'}</HandText>
                </>
              )}
              <SketchBox cx={360} cy={ok ? 244 : 190} w={640} h={44} r={8} seed={seedOf('cc')} stroke={ok ? 'var(--ok)' : 'var(--bad)'} />
              <HandText x={360} y={ok ? 244 : 190} size={TEXT_SIZES.label} color="var(--fg)">The company's revenue grew by 3% over the previous quarter.</HandText>
              <HandText x={360} y={ok ? 304 : 258} size={TEXT_SIZES.note} color="var(--muted)">illustrative text, after the example in Anthropic's post</HandText>
            </SketchSvg>
          );
        }
        const chunks = s.method ? METHODS[s.method] : [];
        const ov = s.method === 'overlap';
        return (
          <SketchSvg width={720} height={300} label="A 12-sentence document cut into chunks">
            <HandText x={X0} y={26} anchor="start" size={TEXT_SIZES.note} color="var(--muted)">sentences</HandText>
            {Array.from({ length: 12 }, (_, i) => {
              const rule = i >= RULE[0] && i < RULE[1];
              return (
                <g key={i}>
                  <SketchBox cx={X0 + (i + 0.5) * U} cy={62} w={U - 4} h={36} r={6} seed={seedOf(`sent-${i}`)} stroke={rule ? 'var(--accent)' : 'var(--muted)'} fill={rule ? 'var(--accent)' : undefined} />
                  <HandText x={X0 + (i + 0.5) * U} y={63} size={TEXT_SIZES.note} mono color={rule ? 'var(--accent)' : 'var(--muted)'}>{String(i + 1)}</HandText>
                </g>
              );
            })}
            <HandText x={X0 + 7 * U} y={102} size={TEXT_SIZES.note} color="var(--accent)">the rule</HandText>
            {chunks.map((c, i) => {
              const full = c.a <= RULE[0] && c.b >= RULE[1];
              const part = !full && c.a < RULE[1] && c.b > RULE[0];
              const tone = full ? 'var(--ok)' : part ? 'var(--bad)' : 'var(--muted)';
              const cy = ov ? 160 + (c.row ?? 0) * 56 : 160;
              return (
                <g key={i}>
                  <SketchBox cx={X0 + ((c.a + c.b) / 2) * U} cy={cy} w={(c.b - c.a) * U - 4} h={44} r={8} seed={seedOf(`chunk-${s.method}-${i}`)} stroke={tone} fill={full || part ? tone : undefined} strokeWidth={full ? 2.2 : 1.4} />
                  <HandText x={X0 + ((c.a + c.b) / 2) * U} y={cy + 1} size={TEXT_SIZES.label} color="var(--fg)">{`chunk ${i + 1}`}</HandText>
                </g>
              );
            })}
            {!s.method && <HandText x={360} y={170} size={TEXT_SIZES.label} color="var(--muted)">no chunks yet</HandText>}
            <HandText x={360} y={272} size={TEXT_SIZES.label} color="var(--accent)">{s.label ?? ''}</HandText>
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
