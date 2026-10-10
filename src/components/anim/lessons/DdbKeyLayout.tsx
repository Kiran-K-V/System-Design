import AnimFrame from '../AnimFrame';
import { TONE, type Tone } from '../FlowDiagram';
import { Fade } from '../data-kit';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** Table Orders: partition key userId, sort key orderDate. Dates are 2026, shown as MM-DD. */
interface Row {
  u: string;
  d: string;
  st: string;
  tone?: Tone;
  dashed?: boolean;
}

const r = (u: string, d: string, st: string, tone?: Tone, dashed?: boolean): Row => ({ u, d, st, tone, dashed });

interface Step {
  caption: string;
  /** Step 0 shows one flat list. Later steps show three partitions. */
  flat?: Row[];
  parts?: [Row[], Row[], Row[]];
  mutedParts?: number[];
  gsi?: { pending: Row[]; shipped: Row[] };
  note?: string;
  noteTone?: Tone;
}

const ORDER_U1 = [r('u1', '01-05', 'shipped'), r('u1', '02-10', 'pending'), r('u1', '03-02', 'shipped')];
const P1 = [r('u2', '01-20', 'pending'), r('u2', '02-14', 'shipped')];
const P3 = [r('u3', '02-01', 'shipped')];
const U1_ARRIVAL = [r('u1', '03-02', 'shipped'), r('u1', '01-05', 'shipped'), r('u1', '02-10', 'pending')];

const GSI_BEFORE = {
  pending: [r('u2', '01-20', 'pending'), r('u1', '02-10', 'pending')],
  shipped: [r('u1', '01-05', 'shipped'), r('u3', '02-01', 'shipped'), r('u2', '02-14', 'shipped'), r('u1', '03-02', 'shipped')],
};

const NEW_ROW = r('u3', '03-15', 'pending');

const steps: Step[] = [
  {
    caption: 'Table Orders. Each item has a primary key made of two parts. The partition key is userId. The sort key is orderDate. Together they must be unique. Six items sit here in the order they were written. DynamoDB will not keep them like this.',
    flat: [r('u1', '03-02', 'shipped'), r('u2', '01-20', 'pending'), r('u1', '01-05', 'shipped'), r('u3', '02-01', 'shipped'), r('u2', '02-14', 'shipped'), r('u1', '02-10', 'pending')],
  },
  {
    caption: 'DynamoDB uses the partition key value as input to an internal hash function. The hash decides which partition holds the item. All items with the same userId land in the same partition. Which partition gets which user is arbitrary. We drew one possible result.',
    parts: [P1, U1_ARRIVAL, P3],
  },
  {
    caption: 'Inside a partition, items with the same partition key are stored together, in sorted order by sort key. u1\'s three orders are now in date order. The sort key is what makes range queries cheap.',
    parts: [P1, ORDER_U1, P3],
  },
  {
    caption: 'Query: userId = u1 AND orderDate >= 02-01. DynamoDB hashes u1, goes to one partition, and reads one contiguous slice. It never looks at the other partitions. A query always names the partition key. Without it you would need a Scan, which reads everything.',
    parts: [P1, [ORDER_U1[0], { ...ORDER_U1[1], tone: 'accent' }, { ...ORDER_U1[2], tone: 'accent' }], P3],
    mutedParts: [0, 2],
    note: 'one partition, one slice',
    noteTone: 'accent',
  },
  {
    caption: 'New question: all pending orders, any user. userId is no help, so this would be a Scan. Add a global secondary index (GSI) with a different key: status as the partition key, orderDate as the sort key. The index is a second copy of the items, stored in its own partitions, with its own hash and sort order.',
    parts: [P1, ORDER_U1, P3],
    gsi: GSI_BEFORE,
    note: 'GSI: a separate copy, keyed by status',
    noteTone: 'accent',
  },
  {
    caption: 'A client writes a new item: u3, 03-15, pending. The base table write succeeds and the client gets its answer. The copy in the index is updated afterwards. For a short time a query on the GSI does not show the new item. All reads from a GSI are eventually consistent.',
    parts: [P1, ORDER_U1, [...P3, { ...NEW_ROW, tone: 'ok' }]],
    gsi: GSI_BEFORE,
    note: 'base table updated, GSI not yet',
    noteTone: 'warn',
  },
  {
    caption: 'The index catches up. Now the pending query finds u3, 03-15. The price of the GSI: every write to the base table also writes to the index, so a table with several GSIs spends more write capacity per item. You cannot ask a GSI for attributes it does not project.',
    parts: [P1, ORDER_U1, [...P3, { ...NEW_ROW, tone: 'ok' }]],
    gsi: { pending: [GSI_BEFORE.pending[0], GSI_BEFORE.pending[1], { ...NEW_ROW, tone: 'ok' }], shipped: GSI_BEFORE.shipped },
    note: 'index caught up',
    noteTone: 'ok',
  },
];

const PW = 200;
const PH = 128;
const PX = [110, 340, 570];
const PCY = 96;
const FLAT_X = [214, 290, 392];

function rowText(x: number, y: number, row: Row, anchor: 'start' | 'middle' | 'end', text: string, muted: boolean) {
  return (
    <HandText x={x} y={y} size={TEXT_SIZES.note} mono anchor={anchor} color={row.tone ? TONE[row.tone] : muted ? 'var(--muted)' : 'var(--fg)'}>
      {text}
    </HandText>
  );
}

export default function DdbKeyLayout() {
  return (
    <AnimFrame title="Primary key layout and a global secondary index" steps={steps} interval={4600}>
      {(i, s) => (
        <SketchSvg width={680} height={392} label="Items placed in partitions by hashing the partition key, sorted by sort key, and copied into a global secondary index">
          {s.flat && (
            <g>
              <SketchBox cx={340} cy={140} w={320} h={232} r={12} seed={seedOf('ddbflat')} stroke="var(--muted)" dashed />
              <HandText x={340} y={46} size={TEXT_SIZES.heading}>Orders, in write order</HandText>
              {['userId', 'orderDate', 'status'].map((h, c) => (
                <HandText key={h} x={FLAT_X[c]} y={80} size={TEXT_SIZES.note} anchor="start" color="var(--muted)" mono>{h}</HandText>
              ))}
              {s.flat.map((row, k) => (
                <g key={k}>
                  {[row.u, row.d, row.st].map((t, c) => (
                    <HandText key={c} x={FLAT_X[c]} y={108 + k * 24} size={TEXT_SIZES.note} anchor="start" mono>{t}</HandText>
                  ))}
                </g>
              ))}
              <HandText x={340} y={276} size={TEXT_SIZES.note} color="var(--muted)">partition key: userId · sort key: orderDate</HandText>
            </g>
          )}
          {s.parts &&
            s.parts.map((rows, p) => {
              const muted = s.mutedParts?.includes(p) ?? false;
              const top = PCY - PH / 2;
              return (
                <Fade key={p} step={i} born={1}>
                  <SketchBox cx={PX[p]} cy={PCY} w={PW} h={PH} r={8} seed={seedOf(`ddbpart${p}`)} stroke={muted ? 'var(--muted)' : 'var(--fg)'} fill="var(--surface)" />
                  <HandText x={PX[p]} y={top + 17} size={TEXT_SIZES.note} color={muted ? 'var(--muted)' : 'var(--fg)'}>{`Partition ${p + 1}`}</HandText>
                  <line x1={PX[p] - PW / 2 + 8} x2={PX[p] + PW / 2 - 8} y1={top + 31} y2={top + 31} stroke="var(--border)" />
                  {rows.map((row, k) => (
                    <g key={`${row.u}${row.d}`}>
                      {rowText(PX[p] - PW / 2 + 14, top + 52 + k * 24, row, 'start', `${row.u} ${row.d} ${row.st}`, muted)}
                    </g>
                  ))}
                </Fade>
              );
            })}
          {s.parts && (
            <HandText x={340} y={180} size={TEXT_SIZES.note} color="var(--muted)">partition key userId · sort key orderDate</HandText>
          )}
          {s.note && !s.gsi && <HandText x={340} y={202} size={TEXT_SIZES.label} color={TONE[s.noteTone ?? 'muted']}>{s.note}</HandText>}

          {!s.gsi && !s.flat && (
            <g>
              <SketchBox cx={340} cy={308} w={640} h={166} r={12} seed={seedOf('ddbnogsi')} stroke="var(--muted)" dashed />
              <HandText x={340} y={308} size={TEXT_SIZES.label} color="var(--muted)">{'no secondary index yet\nonly the primary key can be queried'}</HandText>
            </g>
          )}
          {s.gsi && (
            <Fade step={i} born={4}>
              <SketchArrow points={[[340, 190], [340, 216]]} stroke="var(--muted)" seed={seedOf('ddbgsiarrow')} dashed />
              <HandText x={420} y={202} size={TEXT_SIZES.note} anchor="start" color={TONE[s.noteTone ?? 'muted']}>{s.note ?? ''}</HandText>
              <SketchBox cx={340} cy={308} w={640} h={166} r={12} seed={seedOf('ddbgsi')} stroke={i === 5 ? 'var(--warn)' : 'var(--accent)'} dashed={i === 5} />
              <HandText x={340} y={238} size={TEXT_SIZES.heading}>GSI: partition key status, sort key orderDate</HandText>
              {(['pending', 'shipped'] as const).map((st, c) => {
                const x0 = c === 0 ? 70 : 380;
                return (
                  <g key={st}>
                    <HandText x={x0} y={266} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">{`status = ${st}`}</HandText>
                    {s.gsi![st].map((row, k) => (
                      <g key={`${row.u}${row.d}`}>{rowText(x0, 290 + k * 22, row, 'start', `${row.d} ${row.u}`, false)}</g>
                    ))}
                  </g>
                );
              })}
              {i === 5 && <HandText x={560} y={340} size={TEXT_SIZES.note} color="var(--warn)">{'03-15 u3 not here yet'}</HandText>}
            </Fade>
          )}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
