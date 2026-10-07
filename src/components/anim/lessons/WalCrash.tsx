import AnimFrame from '../AnimFrame';
import FlowDiagram, { type FlowEdge, type FlowGroup, type FlowNode, type FlowNote, type FlowPacket, type Tone } from '../FlowDiagram';

interface WalStep {
  caption: string;
  ram: { wbuf: string; pool: string; tone?: Tone };
  disk: { wal: string; data: string; dataTone?: Tone };
  active: string[];
  packets: FlowPacket[];
  note?: string;
  noteTone?: Tone;
}

const edges: FlowEdge[] = [
  { from: 'client', to: 'wbuf', label: 'COMMIT', head: 'both', labelAt: [0, -16] },
  { from: 'wbuf', to: 'wal', label: 'append + fsync', labelAt: [0, -16] },
  { from: 'pool', to: 'data', label: 'checkpoint', dashed: true, labelAt: [0, -16] },
  { from: 'wal', to: 'pool', label: 'replay', dashed: true, bend: -30, labelAt: [-40, 6] },
];

const groups: FlowGroup[] = [
  { x: 190, y: 10, w: 270, h: 330, label: 'RAM: lost on crash' },
  { x: 560, y: 10, w: 330, h: 330, label: 'Disk: survives a crash' },
];

const steps: WalStep[] = [
  {
    caption: 'A bank table sits on disk in one page: A = 100, B = 50. A copy of the page is cached in RAM. We want to move 30 from A to B. The data file, the log buffer, and the log file are all calm.',
    ram: { wbuf: 'empty', pool: 'A=100  B=50' },
    disk: { wal: 'empty', data: 'A=100  B=50' },
    active: [],
    packets: [],
  },
  {
    caption: 'The client sends BEGIN, two UPDATEs, COMMIT. The database does not touch the data file yet. It first writes one record to the log buffer in RAM: "txn 41: A=70, B=80, commit".',
    ram: { wbuf: 'txn 41 record', pool: 'A=100  B=50' },
    disk: { wal: 'empty', data: 'A=100  B=50' },
    active: ['wbuf'],
    packets: [{ from: 'client', to: 'wbuf', label: 'txn 41' }],
  },
  {
    caption: 'The record is appended to the log file and flushed (fsync). One sequential write. Now the commit is durable: the change survives a power cut. The data file is still old, and that is fine.',
    ram: { wbuf: 'txn 41 record', pool: 'A=100  B=50' },
    disk: { wal: 'txn 41 ✓ (fsynced)', data: 'A=100  B=50' },
    active: ['wal'],
    packets: [{ from: 'wbuf', to: 'wal', label: 'append', tone: 'ok' }],
    note: 'durable here',
    noteTone: 'ok',
  },
  {
    caption: 'Only now does the client get "OK". The rule: log first, acknowledge second. Everything after this point is housekeeping.',
    ram: { wbuf: 'txn 41 record', pool: 'A=100  B=50' },
    disk: { wal: 'txn 41 ✓ (fsynced)', data: 'A=100  B=50' },
    active: ['client'],
    packets: [{ from: 'wbuf', to: 'client', label: 'OK', tone: 'ok' }],
  },
  {
    caption: 'The database applies the change to the cached page in RAM. The page is now dirty: it differs from the copy on disk. It will be written out later, in a batch, at a convenient time.',
    ram: { wbuf: 'txn 41 record', pool: 'A=70  B=80  (dirty)' },
    disk: { wal: 'txn 41 ✓ (fsynced)', data: 'A=100  B=50  (stale)', dataTone: 'warn' },
    active: ['pool'],
    packets: [],
  },
  {
    caption: 'CRASH. Power fails. RAM is wiped, and the dirty page with it. The data file shows A=100, B=50, which is wrong. But the client was told "OK", so the system owes it A=70, B=80. The truth survives only in the log.',
    ram: { wbuf: 'lost', pool: 'lost', tone: 'bad' },
    disk: { wal: 'txn 41 ✓ (fsynced)', data: 'A=100  B=50  (stale)', dataTone: 'warn' },
    active: [],
    packets: [],
    note: 'POWER CUT',
    noteTone: 'bad',
  },
  {
    caption: 'Restart. Recovery reads the log from the last checkpoint and replays every committed record against the page. This is called redo. The page in RAM is rebuilt: A=70, B=80. No acknowledged write is lost.',
    ram: { wbuf: 'empty', pool: 'A=70  B=80  (redone)' },
    disk: { wal: 'txn 41 ✓ (fsynced)', data: 'A=100  B=50  (stale)', dataTone: 'warn' },
    active: ['pool'],
    packets: [{ from: 'wal', to: 'pool', label: 'redo', tone: 'ok' }],
  },
  {
    caption: 'Later, a checkpoint writes dirty pages to the data file. Then the log before that point is no longer needed and can be recycled. In PostgreSQL, checkpoints run at least every 5 minutes by default. A longer gap means more log to replay after a crash.',
    ram: { wbuf: 'empty', pool: 'A=70  B=80' },
    disk: { wal: 'checkpoint ● (old log recycled)', data: 'A=70  B=80' },
    active: ['data'],
    packets: [{ from: 'pool', to: 'data', label: 'flush', tone: 'ok' }],
  },
];

export default function WalCrash() {
  return (
    <AnimFrame title="Write-ahead log: commit, crash, recover" steps={steps} interval={3400}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'client', x: 85, y: 175, w: 110, label: 'Client' },
          { id: 'wbuf', x: 325, y: 100, w: 210, h: 74, label: 'Log buffer', sub: s.ram.wbuf, tone: s.ram.tone },
          { id: 'pool', x: 325, y: 250, w: 210, h: 74, label: 'Page in RAM', sub: s.ram.pool, tone: s.ram.tone },
          { id: 'wal', x: 725, y: 100, w: 270, h: 74, shape: 'db', label: 'Log file (WAL)', sub: s.disk.wal },
          { id: 'data', x: 725, y: 250, w: 270, h: 74, shape: 'db', label: 'Data file', sub: s.disk.data, tone: s.disk.dataTone },
        ];
        const notes: FlowNote[] = s.note ? [{ x: 460, y: 178, text: s.note, anchor: 'middle', tone: s.noteTone }] : [];
        return (
          <FlowDiagram width={900} height={350} nodes={nodes} edges={edges} groups={groups} notes={notes} active={s.active} packets={s.packets} stepKey={i} label="Write-ahead log timeline" />
        );
      }}
    </AnimFrame>
  );
}

interface NaiveStep {
  caption: string;
  p7: string;
  p9: string;
  p7tone?: Tone;
  p9tone?: Tone;
  active: string[];
  packets: FlowPacket[];
  note?: string;
  noteTone?: Tone;
}

const naiveEdges: FlowEdge[] = [
  { from: 'db', to: 'p7', label: 'write page 7', labelAt: [-10, -14] },
  { from: 'db', to: 'p9', label: 'write page 9', labelAt: [-10, 18] },
];

const naiveSteps: NaiveStep[] = [
  {
    caption: 'No log. The database writes pages straight to the data file. Account A lives on disk page 7. Account B lives on page 9. Money total: 100 + 50 = 150. Task: move 30 from A to B.',
    p7: 'A = 100',
    p9: 'B = 50',
    active: [],
    packets: [],
    note: 'total = 150',
  },
  {
    caption: 'Step 1 of the transfer: write A = 70 to page 7. The write succeeds. The transfer is half done.',
    p7: 'A = 70',
    p9: 'B = 50',
    p7tone: 'ok',
    active: ['p7'],
    packets: [{ from: 'db', to: 'p7', label: 'A=70', tone: 'ok' }],
    note: 'total = 120',
    noteTone: 'warn',
  },
  {
    caption: 'CRASH, before page 9 is written. Two pages cannot be written as one atomic step. The disk only promises one sector (512 B or 4 KB) at a time.',
    p7: 'A = 70',
    p9: 'B = 50',
    p7tone: 'ok',
    p9tone: 'bad',
    active: [],
    packets: [{ from: 'db', to: 'p9', label: 'B=80', tone: 'bad' }],
    note: 'POWER CUT',
    noteTone: 'bad',
  },
  {
    caption: 'After restart the data file says A = 70, B = 50. 30 units are gone. Nothing on disk says a transfer was in progress, so the database cannot detect it or fix it. This is corruption. The log fixes it.',
    p7: 'A = 70',
    p9: 'B = 50',
    p7tone: 'bad',
    p9tone: 'bad',
    active: [],
    packets: [],
    note: 'total = 120. 30 vanished.',
    noteTone: 'bad',
  },
];

export function NaiveWrite() {
  return (
    <AnimFrame title="Without a log: a crash between two page writes" steps={naiveSteps} interval={3000}>
      {(i, s) => {
        const nodes: FlowNode[] = [
          { id: 'db', x: 150, y: 120, w: 190, h: 74, label: 'Database', sub: 'transfer 30 from A to B' },
          { id: 'p7', x: 600, y: 55, w: 230, h: 70, shape: 'db', label: 'Disk page 7', sub: s.p7, tone: s.p7tone },
          { id: 'p9', x: 600, y: 190, w: 230, h: 70, shape: 'db', label: 'Disk page 9', sub: s.p9, tone: s.p9tone },
        ];
        const notes: FlowNote[] = s.note ? [{ x: 450, y: 262, text: s.note, anchor: 'middle', tone: s.noteTone, size: 17 }] : [];
        return <FlowDiagram width={900} height={290} nodes={nodes} edges={naiveEdges} notes={notes} active={s.active} packets={s.packets} stepKey={i} label="Crash between two page writes" />;
      }}
    </AnimFrame>
  );
}
