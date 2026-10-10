import AnimFrame from '../AnimFrame';
import { TONE, type Tone } from '../FlowDiagram';
import { Fade } from '../data-kit';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

/** One row version in the table's heap page. xmin: transaction that created it. xmax: transaction that deleted or replaced it, 0 if none. */
interface Ver {
  slot: 0 | 1 | 2;
  xmin: number;
  xmax: number;
  bal: number;
  tag: string;
  tone: Tone;
  dashed?: boolean;
}

interface Actor {
  id: 'r' | 'w' | 'n';
  label: string;
  sub: string;
  tone: Tone;
  /** Slot of the version this actor is reading or writing. */
  at?: 0 | 1 | 2;
  /** Arrow points from the version to the actor when the actor reads, to the version when it writes. */
  dashed?: boolean;
}

interface Step {
  caption: string;
  vers: Ver[];
  actors: Actor[];
  /** Short status line under the page. */
  note?: string;
  noteTone?: Tone;
}

const V1 = (o: Partial<Ver> = {}): Ver => ({ slot: 0, xmin: 10, xmax: 0, bal: 100, tag: 'live', tone: 'default', ...o });
const V2 = (o: Partial<Ver> = {}): Ver => ({ slot: 1, xmin: 20, xmax: 0, bal: 150, tag: 'uncommitted', tone: 'warn', dashed: true, ...o });

const steps: Step[] = [
  {
    caption: 'A table row sits in an 8 KB heap page. PostgreSQL stamps every row version with two hidden columns. xmin is the ID of the transaction that created it. xmax is the ID of the transaction that deleted it, or 0 if nobody did. Transaction 10 inserted this row, balance 100.',
    vers: [V1()],
    actors: [],
  },
  {
    caption: 'Reader R starts a transaction at Repeatable Read. It takes a snapshot: "I see everything committed up to transaction 10." Under Read Committed, the default, a new snapshot is taken for each statement. Repeatable Read keeps one snapshot for the whole transaction, and that makes the next steps easy to see.',
    vers: [V1()],
    actors: [{ id: 'r', label: 'Reader R', sub: 'snapshot: up to 10', tone: 'accent' }],
  },
  {
    caption: 'Writer W (transaction 20) runs UPDATE balance = 150. PostgreSQL does not overwrite the row. It stamps the old version with xmax = 20 and inserts a second version, v2, with xmin = 20. Both versions now sit in the page. W has not committed.',
    vers: [V1({ xmax: 20, tag: 'old, xmax set', tone: 'warn' }), V2()],
    actors: [
      { id: 'r', label: 'Reader R', sub: 'snapshot: up to 10', tone: 'muted' },
      { id: 'w', label: 'Writer W', sub: 'txid 20, open', tone: 'accent', at: 1 },
    ],
  },
  {
    caption: 'R reads the row. Version v1 was created by 10, which R can see. Its xmax is 20, but 20 is not committed in R\'s snapshot, so the delete does not count. Version v2 was created by 20, which R cannot see. R gets 100 and does not wait for W. This is why reading never blocks writing.',
    vers: [V1({ xmax: 20, tag: 'R sees this', tone: 'ok' }), V2({ tag: 'invisible to R', tone: 'muted' })],
    actors: [
      { id: 'r', label: 'Reader R', sub: 'reads 100', tone: 'ok', at: 0 },
      { id: 'w', label: 'Writer W', sub: 'txid 20, open', tone: 'muted' },
    ],
  },
  {
    caption: 'W commits. A new transaction N (ID 30) starts and reads. For N, transaction 20 is committed, so v1 is dead (replaced) and v2 is live. N gets 150. R, still on its old snapshot, would read 100 again. Two readers, two answers, no locks.',
    vers: [V1({ xmax: 20, tag: 'dead for N, live for R', tone: 'warn' }), V2({ tag: 'N sees this', tone: 'ok', dashed: false })],
    actors: [
      { id: 'r', label: 'Reader R', sub: 'still reads 100', tone: 'muted', at: 0 },
      { id: 'n', label: 'Reader N', sub: 'txid 30, reads 150', tone: 'ok', at: 1 },
    ],
  },
  {
    caption: 'VACUUM runs. It may remove a dead version only when no open snapshot can still see it. R is still open and still needs v1, so v1 stays. A long-running transaction holds back cleanup for the whole table. This is the main way bloat starts.',
    vers: [V1({ xmax: 20, tag: 'kept: R needs it', tone: 'warn' }), V2({ tag: 'live', tone: 'default', dashed: false })],
    actors: [
      { id: 'r', label: 'Reader R', sub: 'still open', tone: 'warn', at: 0 },
    ],
    note: 'VACUUM: nothing removed',
    noteTone: 'warn',
  },
  {
    caption: 'R commits, so no snapshot can see v1 any more. The next VACUUM removes the dead version and marks its slot free for reuse. A plain VACUUM does not shrink the file and give space back to the operating system. VACUUM FULL does, but it takes an ACCESS EXCLUSIVE lock on the table.',
    vers: [V2({ slot: 1, tag: 'live', tone: 'default', dashed: false })],
    actors: [],
    note: 'VACUUM: v1 removed, slot reusable',
    noteTone: 'ok',
  },
];

const SLOT_Y = [112, 172, 232];
const PAGE_CX = 450;
const ROW_W = 400;

function VerRow({ v }: { v: Ver }) {
  const cy = SLOT_Y[v.slot];
  const x0 = PAGE_CX - ROW_W / 2;
  const color = TONE[v.tone];
  const muted = v.tone === 'muted';
  return (
    <g>
      <SketchBox cx={PAGE_CX} cy={cy} w={ROW_W} h={44} r={8} seed={seedOf(`pgrow${v.slot}`)} stroke={color} dashed={v.dashed} fill={v.tone === 'ok' ? 'var(--ok)' : v.tone === 'warn' ? 'var(--warn)' : undefined} strokeWidth={v.tone === 'ok' ? 2.2 : 1.4} />
      <HandText x={x0 + 14} y={cy} size={TEXT_SIZES.label} anchor="start" mono color={muted ? 'var(--muted)' : 'var(--fg)'}>{`v${v.slot + 1}`}</HandText>
      <HandText x={x0 + 52} y={cy} size={TEXT_SIZES.note} anchor="start" mono color={muted ? 'var(--muted)' : 'var(--fg)'}>{`xmin=${v.xmin}`}</HandText>
      <HandText x={x0 + 132} y={cy} size={TEXT_SIZES.note} anchor="start" mono color={v.xmax ? 'var(--warn)' : muted ? 'var(--muted)' : 'var(--fg)'}>{`xmax=${v.xmax}`}</HandText>
      <HandText x={x0 + 212} y={cy} size={TEXT_SIZES.note} anchor="start" mono color={muted ? 'var(--muted)' : 'var(--fg)'}>{`bal=${v.bal}`}</HandText>
      <HandText x={x0 + ROW_W - 10} y={cy} size={TEXT_SIZES.note} anchor="end" color={color === 'var(--fg)' ? 'var(--muted)' : color}>{v.tag}</HandText>
    </g>
  );
}

const ACTOR_Y = { r: 112, w: 172, n: 232 } as const;

export default function PgMvcc() {
  return (
    <AnimFrame title="MVCC: row versions, readers, and VACUUM" steps={steps} interval={4200}>
      {(i, s) => {
        const left = PAGE_CX - ROW_W / 2;
        const used = new Set(s.vers.map((v) => v.slot));
        return (
          <SketchSvg width={680} height={318} label="A heap page holding row versions with xmin and xmax, and the readers and writer that see them">
            <SketchBox cx={PAGE_CX} cy={166} w={ROW_W + 36} h={222} r={14} dashed stroke="var(--muted)" seed={seedOf('pgpage')} />
            <HandText x={left - 8} y={34} size={TEXT_SIZES.heading} anchor="start">Heap page of table accounts</HandText>
            <HandText x={PAGE_CX + ROW_W / 2 + 12} y={34} size={TEXT_SIZES.note} anchor="end" color="var(--muted)">3 slots shown</HandText>

            {[0, 1, 2].filter((k) => !used.has(k as 0 | 1 | 2)).map((k) => (
              <g key={`free${k}`}>
                <SketchBox cx={PAGE_CX} cy={SLOT_Y[k]} w={ROW_W} h={44} r={8} seed={seedOf(`pgfree${k}`)} stroke="var(--muted)" dashed />
                <HandText x={PAGE_CX} y={SLOT_Y[k]} size={TEXT_SIZES.note} color="var(--muted)">{i === 6 && k === 0 ? 'free: reusable after VACUUM' : 'free slot'}</HandText>
              </g>
            ))}
            {s.vers.map((v) => (
              <Fade key={v.slot} step={i} born={v.slot === 1 ? 2 : 0}>
                <VerRow v={v} />
              </Fade>
            ))}

            {s.actors.map((a) => {
              const cy = ACTOR_Y[a.id];
              const color = TONE[a.tone];
              return (
                <g key={a.id}>
                  <SketchBox cx={80} cy={cy} w={136} h={60} r={8} seed={seedOf(`pgactor${a.id}`)} stroke={color} strokeWidth={a.tone === 'accent' || a.tone === 'ok' ? 2.2 : 1.4} />
                  <HandText x={80} y={cy - 9} size={TEXT_SIZES.label} color={a.tone === 'muted' ? 'var(--muted)' : 'var(--fg)'}>{a.label}</HandText>
                  <HandText x={80} y={cy + 13} size={TEXT_SIZES.note} color={color === 'var(--fg)' ? 'var(--muted)' : color}>{a.sub}</HandText>
                  {a.at !== undefined && (
                    <SketchArrow
                      points={[[150, cy], [left - 6, SLOT_Y[a.at]]]}
                      stroke={color}
                      seed={seedOf(`pgarrow${a.id}${i}`)}
                    />
                  )}
                </g>
              );
            })}

            {s.note && (
              <HandText x={PAGE_CX} y={296} size={TEXT_SIZES.label} color={TONE[s.noteTone ?? 'muted']}>{s.note}</HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
