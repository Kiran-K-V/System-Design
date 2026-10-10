import AnimFrame from '../AnimFrame';
import { TONE, type Tone } from '../FlowDiagram';
import { Fade } from '../data-kit';
import { HandText, SketchArrow, SketchBox, SketchSvg, TEXT_SIZES, seedOf } from '../sketch';

interface Entry {
  k: number;
  v: string;
  tone?: 'ok' | 'warn';
}

interface Box {
  entries: Entry[];
  old?: boolean;
}

interface Arrow {
  id: string;
  points: [number, number][];
  tone: Tone;
  label?: string;
  at?: [number, number];
}

interface Step {
  caption: string;
  write?: string;
  log: Entry[];
  mem: Entry[];
  sst1?: Box;
  sst2?: Box;
  sst3?: Box;
  arrows: Arrow[];
}

const e = (k: number, v: string, tone?: Entry['tone']): Entry => ({ k, v, tone });
const SST1: Box = { entries: [e(3, 'Bo'), e(7, 'Ana'), e(9, 'Cy')] };
const SST2: Box = { entries: [e(5, 'Di'), e(7, 'Ana2')] };

const steps: Step[] = [
  {
    caption: 'One replica node, three storage parts. The commit log is a file on disk. The memtable is a sorted structure in memory. SSTables are immutable sorted files on disk. This is the log-structured design from lesson 4.2. A client write for partition key 7 is about to arrive.',
    log: [],
    mem: [],
    arrows: [],
  },
  {
    caption: 'The write arrives: key 7, value Ana. First it is appended to the commit log. An append is sequential, which disks do fast. The commit log exists only for crash recovery.',
    write: 'write 7 = Ana',
    log: [e(7, 'Ana')],
    mem: [],
    arrows: [{ id: 'log', points: [[78, 196], [136, 238]], tone: 'accent' }],
  },
  {
    caption: 'Second, the write goes into the memtable. The memtable keeps keys in sorted order and lives in memory. No SSTable is read or changed.',
    write: 'write 7 = Ana',
    log: [e(7, 'Ana')],
    mem: [e(7, 'Ana')],
    arrows: [{ id: 'mem', points: [[78, 150], [136, 112]], tone: 'accent' }],
  },
  {
    caption: 'Both steps are done, so the replica answers OK. This replica did one sequential disk append and one memory insert. It did not wait for any SSTable. That is why Cassandra writes are fast.',
    write: 'ok',
    log: [e(7, 'Ana')],
    mem: [e(7, 'Ana')],
    arrows: [{ id: 'ack', points: [[136, 132], [78, 172]], tone: 'ok' }],
  },
  {
    caption: 'Two more writes: key 3 and key 9. The commit log keeps them in arrival order: 7, 3, 9. The memtable keeps them sorted: 3, 7, 9. The memtable stores writes in sorted order until it reaches a configurable limit. Our limit is three entries, and it is now full.',
    log: [e(7, 'Ana'), e(3, 'Bo'), e(9, 'Cy')],
    mem: [e(3, 'Bo'), e(7, 'Ana'), e(9, 'Cy')],
    arrows: [],
  },
  {
    caption: 'Flush. The memtable is written to disk as one SSTable, in one sequential write. SSTables are immutable: never written to again after the flush. The memtable starts empty. The commit log is not needed any more for these writes, because they now sit in an SSTable.',
    log: [],
    mem: [],
    sst1: SST1,
    arrows: [{ id: 'flush1', points: [[291, 108], [319, 108]], tone: 'accent', label: 'flush', at: [305, 90] }],
  },
  {
    caption: 'Key 5 arrives, and key 7 is updated to Ana2. Nothing is changed in place. The memtable fills again and is flushed to a second SSTable. Key 7 now exists in two files. A read for key 7 must find the newer one. The read may have to check several SSTables.',
    log: [],
    mem: [],
    sst1: SST1,
    sst2: SST2,
    arrows: [{ id: 'flush2', points: [[280, 170], [322, 214]], tone: 'accent', label: 'flush', at: [330, 186] }],
  },
  {
    caption: 'Compaction. A background job combines several SSTables into one. For key 7 it keeps the newest value, Ana2. Cassandra then removes the old SSTables once the new one is written. Reads touch fewer files. The cost is that the data is rewritten (write amplification).',
    log: [],
    mem: [],
    sst1: { ...SST1, old: true },
    sst2: { ...SST2, old: true },
    sst3: { entries: [e(3, 'Bo', 'ok'), e(5, 'Di', 'ok'), e(7, 'Ana2', 'ok'), e(9, 'Cy', 'ok')] },
    arrows: [
      { id: 'm1', points: [[471, 108], [509, 108]], tone: 'ok' },
      { id: 'm2', points: [[471, 232], [528, 171]], tone: 'ok' },
    ],
  },
];

const BW = 140;
const BH = 114;

function EntryBox({ cx, cy, title, entries, dashed, stroke = 'var(--fg)', seed }: { cx: number; cy: number; title: string; entries: Entry[]; dashed?: boolean; stroke?: string; seed: string }) {
  const top = cy - BH / 2;
  const muted = dashed ? 'var(--muted)' : 'var(--fg)';
  return (
    <g>
      <SketchBox cx={cx} cy={cy} w={BW} h={BH} r={8} seed={seedOf(seed)} stroke={dashed ? 'var(--muted)' : stroke} dashed={dashed} fill="var(--surface)" />
      <HandText x={cx} y={top + 17} size={TEXT_SIZES.note} color={muted}>{title}</HandText>
      <line x1={cx - BW / 2 + 8} x2={cx + BW / 2 - 8} y1={top + 31} y2={top + 31} stroke="var(--border)" />
      {entries.length === 0 && <HandText x={cx} y={top + 72} size={TEXT_SIZES.note} color="var(--muted)">empty</HandText>}
      {entries.map((en, i) => (
        <HandText key={`${en.k}-${i}`} x={cx - BW / 2 + 16} y={top + 48 + i * 22} size={TEXT_SIZES.note} mono anchor="start" color={en.tone === 'ok' ? 'var(--ok)' : muted}>
          {`${en.k} = ${en.v}`}
        </HandText>
      ))}
    </g>
  );
}

export default function CassWritePath() {
  return (
    <AnimFrame title="Cassandra write path on one replica" steps={steps} interval={4200}>
      {(i, s) => (
        <SketchSvg width={680} height={332} label="A write goes to the commit log and the memtable, the memtable is flushed to SSTables, and SSTables are compacted">
          <SketchBox cx={395} cy={168} w={548} h={300} r={14} dashed stroke="var(--muted)" seed={seedOf('cassnode')} />
          <HandText x={132} y={32} size={TEXT_SIZES.note} anchor="start" color="var(--muted)">One replica node</HandText>

          <SketchBox cx={45} cy={168} w={70} h={56} r={8} seed={seedOf('casscl')} stroke={s.write === 'ok' ? 'var(--ok)' : 'var(--fg)'} />
          <HandText x={45} y={168} size={TEXT_SIZES.label}>Client</HandText>
          {s.write && (
            <HandText x={45} y={222} size={TEXT_SIZES.note} mono color={s.write === 'ok' ? 'var(--ok)' : 'var(--accent)'}>{s.write === 'ok' ? 'OK' : s.write.replace('write ', 'put ')}</HandText>
          )}

          <EntryBox cx={215} cy={108} title="Memtable (RAM)" entries={s.mem} seed="cassmem" stroke={s.mem.length === 3 ? 'var(--warn)' : 'var(--fg)'} />
          <EntryBox cx={215} cy={248} title="Commit log (disk)" entries={s.log} seed="casslog" />
          {s.sst1 && (
            <Fade step={i} born={5}>
              <EntryBox cx={395} cy={108} title="SSTable 1" entries={s.sst1.entries} dashed={s.sst1.old} seed="casssst1" />
            </Fade>
          )}
          {s.sst2 && (
            <Fade step={i} born={6}>
              <EntryBox cx={395} cy={248} title="SSTable 2" entries={s.sst2.entries} dashed={s.sst2.old} seed="casssst2" />
            </Fade>
          )}
          {s.sst3 && (
            <Fade step={i} born={7}>
              <EntryBox cx={585} cy={108} title="SSTable 3" entries={s.sst3.entries} stroke="var(--ok)" seed="casssst3" />
            </Fade>
          )}
          {i === 0 && <HandText x={520} y={248} size={TEXT_SIZES.label} color="var(--muted)">{'SSTables appear\nhere after a flush'}</HandText>}
          {s.arrows.map((a) => (
            <g key={a.id}>
              <SketchArrow points={a.points} stroke={TONE[a.tone]} seed={seedOf(`cassarrow${a.id}`)} />
              {a.label && a.at && <HandText x={a.at[0]} y={a.at[1]} size={TEXT_SIZES.note} color={TONE[a.tone]}>{a.label}</HandText>}
            </g>
          ))}
        </SketchSvg>
      )}
    </AnimFrame>
  );
}
