import AnimFrame from '../AnimFrame';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Token ids below are illustrative. Real ids depend on the tokenizer. */
const TOKENS = [
  { t: 'The', id: 791 },
  { t: ' cat', id: 8415 },
  { t: ' sat', id: 7731 },
];

interface Step {
  caption: string;
  view: 'table' | 'ids' | 'lookup' | 'matrix' | 'learned';
}

const steps: Step[] = [
  {
    caption:
      'The embedding table is a 2D array with one row per token in the vocabulary and one column per model dimension. Llama 3 8B: 128,000 rows by 4,096 columns (paper Table 3). That is 128,000 × 4,096 = 524,288,000 numbers. At 2 bytes each (BF16) it takes about 1.05 GB.',
    view: 'table',
  },
  {
    caption: 'The tokenizer turns "The cat sat" into ids. These ids are illustrative; real ones depend on the tokenizer. The model never sees letters. It sees these integers.',
    view: 'ids',
  },
  {
    caption:
      'Each id is a row index. Token 791 reads row 791: table[791]. This is an array index, not a multiplication. The cost is one memory read of 4,096 numbers, so O(1) in the vocabulary size. It is the same as a key-value lookup.',
    view: 'lookup',
  },
  {
    caption:
      'Do this for every token and stack the rows. Three tokens give a 3 × 4,096 matrix. This matrix is the input to layer 1. A 1,000-token prompt gives 1,000 × 4,096 (4.1M numbers). Attention later mixes these rows.',
    view: 'matrix',
  },
  {
    caption:
      'The numbers in the table are learned. Training nudges each row so that tokens used in similar contexts get similar rows. Nobody writes the values by hand. Llama 3 8B also has an output table of the same shape. Our count (8.03B, matching the published 8B) assumes it is a separate table, so the two tables hold about 1.05B parameters.',
    view: 'learned',
  },
];

const ROWS = [
  { label: 'row 0', y: 70 },
  { label: 'row 1', y: 112 },
  { label: '...', y: 154 },
  { label: 'row 791', y: 196 },
  { label: '...', y: 238 },
  { label: 'row 127,999', y: 280 },
];

function Table({ hi, dim }: { hi: number | null; dim?: boolean }) {
  return (
    <g opacity={dim ? 0.55 : 1}>
      <HandText x={140} y={24} size={TEXT_SIZES.heading} color="var(--muted)">
        128,000 rows × 4,096 numbers
      </HandText>
      {ROWS.map((r, i) =>
        r.label === '...' ? (
          <HandText key={i} x={140} y={r.y} size={TEXT_SIZES.label} color="var(--muted)">
            ...
          </HandText>
        ) : (
          <g key={i}>
            <SketchBox cx={140} cy={r.y} w={200} h={34} r={6} seed={seedOf(`etab-${i}`)} stroke={hi === i ? 'var(--accent)' : 'var(--fg)'} strokeWidth={hi === i ? 2.2 : 1.4} fill={hi === i ? 'var(--accent)' : undefined} />
            <HandText x={140} y={r.y + 1} size={TEXT_SIZES.label} mono>
              {r.label}
            </HandText>
          </g>
        ),
      )}
    </g>
  );
}

export default function Ai1EmbedLookup() {
  return (
    <AnimFrame title="Embedding lookup: token id to vector" steps={steps} interval={4800}>
      {(_, s) => (
        <SketchSvg width={720} height={320} label="An embedding table with 128,000 rows and a looked-up row">
          {s.view === 'table' && (
            <>
              <Table hi={0} />
              <SketchBox cx={520} cy={150} w={300} h={110} r={8} seed={seedOf('esize')} stroke="var(--accent)" fill="var(--accent-soft)" />
              <HandText x={520} y={118} size={TEXT_SIZES.label}>
                128,000 × 4,096
              </HandText>
              <HandText x={520} y={148} size={TEXT_SIZES.label} mono>
                = 524,288,000 numbers
              </HandText>
              <HandText x={520} y={180} size={TEXT_SIZES.label} color="var(--accent)">
                × 2 bytes (BF16) ≈ 1.05 GB
              </HandText>
            </>
          )}
          {s.view === 'ids' && (
            <>
              <Table hi={null} dim />
              {TOKENS.map((tk, i) => (
                <g key={i}>
                  <SketchBox cx={400} cy={90 + i * 70} w={110} h={44} r={8} seed={seedOf(`etok-${i}`)} />
                  <HandText x={400} y={91 + i * 70} size={TEXT_SIZES.label} mono>
                    {JSON.stringify(tk.t)}
                  </HandText>
                  <SketchArrow points={[[462, 90 + i * 70], [520, 90 + i * 70]]} seed={seedOf(`eida-${i}`)} />
                  <SketchBox cx={580} cy={90 + i * 70} w={100} h={44} r={8} seed={seedOf(`eid-${i}`)} stroke="var(--accent)" />
                  <HandText x={580} y={91 + i * 70} size={TEXT_SIZES.label} mono color="var(--accent)">
                    {String(tk.id)}
                  </HandText>
                </g>
              ))}
              <HandText x={540} y={292} size={TEXT_SIZES.note} color="var(--muted)">
                ids are illustrative
              </HandText>
            </>
          )}
          {s.view === 'lookup' && (
            <>
              <Table hi={3} />
              <HandText x={360} y={170} size={TEXT_SIZES.label} mono color="var(--accent)">
                table[791]
              </HandText>
              <SketchArrow points={[[250, 196], [470, 196]]} stroke="var(--accent)" strokeWidth={2.2} seed={seedOf('elk2')} />
              {[0, 1, 2, 3, 4].map((k) => (
                <g key={k}>
                  <SketchBox cx={500 + k * 38} cy={196} w={34} h={34} r={6} seed={seedOf(`evc-${k}`)} stroke="var(--accent)" fill={k === 4 ? undefined : 'var(--accent-soft)'} dashed={k === 4} />
                  <HandText x={500 + k * 38} y={197} size={TEXT_SIZES.note} mono>
                    {['.12', '-.4', '.03', '.9', '...'][k]}
                  </HandText>
                </g>
              ))}
              <HandText x={600} y={238} size={TEXT_SIZES.label} color="var(--accent)">
                one vector, 4,096 numbers
              </HandText>
              <HandText x={600} y={160} size={TEXT_SIZES.note} color="var(--muted)">
                values illustrative
              </HandText>
            </>
          )}
          {s.view === 'matrix' && (
            <>
              <HandText x={360} y={24} size={TEXT_SIZES.heading} color="var(--muted)">
                Input to layer 1: one row per token
              </HandText>
              {TOKENS.map((tk, i) => (
                <g key={i}>
                  <HandText x={150} y={90 + i * 56} size={TEXT_SIZES.label} mono anchor="end">
                    {`${JSON.stringify(tk.t)} (${tk.id})`}
                  </HandText>
                  <SketchBox cx={410} cy={90 + i * 56} w={400} h={40} r={6} seed={seedOf(`emx-${i}`)} stroke="var(--ok)" fill="var(--ok)" />
                  <HandText x={410} y={91 + i * 56} size={TEXT_SIZES.label} mono>
                    row of 4,096 numbers
                  </HandText>
                </g>
              ))}
              <HandText x={410} y={272} size={TEXT_SIZES.label} color="var(--accent)">
                3 × 4,096 matrix: n tokens × d_model
              </HandText>
            </>
          )}
          {s.view === 'learned' && (
            <>
              <Table hi={null} />
              <SketchBox cx={520} cy={120} w={300} h={60} r={8} seed={seedOf('ela')} stroke="var(--ok)" fill="var(--ok)" />
              <HandText x={520} y={121} size={TEXT_SIZES.label}>
                Input table: 0.52B parameters
              </HandText>
              <SketchBox cx={520} cy={196} w={300} h={60} r={8} seed={seedOf('elb')} stroke="var(--warn)" fill="var(--warn)" />
              <HandText x={520} y={197} size={TEXT_SIZES.label}>
                Output table: 0.52B parameters
              </HandText>
              <HandText x={520} y={254} size={TEXT_SIZES.note} color="var(--muted)">
                same shape, different learned values (Llama 3 8B)
              </HandText>
            </>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
