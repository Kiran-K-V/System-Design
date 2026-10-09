import AnimFrame from '../AnimFrame';
import { Fade } from '../data-kit';
import { HandText, SketchArrow, SketchBox, SketchSvg, seedOf } from '../sketch';

interface Entry {
  k: string;
  /** null is a tombstone: a marker that says "this key was deleted". */
  v: string | null;
  tone?: 'ok' | 'bad' | 'warn';
}

interface Sst {
  slot: 1 | 2 | 3;
  name: string;
  entries: Entry[];
  old?: boolean;
  born: number;
}

interface Probe {
  at: 'mem' | 's1' | 's2';
  text: string;
  tone: 'ok' | 'bad' | 'muted';
}

interface LsmStep {
  caption: string;
  mem: Entry[];
  wal: Entry[];
  ssts: Sst[];
  probes?: Probe[];
  walArrow?: boolean;
  flush?: 1 | 2;
  merge?: boolean;
}

const e = (k: string, v: string | null, tone?: Entry['tone']): Entry => ({ k, v, tone });

const S1: Sst = { slot: 1, name: 'SST-1', born: 3, entries: [e('a', '1'), e('b', '2'), e('c', '3')] };
const S2: Sst = { slot: 2, name: 'SST-2', born: 5, entries: [e('a', '9'), e('c', null), e('d', '4')] };
const S3: Sst = { slot: 3, name: 'SST-3', born: 8, entries: [e('a', '9', 'ok'), e('b', '2', 'ok'), e('d', '4', 'ok')] };

const steps: LsmStep[] = [
  {
    caption: 'An LSM engine has three parts. A memtable: a sorted map in RAM. A write-ahead log on disk, for crash safety (lesson 4.2). And SSTables: sorted, immutable files on disk. Our memtable holds only 3 entries so we can watch it fill.',
    mem: [],
    wal: [],
    ssts: [],
  },
  {
    caption: 'put(a,1), put(c,3). Each write is appended to the log (sequential, fast) and inserted into the memtable. No disk page is read or rewritten. This is why LSM engines absorb heavy writes.',
    mem: [e('a', '1'), e('c', '3')],
    wal: [e('a', '1'), e('c', '3')],
    ssts: [],
    walArrow: true,
  },
  {
    caption: 'put(b,2). The memtable keeps keys in sorted order: a, b, c. It is now full.',
    mem: [e('a', '1'), e('b', '2'), e('c', '3')],
    wal: [e('a', '1'), e('c', '3'), e('b', '2')],
    ssts: [],
    walArrow: true,
  },
  {
    caption: 'Flush. The whole sorted memtable is written to disk as one new file, an SSTable (sorted string table), in one sequential write. Files are never edited after this. The log is no longer needed for these writes and is recycled.',
    mem: [],
    wal: [],
    ssts: [S1],
    flush: 1,
  },
  {
    caption: 'More writes arrive: put(a,9) overwrites a, put(d,4) adds d, delete(c). A delete does not erase anything. It writes a marker called a tombstone. Old files cannot be edited, so deletion is just another write.',
    mem: [e('a', '9'), e('c', null, 'bad'), e('d', '4')],
    wal: [e('a', '9'), e('d', '4'), e('c', null, 'bad')],
    ssts: [S1],
    walArrow: true,
  },
  {
    caption: 'Second flush. SST-2 is written. Now key a lives in two files (a=1 old, a=9 new), and c lives in both as a value and as a tombstone. Disk space is being used by stale data. Compaction will fix that later.',
    mem: [],
    wal: [],
    ssts: [S1, S2],
    flush: 2,
  },
  {
    caption: 'Read get(a). Check the memtable first, then files from newest to oldest. SST-2 has a=9. Stop. The newest version wins. The old a=1 in SST-1 is never read.',
    mem: [],
    wal: [],
    ssts: [S1, S2],
    probes: [
      { at: 'mem', text: '1 miss', tone: 'muted' },
      { at: 's2', text: '2 hit: a=9', tone: 'ok' },
    ],
  },
  {
    caption: 'Read get(b). The memtable misses. SST-2 misses too: a small in-memory structure called a Bloom filter says "b is definitely not here", so we skip the disk read. SST-1 has b=2. The more files exist, the more places a read must look. This is read amplification.',
    mem: [],
    wal: [],
    ssts: [S1, S2],
    probes: [
      { at: 'mem', text: '1 miss', tone: 'muted' },
      { at: 's2', text: '2 skip (Bloom)', tone: 'muted' },
      { at: 's1', text: '3 hit: b=2', tone: 'ok' },
    ],
  },
  {
    caption: 'Compaction. A background job merge-sorts SST-1 and SST-2 into SST-3. For each key it keeps only the newest version. a=1 is dropped. The tombstone for c cancels c=3, and nothing older remains, so c disappears. Result: 3 entries instead of 6, and reads check one file. The cost: the data was rewritten once more (write amplification).',
    mem: [],
    wal: [],
    ssts: [{ ...S1, old: true }, { ...S2, old: true }, S3],
    merge: true,
  },
];

const BOX_TOP = 46;
const rowsH = (n: number) => 34 + Math.max(n, 3) * 25 + 6;

function EntryBox({
  x,
  y,
  w,
  title,
  entries,
  stroke = 'var(--fg)',
  dashed,
  fill,
  seed,
}: {
  x: number;
  y: number;
  w: number;
  title: string;
  entries: Entry[];
  stroke?: string;
  dashed?: boolean;
  fill?: string;
  seed: string;
}) {
  const h = rowsH(3);
  return (
    <g>
      <SketchBox cx={x + w / 2} cy={y + h / 2} w={w} h={h} r={8} seed={seedOf(seed)} stroke={stroke} dashed={dashed} fill={fill ?? 'var(--surface)'} fillStyle="solid" />
      <HandText x={x + w / 2} y={y + 17} size={16} weight={700} color={dashed ? 'var(--muted)' : 'var(--fg)'}>
        {title}
      </HandText>
      <line x1={x + 8} x2={x + w - 8} y1={y + 32} y2={y + 32} stroke="var(--border)" />
      {entries.length === 0 && (
        <HandText x={x + w / 2} y={y + 32 + 38} size={15} color="var(--muted)">
          empty
        </HandText>
      )}
      {entries.map((en, i) => (
        <HandText
          key={`${en.k}-${i}`}
          x={x + 16}
          y={y + 32 + 16 + i * 25}
          size={15}
          mono
          anchor="start"
          color={en.tone === 'bad' ? 'var(--bad)' : en.tone === 'ok' ? 'var(--ok)' : dashed ? 'var(--muted)' : 'var(--fg)'}
        >
          {en.v === null ? `${en.k} = ✗ del` : `${en.k} = ${en.v}`}
        </HandText>
      ))}
    </g>
  );
}

const SLOT_X: Record<1 | 2 | 3, number> = { 1: 336, 2: 490, 3: 413 };
const SST_W = 140;

export default function LsmFlow() {
  return (
    <AnimFrame title="LSM tree: write, flush, read, compact" steps={steps} interval={3800}>
      {(i, s) => {
        const walY = 246;
        const merged = s.merge;
        return (
          <SketchSvg width={640} height={382} label="LSM tree with memtable, write-ahead log and SSTable files">
            <SketchBox cx={105} cy={190} w={200} h={360} r={14} dashed stroke="var(--muted)" seed={seedOf('ram-grp')} />
            <HandText x={16} y={16} size={14} anchor="start" color="var(--muted)">
              RAM
            </HandText>
            <SketchBox cx={426} cy={190} w={418} h={360} r={14} dashed stroke="var(--muted)" seed={seedOf('disk-grp')} />
            <HandText x={228} y={16} size={14} anchor="start" color="var(--muted)">
              Disk (files are never edited)
            </HandText>

            <EntryBox x={15} y={BOX_TOP} w={180} title="Memtable (sorted)" entries={s.mem} seed="mem" stroke={s.mem.length === 3 ? 'var(--warn)' : 'var(--fg)'} />
            <HandText x={105} y={BOX_TOP + rowsH(3) + 24} size={14} color="var(--muted)">
              {`${s.mem.length} / 3 entries`}
            </HandText>

            <EntryBox x={224} y={walY} w={118} title="WAL" entries={s.wal} seed="wal" />

            {s.walArrow && (
              <SketchArrow points={[[110, BOX_TOP + rowsH(3) + 36], [160, 300], [218, 304]]} stroke="var(--accent)" seed={seedOf('wal-arrow' + i)} />
            )}
            {s.walArrow && (
              <HandText x={105} y={296} size={14} color="var(--accent)">
                {'append\nfirst'}
              </HandText>
            )}
            {s.flush && (
              <Fade step={i} born={i}>
                <SketchArrow points={[[198, BOX_TOP + 55], [SLOT_X[s.flush] - 6, BOX_TOP + 55]]} stroke="var(--accent)" seed={seedOf('flush' + s.flush)} />
                <HandText x={(198 + SLOT_X[s.flush]) / 2 - 22} y={BOX_TOP + 36} size={14} color="var(--accent)">
                  flush
                </HandText>
              </Fade>
            )}

            {s.ssts.map((t) => {
              const y = t.slot === 3 ? walY : BOX_TOP;
              return (
                <Fade key={t.name} step={i} born={t.born}>
                  <EntryBox x={SLOT_X[t.slot]} y={y} w={SST_W} title={t.name} entries={t.entries} seed={t.name} dashed={t.old} stroke={t.slot === 3 ? 'var(--ok)' : 'var(--fg)'} />
                </Fade>
              );
            })}
            {merged && (
              <Fade step={i} born={8}>
                <SketchArrow points={[[SLOT_X[1] + 70, BOX_TOP + rowsH(3) + 6], [SLOT_X[3] + 40, walY - 6]]} stroke="var(--ok)" seed={seedOf('m1')} />
                <SketchArrow points={[[SLOT_X[2] + 70, BOX_TOP + rowsH(3) + 6], [SLOT_X[3] + 100, walY - 6]]} stroke="var(--ok)" seed={seedOf('m2')} />
                <HandText x={278} y={170} size={14} color="var(--ok)">
                  {'merge-sort,\nkeep newest'}
                </HandText>
              </Fade>
            )}
            {s.probes?.map((p) => {
              const x = p.at === 'mem' ? 105 : SLOT_X[p.at === 's1' ? 1 : 2] + SST_W / 2;
              return (
                <HandText key={p.at} x={x} y={BOX_TOP - 12} size={14.5} weight={700} color={p.tone === 'ok' ? 'var(--ok)' : p.tone === 'bad' ? 'var(--bad)' : 'var(--muted)'}>
                  {p.text}
                </HandText>
              );
            })}
            {i === 0 && (
              <HandText x={SLOT_X[1] + 110} y={BOX_TOP + 55} size={15} color="var(--muted)">
                {'SSTables will\nappear here'}
              </HandText>
            )}
          </SketchSvg>
        );
      }}
    </AnimFrame>
  );
}
