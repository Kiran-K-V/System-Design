import AnimFrame from '../AnimFrame';
import { Fade } from '../data-kit';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

const DOCS = [
  { id: 1, text: 'Fast database writes', tokens: ['fast', 'database', 'writes'] },
  { id: 2, text: 'Indexes make reads fast', tokens: ['indexes', 'make', 'reads', 'fast'] },
  { id: 3, text: 'Slow writes hurt users', tokens: ['slow', 'writes', 'hurt', 'users'] },
];

const steps = [
  { caption: 'Three documents. Question: which documents contain the word "fast"? Scanning every document works for 3. For 3 billion it takes hours. We need an index: a structure built ahead of time that answers by lookup.' },
  { caption: 'Step 1: analyze each document. Split the text into words (tokens) and lowercase them. Real engines also remove stop words ("the") and stem words ("writes" to "write"). We skip those to keep it small.' },
  { caption: 'Step 2: index document 1. For each token, add the document id to that token’s posting list. The table is the inverted index: it maps word to documents. The "inverse" is that a normal index maps document to words.' },
  { caption: 'Step 3: index document 2. "fast" already exists, so its list grows to [1, 2]. "indexes", "make", "reads" are new rows. The term dictionary stays sorted, so finding a term is a binary search or a B-tree lookup.' },
  { caption: 'Step 4: index document 3. "writes" now lists documents 1 and 3. The index is built. Each posting list is sorted by document id, which makes the next step cheap.' },
  { caption: 'Query: fast AND writes. Look up each term (two cheap lookups). Intersect the sorted lists by walking them together: fast = [1, 2], writes = [1, 3]. Only 1 is in both. No document was scanned.' },
  { caption: 'Cost model: a query touches only the posting lists of its terms, not the corpus. The price is paid at write time: indexing one document updates one list per distinct word. Search engines such as Lucene (inside Elasticsearch) build on exactly this structure.' },
];

function termsFor(step: number) {
  const upTo = step >= 5 ? 3 : step - 1;
  const map = new Map<string, number[]>();
  for (const d of DOCS.slice(0, Math.max(0, upTo))) for (const t of d.tokens) map.set(t, [...(map.get(t) ?? []), d.id]);
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

export default function InvertedIndexBuild() {
  return (
    <AnimFrame title="Inverted index built from three documents" steps={steps} interval={3600}>
      {(i) => {
        const rows = i >= 2 ? termsFor(i) : [];
        const freshDoc = i >= 2 && i <= 4 ? i - 1 : 0;
        const freshTerms = new Set(freshDoc ? DOCS[freshDoc - 1].tokens : []);
        const queryTerms = new Set(i === 5 ? ['fast', 'writes'] : []);
        const ROWH = 30;
        const H = 392;
        return (
          <SketchSvg width={640} height={H} label="Three documents and the inverted index built from them">
            <HandText x={4} y={16} size={16} weight={700} anchor="start">
              Documents
            </HandText>
            {DOCS.map((d, k) => {
              const cy = 74 + k * 100;
              const on = freshDoc === d.id;
              return (
                <g key={d.id}>
                  <SketchBox cx={150} cy={cy} w={290} h={74} r={8} seed={seedOf('doc' + d.id)} stroke={on ? 'var(--accent)' : 'var(--fg)'} strokeWidth={on ? 2.2 : 1.4} fill={on ? 'var(--accent-soft)' : 'var(--surface)'} fillStyle="solid" />
                  <HandText x={20} y={cy - 14} size={16} anchor="start" weight={700}>
                    {`D${d.id}`}
                  </HandText>
                  <HandText x={52} y={cy - 14} size={16} anchor="start">
                    {d.text}
                  </HandText>
                  {i >= 1 && (
                    <Fade step={i} born={1}>
                      <HandText x={20} y={cy + 14} size={14.5} anchor="start" color="var(--muted)" mono>
                        {d.tokens.join(' ')}
                      </HandText>
                    </Fade>
                  )}
                </g>
              );
            })}

            <HandText x={340} y={16} size={16} weight={700} anchor="start">
              Inverted index
            </HandText>
            <HandText x={340} y={40} size={14} anchor="start" color="var(--muted)">
              term (sorted)
            </HandText>
            <HandText x={470} y={40} size={14} anchor="start" color="var(--muted)">
              posting list: doc ids
            </HandText>
            <line x1={336} x2={636} y1={50} y2={50} stroke="var(--border)" />
            {rows.length === 0 && (
              <HandText x={490} y={170} size={16} color="var(--muted)">
                empty
              </HandText>
            )}
            {rows.map(([term, ids], r) => {
              const y = 68 + r * ROWH;
              const fresh = freshTerms.has(term);
              const q = queryTerms.has(term);
              const color = q ? 'var(--accent)' : fresh ? 'var(--accent)' : 'var(--fg)';
              return (
                <Fade key={term} step={i} born={fresh ? i : -1}>
                  {(fresh || q) && <rect x={334} y={y - 14} width={304} height={26} rx={5} fill="var(--accent-soft)" />}
                  <HandText x={344} y={y} size={16} mono anchor="start" color={color} weight={fresh || q ? 700 : 400}>
                    {term}
                  </HandText>
                  <HandText x={470} y={y} size={16} mono anchor="start" color={color} weight={fresh || q ? 700 : 400}>
                    {`[${ids.join(', ')}]`}
                  </HandText>
                </Fade>
              );
            })}
            {i === 5 && (
              <Fade step={i} born={5}>
                <SketchArrow points={[[452, 68 + 1 * ROWH + 16], [452, 346]]} stroke="var(--accent)" head="none" seed={seedOf('qa')} />
                <SketchBox cx={520} cy={364} w={230} h={34} r={8} seed={seedOf('qres')} stroke="var(--ok)" fill="var(--surface)" fillStyle="solid" />
                <HandText x={520} y={364} size={15.5} weight={700} color="var(--ok)">
                  [1,2] ∩ [1,3] = [1]
                </HandText>
              </Fade>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
