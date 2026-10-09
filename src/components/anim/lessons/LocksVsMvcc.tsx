import AnimFrame from '../AnimFrame';
import { TONE, type Tone } from '../FlowDiagram';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

/** One row, one writer, one reader. Left: classic locking. Right: multi-version concurrency control (MVCC). Both panels advance on the same step. */

interface Ver {
  label: string;
  tone?: Tone;
  dashed?: boolean;
}

interface Panel {
  versions: Ver[];
  /** Short red/green tag above the row. */
  tag?: { text: string; tone: Tone };
  writer: string;
  writerName?: string;
  writerTone?: Tone;
  reader: string;
  readerTone?: Tone;
  readerName: string;
  /** Arrow from the reader to the row is dashed when the reader waits. */
  readerWaits?: boolean;
  noReader?: boolean;
}

interface Step {
  caption: string;
  lock: Panel;
  mvcc: Panel;
}

const steps: Step[] = [
  {
    caption: 'Row X holds the value 100. Two designs protect it from concurrent access. On the left, readers and writers take locks. On the right, the database keeps several versions of the row (MVCC, multi-version concurrency control). Nothing has happened yet.',
    lock: { versions: [{ label: 'X = 100' }], writer: 'idle', reader: 'idle', readerName: 'Reader R' },
    mvcc: { versions: [{ label: 'v1: X = 100' }], writer: 'idle', reader: 'idle', readerName: 'Reader R' },
  },
  {
    caption: 'Writer W runs UPDATE X = 150. Locking: W takes a lock on X and changes it in place. MVCC: W adds a new version v2 beside v1. W has not committed, so v2 is not visible to anyone else, and v1 stays as the committed value.',
    lock: { versions: [{ label: 'X = 150', dashed: true }], tag: { text: 'locked by W', tone: 'warn' }, writer: 'UPDATE X = 150', writerTone: 'accent', reader: 'idle', readerName: 'Reader R' },
    mvcc: { versions: [{ label: 'v1: X = 100' }, { label: 'v2: X = 150', dashed: true }], writer: 'UPDATE X = 150', writerTone: 'accent', reader: 'idle', readerName: 'Reader R' },
  },
  {
    caption: 'Reader R runs SELECT X while W is still open. Locking: R needs a read lock, W holds the lock, so R waits. MVCC: R reads the newest committed version, v1, and gets 100 at once. This is the PostgreSQL rule: "reading never blocks writing and writing never blocks reading".',
    lock: { versions: [{ label: 'X = 150', dashed: true }], tag: { text: 'locked by W', tone: 'warn' }, writer: 'UPDATE X = 150', writerTone: 'accent', reader: 'SELECT X: waiting...', readerTone: 'bad', readerName: 'Reader R', readerWaits: true },
    mvcc: { versions: [{ label: 'v1: X = 100', tone: 'ok' }, { label: 'v2: X = 150', dashed: true }], writer: 'UPDATE X = 150', writerTone: 'accent', reader: 'SELECT X -> 100', readerTone: 'ok', readerName: 'Reader R' },
  },
  {
    caption: 'W commits. Locking: the lock is released, R wakes up and reads 150. R waited for the whole length of W\'s transaction. MVCC: v2 becomes the committed version. R already has its answer, 100. A reader that starts now sees 150. Old version v1 is kept until no transaction can need it, then cleaned up.',
    lock: { versions: [{ label: 'X = 150', tone: 'ok' }], writer: 'COMMIT', writerTone: 'ok', reader: 'SELECT X -> 150\n(after waiting)', readerTone: 'warn', readerName: 'Reader R' },
    mvcc: { versions: [{ label: 'v1: X = 100', dashed: true }, { label: 'v2: X = 150', tone: 'ok' }], writer: 'COMMIT', writerTone: 'ok', reader: 'got 100, no wait', readerTone: 'ok', readerName: 'Reader R' },
  },
  {
    caption: 'Two writers on the same row. W1 has updated X and not committed. W2 now runs UPDATE X too. Both designs make W2 wait for W1\'s row lock. MVCC removes read-write blocking only. Write-write conflicts still queue, and that is where hot rows get slow.',
    lock: { versions: [{ label: 'X = 200', dashed: true }], tag: { text: 'locked by W1', tone: 'warn' }, writer: 'UPDATE X = 200', writerName: 'Writer W1', writerTone: 'accent', reader: 'UPDATE X\nwaiting...', readerTone: 'bad', readerName: 'Writer W2', readerWaits: true },
    mvcc: { versions: [{ label: 'v2: X = 150' }, { label: 'v3: X = 200', dashed: true }], tag: { text: 'row lock: W1', tone: 'warn' }, writer: 'UPDATE X = 200', writerName: 'Writer W1', writerTone: 'accent', reader: 'UPDATE X\nwaiting...', readerTone: 'bad', readerName: 'Writer W2', readerWaits: true },
  },
];

const PW = 340;

function PanelView({ p, title, x0 }: { p: Panel; title: string; x0: number }) {
  const cx = x0 + PW / 2;
  const n = p.versions.length;
  const vw = n === 1 ? 150 : 140;
  const rowY = 118;
  const xs = n === 1 ? [cx] : [cx - 74, cx + 74];
  const wx = x0 + 78;
  const rx = x0 + PW - 78;
  return (
    <g>
      <SketchBox cx={cx} cy={175} w={PW - 10} h={330} r={14} dashed stroke="var(--muted)" seed={seedOf(`pn${title}`)} />
      <HandText x={cx} y={30} size={16} weight={700}>
        {title}
      </HandText>
      {p.tag && (
        <HandText x={cx} y={rowY - 44} size={14} weight={700} color={TONE[p.tag.tone]}>
          {p.tag.text}
        </HandText>
      )}
      {p.versions.map((v, i) => (
        <g key={v.label}>
          <SketchBox cx={xs[i]} cy={rowY} w={vw} h={44} r={8} seed={seedOf(`${title}${v.label}`)} stroke={v.tone ? TONE[v.tone] : undefined} dashed={v.dashed} fill="var(--surface)" fillStyle="solid" />
          <HandText x={xs[i]} y={rowY} size={14}>
            {v.label}
          </HandText>
        </g>
      ))}
      <HandText x={cx} y={rowY + 40} size={14} color="var(--muted)">
        {n === 1 ? 'one row, changed in place' : 'versions of one row'}
      </HandText>
      <SketchBox cx={wx} cy={250} w={130} h={40} r={8} seed={seedOf(`${title}w`)} fill="var(--bg)" fillStyle="solid" />
      <HandText x={wx} y={250} size={14} weight={700}>
        {p.writerName ?? 'Writer W'}
      </HandText>
      <HandText x={wx} y={286} size={14} color={p.writerTone ? TONE[p.writerTone] : 'var(--muted)'}>
        {p.writer}
      </HandText>
      <SketchBox cx={rx} cy={250} w={130} h={40} r={8} seed={seedOf(`${title}r`)} fill="var(--bg)" fillStyle="solid" />
      <HandText x={rx} y={250} size={14} weight={700}>
        {p.readerName}
      </HandText>
      <HandText x={rx} y={296} size={14} color={p.readerTone ? TONE[p.readerTone] : 'var(--muted)'}>
        {p.reader}
      </HandText>
      <SketchArrow points={[[wx + 10, 228], [xs[0] - 20, rowY + 26]]} stroke={p.writerTone ? TONE[p.writerTone] : 'var(--muted)'} seed={seedOf(`${title}wa`)} />
      <SketchArrow
        points={[[rx - 10, 228], [xs[n - 1] + 20, rowY + 26]]}
        stroke={p.readerTone ? TONE[p.readerTone] : 'var(--muted)'}
        dashed={p.readerWaits}
        seed={seedOf(`${title}ra`)}
      />
    </g>
  );
}

export default function LocksVsMvcc() {
  return (
    <AnimFrame title="Locks vs MVCC: what a reader does while a writer is open" steps={steps} interval={4200}>
      {(_, s) => (
        <SketchSvg width={700} height={350} label="Side by side: with locks a reader waits for the writer. With multi-version concurrency control the reader reads the old version immediately.">
          <PanelView p={s.lock} title="Locking" x0={5} />
          <PanelView p={s.mvcc} title="MVCC (PostgreSQL, InnoDB)" x0={355} />
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
